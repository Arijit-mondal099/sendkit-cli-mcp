import { Hono, type Context } from "hono";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { generateClerkProtectedResourceMetadata } from "@clerk/mcp-tools/server";
import { createServer } from "./lib/create-server";
import { clerkClient, clerkPublishableKey } from "./lib/clerk";

const app = new Hono();
const port = Number(process.env.PORT ?? 4000);

function protectedResourceMetadataUrl(c: Context, botToken: string) {
  return new URL(`/.well-known/oauth-protected-resource/${botToken}/mcp`, c.req.url).toString();
}

function unauthorizedMcpResponse(c: Context, botToken: string) {
  c.header(
    "WWW-Authenticate",
    `Bearer resource_metadata="${protectedResourceMetadataUrl(c, botToken)}"`,
  );
  return c.json({ error: "Unauthorized" }, 401);
}

/*
 * MCP authentication route
 */
app.get(
  ".well-known/oauth-protected-resource/:botToken/mcp",
  async (c) => {
    return c.json(
      // This helper creates the OAuth metadata required by Clerk
      generateClerkProtectedResourceMetadata({
        publishableKey: clerkPublishableKey,

        // We create a new URL, keep the same origin from c.req.url, and replace the entire path with the first argument (/${botToken}/mcp) because it starts with /
        resourceUrl: new URL(`/${c.req.param("botToken")}/mcp`, c.req.url).toString(),
      }),
    );
  },
);

app.post("/:botToken/mcp", async (c) => {
  const botToken = c.req.param("botToken");
  const authHeader = c.req.header("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorizedMcpResponse(c, botToken);
  }

  try {
    const requestState = await clerkClient.authenticateRequest(c.req.raw, {
      acceptsToken: "oauth_token",
    });

    if (!requestState.isAuthenticated) {
      return unauthorizedMcpResponse(c, botToken);
    }
  } catch {
    return unauthorizedMcpResponse(c, botToken);
  }

  const server = createServer(botToken);

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  try {
    return await transport.handleRequest(c.req.raw);
  } catch (error) {
    await server.close();
  }
});

app.notFound((c) => {
  return c.json({ error: "Not found!" }, 404);
});

export default {
  port,
  fetch: (req: Request) => {
    const url = new URL(req.url);
    url.protocol = req.headers.get("x-forwarded-proto") ?? url.protocol;
    url.host = req.headers.get("x-forwarded-host") ?? url.host;

    return app.fetch(new Request(url, req));
  },
};

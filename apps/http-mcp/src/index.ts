import { Hono } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { sendTelegramMessage, telegramMessageInputSchema } from "sendkit-core";

function createServer(botToken: string) {
  const server = new McpServer({
    name: "sendkit-http-mcp",
    version: "0.0.0",
  });

  server.registerTool(
    "telegram",
    {
      title: "Telegram",
      description: "Send a message to telegram chat",
      inputSchema: telegramMessageInputSchema.shape,
    },
    async (input) => {
      const result = await sendTelegramMessage({
        ...input,
        botToken,
      });

      return {
        content: [
          {
            type: "text",
            text: `Sent telegram message ${result.messageId} to chat ${result.chatId}`,
          },
        ],
        structuredContent: result,
      };
    },
  );

  return server;
}

const app = new Hono();
const port = Number(process.env.PORT ?? 4000);

app.post("/:botToken/mcp", async (c) => {
  const botToken = c.req.param("botToken");
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
  fetch: app.fetch,
};

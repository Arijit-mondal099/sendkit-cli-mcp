import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sendTelegramMessage, telegramMessageInputSchema } from "sendkit-core";

export function createServer(botToken: string) {
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

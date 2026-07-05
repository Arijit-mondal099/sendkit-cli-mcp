import { Command } from "commander";
import { sendTelegramMessage } from "sendkit-core";

const program = new Command();

program
  .name("SendKit")
  .description("SendKit CLI tool")
  .command("Telegram")
  .description("Send a message to the telegram")
  .argument("<chatId>", "Telegram chat id")
  .argument("<message>", "Telegram message to send")
  .action(async (chatId: string, message: string) => {
    const token = process.env.TELEGRAM_BOT_KEY;

    if (!token) {
      console.error("Oops telegram bot secret key is not provided!");
      process.exit(1);
    }
    if (!chatId) {
      console.error("Oops telegram chatId is not provided!");
      process.exit(1);
    }
    if (!message) {
      console.error("Oops telegram message is not provided!");
      process.exit(1);
    }

    try {
      const res = await sendTelegramMessage({
        botToken: token,
        chatId,
        message,
      });

      console.log(`Send telegram message to chat: ${res.chatId}`);
      console.log(`Telegram message id: ${res.messageId}`);
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      console.log(`Telegram API requist faild: ${details}`);
      process.exit(1);
    }
  });

program.parseAsync(process.argv);

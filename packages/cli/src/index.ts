import { Command } from "commander";

type TelegramResponse = {
  ok: boolean;
  result?: {
    message_id?: number;
  };
  description?: string;
};

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

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      },
    );

    const data = (await response.json()) as TelegramResponse;

    if (!response.ok || !data.ok) {
      const details = data.description || response.statusText;
      console.log(`Telegram API request faild: ${details}`);
      process.exit(1);
    }

    const messageId = data.result?.message_id;

    console.log(`Message sent to telegram message id: ${messageId}`);

    if (messageId !== undefined) {
      console.log(`Telegram message id: ${messageId}`);
    }
  });

program.parseAsync(process.argv);

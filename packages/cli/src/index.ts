#!/usr/bin/env node
import { Command } from "commander";
import { sendTelegramMessage } from "@sendkit-cli-mcp/core";
import { z } from "zod";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const program = new Command();

// C:\Users\subha\.config\sendkit\config.json
const configPath = join(homedir(), ".config", "sendkit", "config.json");

const cliConfigSchema = z.object({
  telegramBotToken: z.string().min(1).optional(),
});

function writeTelegramBotToken(token: string) {
  mkdirSync(dirname(configPath), { recursive: true });

  // 0o600 = read/write for the owner only, no access for anyone else (Unix file permission, no effect on Windows)
  writeFileSync(configPath, `${JSON.stringify({ telegramBotToken: token }, null, 2)}\n`, {
    mode: 0o600,
  });
}

function getTelegramBotToken() {
  if (!existsSync(configPath)) {
    throw new Error("Telegram bot token is required. Run `sendkit init`.");
  }

  const config = cliConfigSchema.parse(JSON.parse(readFileSync(configPath, "utf8")));
  const token = config.telegramBotToken;

  if (!token) {
    throw new Error("Telegram bot token is required. Run `sendkit init`.");
  }

  return token;
}

program.name("SendKit").description("SendKit CLI backed by sendkit-core");

program
  .command("init")
  .description("Configure SendKit CLI local settings")
  .requiredOption("--telegram-bot-token <botToken>", "Telegram bot token")
  .action(async (options: { telegramBotToken: string }) => {
    writeTelegramBotToken(options.telegramBotToken);
    console.log(`Saved SendKit CLI config to ${configPath}`);
  });

program
  .command("telegram")
  .description("Send a message to the telegram")
  .argument("<chatId>", "Telegram chat id")
  .argument("<message>", "Telegram message to send")
  .action(async (chatId: string, message: string) => {
    const res = await sendTelegramMessage({
      botToken: getTelegramBotToken(),
      chatId,
      message,
    });

    console.log(JSON.stringify(res));
  });

await program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

import readline from "node:readline";

import { Events } from "discord.js";

import DiscordModule from "./module/DiscordModule";
import { On } from "./decorators/decorators";
import { ModuleOptions } from "./module/BaseModule";
import { PremiumStatus } from "../../database/model/GuildStatus";

export default class Console extends DiscordModule<"console"> {
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;

  private readonly rl: readline.Interface;
  private debugCommandLine: boolean = false;

  constructor(options: ModuleOptions) {
    super(options);

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: process.stdin.isTTY,
    });

    this.rl.on("line", (line) => {
      console.log(JSON.stringify(line));
      void this.execute(line.trim());
    });

    this.rl.on("close", () => {
      this.logger.warn("Console stdin closed.");
    });
  }

  @On(Events.ClientReady)
  private async setup() {
    this.logger.info("Console is running now!");

    this.rl.prompt();
  }

  private async execute(input: string) {
    if (!input) {
      this.rl.prompt();
      return;
    }

    const [command, ...args] = input.split(/\s+/);

    if (this.debugCommandLine) {
      console.log("[Console] command:", command);
      console.log("[Console] args:", args);
    }

    const commandList: { [key: string]: Function } = {
      status: () => {
        this.logger.info("Bot is running!");
      },
      cmdl: () => {
        this.debugCommandLine = !this.debugCommandLine;
        this.logger.info("Debug command line: " + this.debugCommandLine ? "on" : "off");
      },
    };

    const execute = commandList[command];

    if (!execute) {
      this.logger.warn(`Command '${command}' not found, use help to see available commands`);
    } else {
      execute();
    }

    this.rl.prompt();
  }
}

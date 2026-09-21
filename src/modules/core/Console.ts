import readline from "node:readline";

import { Events } from "discord.js";

import ClientModule from "./ClientModule";
import { On } from "./decorators";
import { ModuleOptions } from "./BaseModule";

export default class Console extends ClientModule<"console"> {
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

    switch (command) {
      case "status":
        this.logger.info("Bot is running!");
        break;
      case "cmdl":
        this.debugCommandLine = !this.debugCommandLine;
        this.logger.info("Debug command line: " + this.debugCommandLine ? "on" : "off");
        break;

      default:
        this.logger.warn(`Command '${command}' not found, use help to see available commands`);
        break;
    }

    this.rl.prompt();
  }
}

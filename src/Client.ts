import dotenv from "dotenv";
dotenv.config();

import { Client, Events, GatewayIntentBits, version } from "discord.js";

import { Logger, LogPrinter } from "./logger/Logger";
import ModuleManager from "./modules/core/ModuleManager";
import ErrorHandler from "./modules/ErrorHandler";
import SlashCommandManager from "./slashCommands/SlashCommandManager";
import DatabaseManager from "./database/DatabaseManager";
import MessageReplier from "./modules/MessageReplier";

export type OperationMode = "default" | "debug";

const { DEV_SERVER } = process.env;


export default class MassClient extends Client {
  // Client info
  public readonly clientInfo = {
    name: "",
    version: "",
    "discord.js": version,
    restVersion: "10",
  };
  public readonly startAt: Date;
  public readonly botId: string = "1168430797599019022";

  public readonly operationMode: OperationMode;

  // Client Services
  public readonly logger: Logger;
  public readonly logPrinter: LogPrinter;
  public readonly moduleManager: ModuleManager;
  public readonly errorHandler: ErrorHandler;
  public readonly messageReplier: MessageReplier;

  // Database
  public readonly database: DatabaseManager;

  // Init module
  public readonly slashCommandManager: SlashCommandManager;

  // Client dev aliances
  public readonly devServerId: string;

  constructor(operationMode: OperationMode) {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
      ],
    });
    this.operationMode = operationMode;
    this.devServerId = DEV_SERVER ?? "";

    this.setMaxListeners(1000);

    this.startAt = new Date();
    this.logPrinter = new LogPrinter(this);
    this.logger = new Logger({ label: "main", printer: this.logPrinter });
    this.database = new DatabaseManager(this);
    this.moduleManager = new ModuleManager({ client: this });
    this.errorHandler = new ErrorHandler({ client: this });
    this.messageReplier = new MessageReplier({ client: this });

    this.slashCommandManager = new SlashCommandManager({ client: this });

    this.on(Events.ClientReady, async () => this.clientReadyAction());
  }

  private async clientReadyAction() {
    this.logger.ok(`Client ready, logged in as ${this.user?.tag}`);
  }

  override async login(token?: string): Promise<string> {
    this.logger.info("Starting bot...");

    if (!(await this.database.createConnection())) {
      this.logger.warn("Stoping bot");
      process.exit(0);
    }

    this.moduleManager.loadModules();

    this.emit("system-operational", this);

    return super.login(token);
  }
}

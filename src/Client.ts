import dotenv from "dotenv";
dotenv.config();

import { Client, Events, GatewayIntentBits, version } from "discord.js";
import { DataSource } from "typeorm";

import { Logger, LogPrinter } from "./logger/Logger";
import ModuleManager from "./modules/core/ModuleManager";
import ClientErrorHandler from "./modules/ErrorHandler";
import SlashCommandManager from "./slashCommands/SlashCommandManager";
import DatabaseManager from "./database/DatabaseManager";
import GuildStatusManager from "./modules/GuildStatusManager";

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
  public readonly errorHandler: ClientErrorHandler;
  public readonly database: DataSource;

  // Database
  public readonly databaseManager: DatabaseManager;

  // Init module
  public readonly moduleManager: ModuleManager;
  public readonly slashCommandManager: SlashCommandManager;

  // Client dev aliances
  public readonly devServerId: string;
  public readonly shardIds: readonly number[];

  private bootstrapped = false;

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
    this.shardIds = this.shard?.ids ?? [0];

    this.setMaxListeners(1000);

    this.startAt = new Date();
    this.logPrinter = new LogPrinter(this);
    this.logger = new Logger({ label: "main", printer: this.logPrinter });
    this.databaseManager = new DatabaseManager(this);
    this.moduleManager = new ModuleManager({ client: this });
    this.errorHandler = new ClientErrorHandler({ client: this });

    this.slashCommandManager = new SlashCommandManager({ client: this });

    this.on(Events.ClientReady, async () => this.clientReadyAction());
  }

  private async clientReadyAction() {
    this.logger.ok(`Shard ${this.shardIds.join(", ")} ready, logged in as ${this.user?.tag}`);
  }

  override async login(token?: string): Promise<string> {
    if (this.bootstrapped) {
      return this.token ?? "";
    }

    this.logger.info("Starting bot...");

    if (!(await this.databaseManager.createConnection())) {
      this.logger.warn("Stoping bot");
      process.exit(0);
    }

    // if (!(await this.databaseManager.createDataSourceConnection())) {
    //   this.logger.warn("Force stopping bot demman on no database connection");
    //   process.exit(0);
    // }

    this.moduleManager.loadModules();
    this.bootstrapped = true;

    this.emit("system-operational", this);

    return super.login(token);
  }
}

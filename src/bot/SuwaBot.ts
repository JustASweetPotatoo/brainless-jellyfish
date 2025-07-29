import { Client, GatewayIntentBits, REST, version } from "discord.js";
import { Logger, LogPrinter } from "../utils/Logger";
import Connector from "../database/connector";
import { ManagerModule } from "./ManagerModule";
import { ErrorHandlerModule } from "../modules/ErrorHandlerModule";
import ClientError from "../error/ClientError";
import { ErrorCode } from "../error/ClientErrorCode";
import { DatabaseInitializer } from "../database/repositories/Repository";

export type ClientRunMode = "normal" | "debug";

export default class SuwaBot extends Client {
  public readonly name: string = "Suwa_Client";
  public readonly botId: string;
  public readonly logger: Logger;
  public readonly logPrinter: LogPrinter;
  public connector: Connector;
  public databaseInitializer: DatabaseInitializer;
  public startedTimestamp: number = 0;

  public clientRunMode: ClientRunMode;
  public readonly moduleManager: ManagerModule;
  public readonly errorHandlerModule: ErrorHandlerModule;

  // info
  private readonly clientInfo = `Client Info: 
      > Client Name: ${this.name}
      > Client Version: BETA-5.0.0
      > Discord JS version: ${version}
      > REST Version: 10
      > Number of server joined: `;

  constructor(botId: string) {
    super({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
    });

    this.botId = botId;

    this.logPrinter = new LogPrinter(this);
    this.logger = new Logger("main", this.logPrinter);
    this.connector = new Connector();
    this.databaseInitializer = new DatabaseInitializer();
    this.clientRunMode = "normal";
    this.moduleManager = new ManagerModule({ client: this, name: "manager-module" });
    this.errorHandlerModule = new ErrorHandlerModule({ client: this, name: "error-handler" });

    this.on("ready", () => this.onClientReady());
  }

  async start(token: string) {
    this.startedTimestamp = Date.now();

    // Print info
    this.logger.info("Startup");
    this.logger.info(this.clientInfo);

    // Create database connection
    await this.establishDatabaseConnection();

    // Register all modules
    this.moduleManager.registerModules();
    this.moduleManager.loadModuleListeners();
    await this.moduleManager.loadDatabaseModuleResouces();

    // Create and load rest
    this.rest = new REST({ version: "10" }).setToken(token);
    this.logger.success("REST created! Version is 10.");

    // Login
    try {
      this.logger.info("Loggin...");
      // await this.login(token);
    } catch (error) {
      this.errorHandlerModule.handleClientError({
        error: new ClientError("", ErrorCode.LOGIN_FAILED, error as Error),
        logger: this.logger,
      });
    }
  }

  async establishDatabaseConnection() {
    this.logger.log("Establish database connection");
    this.logger.log("Creating connection");
    this.connector.createPromisePool();
    const response = await this.connector.checkingConnection();
    if (response instanceof ClientError) {
      this.errorHandlerModule.handleSlashCommandError({ error: response, logger: this.logger });
      this.stop();
    } else {
      this.logger.success("Connection created !");
    }

    this.databaseInitializer.setPool(this.connector.pool);

    try {
      const schemaStatus = await this.databaseInitializer.verifySchema();

      if (!schemaStatus) {
        this.logger.warn("Schema not found ! Create new one with tables");
        await this.databaseInitializer.createSchema();
      }

      this.logger.info("Database is running normaly");
    } catch (err) {
      this.errorHandlerModule.handleClientError({ error: err as ClientError, logger: this.logger });
      this.stop();
    }

    this.logger.success("Established database connection");
  }

  stop() {
    this.logger.warn("Stoping bot...");
    this.logger.info("Detroying pool");
    this.connector.pool?.destroy();
    process.exit(0);
  }

  onClientReady() {
    this.user?.setPresence({
      status: "invisible",
    });
    this.readyTimestamp = Date.now();
    this.moduleManager.emit("clientReady");
    this.logger.success(`Bot started up, took ${(this.readyTimestamp - this.startedTimestamp) / 1000} seconds`);
  }
}

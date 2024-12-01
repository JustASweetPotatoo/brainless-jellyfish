import { Client, GatewayIntentBits, REST, version } from "discord.js";
import { Logger, LogPrinter } from "../utils/Logger";
import Connector from "../database/connector";
import { ManagerModule } from "./ManagerModule";
import { ErrorHandlerModule } from "../modules/ErrorHandlerModule";

export type ClientRunMode = "normal" | "debug";

export default class SuwaBot extends Client {
  public readonly name: string = "Suwa_Client";
  public readonly botId: string;
  public readonly logger: Logger;
  public readonly logPrinter: LogPrinter;
  public connector: Connector;
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
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
    });

    this.botId = botId;

    this.logPrinter = new LogPrinter(this);
    this.logger = new Logger("main", this.logPrinter);
    this.connector = new Connector();
    this.clientRunMode = "debug";
    this.moduleManager = new ManagerModule({ client: this, name: "manager-module" });
    this.errorHandlerModule = new ErrorHandlerModule({ client: this, name: "error-handler" });

    this.on("ready", () => this.onClientReady());
  }

  async start(token: string) {
    this.startedTimestamp = Date.now();
    if (!token) {
      this.logger.info("Token is empty !");
      this.logger.warn("Shutdown bot...");
      process.exit(0);
    }

    // Print info
    this.logger.info("Startup");
    this.logger.info(this.clientInfo);

    // Register all modules
    this.moduleManager.registerModules();

    // Create and load rest
    this.rest = new REST({ version: "10" }).setToken(token);
    this.logger.success("REST created! Version is 10.");

    let databaseInitError = this.connector.createPromisePool();
    if (databaseInitError instanceof Error) {
      this.logger.error("Initlization database failed !" + databaseInitError);
      this.stop();
    }

    // Login
    this.logger.info("Loggin...");
    await this.login(token);
  }

  stop() {
    this.logger.warn("Stoping bot...");
    process.exit(0);
  }

  onClientReady() {
    this.readyTimestamp = Date.now();
    this.moduleManager.emit("clientReady");
    this.logger.success(
      `Bot has ready, start up took ${(this.readyTimestamp - this.startedTimestamp) / 1000} seconds`
    );
  }
}

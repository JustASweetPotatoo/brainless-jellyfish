import path from "path";
import Fastify, { FastifyInstance, RouteShorthandMethod } from "fastify";
import MassClient from "../Client";
import { Logger } from "../logger/Logger";
import { readConfigFile } from "../utils/readConfig";

export interface FastifyConfig {
  host: string;
  port: number;
}

export default class FastifyServer {
  private readonly client: MassClient;
  private readonly logger: Logger;
  public readonly instance: FastifyInstance;
  public readonly get: RouteShorthandMethod;
  public readonly post: RouteShorthandMethod;

  // This is default
  private config: FastifyConfig = {
    host: "localhost",
    port: 3535,
  };

  private readonly configFileName = "fastify.config";

  constructor(client: MassClient) {
    this.client = client;
    this.logger = new Logger({ label: "Fastify", printer: client.logPrinter });

    this.instance = Fastify({
      logger: false,
    });

    this.get = this.instance.get.bind(this.instance);
    this.post = this.instance.post.bind(this.instance);
  }

  private async loadConfig(): Promise<void> {
    try {
      const filePath = path.join(__dirname, "../config/" + this.configFileName);
      this.logger.log("Reading config at: " + filePath);

      const loaded = await readConfigFile(this.configFileName);
      this.config = loaded as FastifyConfig;

      this.logger.success("Config loaded!");
    } catch (error) {
      const err = error as Error;
      this.logger.error("Loading config failed, using default settings!");
      this.logger.error(err.message);
    }
  }

  public async open() {
    this.logger.log("Opening server...");
    await this.loadConfig();

    await this.instance.listen({
      host: this.config.host,
      port: this.config.port,
    });

    this.logger.success(
      `Server running at http://${this.config.host}:${this.config.port}`
    );
  }

  public get raw(): FastifyInstance {
    return this.instance;
  }
}

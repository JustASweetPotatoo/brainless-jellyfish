import { PremiumStatus } from "../database/model/GuildStatus";
import { ModuleOptions } from "../modules/core/module/BaseModule";
import DiscordModule from "../modules/core/module/DiscordModule";

import { createClient, type RedisClientType, RedisClientOptions } from "redis";

export default class RedisManager extends DiscordModule<"redis"> {
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;

  readonly options: RedisClientOptions = {
    url: `redis://127.0.0.1:6379`,
  };

  private redisClient: RedisClientType;

  constructor(options: ModuleOptions) {
    super(options);
    this.redisClient = this.createClient();
    this.redisClient.on("error", (err) => this.handleModuleError(err));
  }

  public createClient(options?: RedisClientOptions): RedisClientType {
    this.logger.log("Creating redis database connection");
    const client = createClient(options ?? this.options);
    this.logger.ok(`Created client, port: ${6379}`);
    return client as RedisClientType;
  }

  public async connect(): Promise<boolean> {
    this.logger.log("Connecting to redis database");
    if (this.redisClient.isOpen) {
      this.logger.warn("Already opened");
      return true;
    }

    let err;

    await this.redisClient.connect().catch((error) => (err = error));

    if (err) {
      this.logger.error("Connect failed !");
      this.handleModuleError(err);
      return false;
    }
    this.logger.ok(`Connected! Running on port ${6379}`);
    return true;
  }

  public async destroy(): Promise<void> {
    // await this.flush();
    await this.redisClient.quit();
  }

  public getRedisClient() {
    return this.redisClient;
  }
}

import { PremiumStatus } from "../database/model/GuildStatus";
import { ModuleOptions } from "../modules/core/module/BaseModule";
import DiscordModule from "../modules/core/module/DiscordModule";

import { createClient, type RedisClientType, RedisClientOptions } from "redis";
import SystemModule from "../modules/core/module/SystemModule";

export default class RedisManager extends SystemModule<"redis"> {
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;
  private redisClient: RedisClientType;

  readonly options: RedisClientOptions = {
    url: `redis://127.0.0.1:6379`,
  };

  public createClient(options?: RedisClientOptions): RedisClientType {
    this.logger.log("Creating redis database connection");
    this.redisClient = createClient(options ?? this.options) as RedisClientType;
    this.redisClient.on("error", (err) => this.handleModuleError(err));
    this.logger.ok(`Created client, port: ${6379}`);
    return this.redisClient as RedisClientType;
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

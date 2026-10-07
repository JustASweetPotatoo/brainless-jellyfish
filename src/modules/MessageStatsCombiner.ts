import { PremiumStatus } from "../database/model/GuildStatus";
import GuildMessageStatRepo from "../database/repository/GuildMessageStatRepo";
import { Repository } from "./core/decorators/decorators";
import DiscordModule from "./core/module/DiscordModule";
import { BucketCounter } from "./MessageStatsTypes";

export default class MessageStatsCombiner extends DiscordModule<"message-stats-combiner"> {
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;

  @Repository()
  private repo: GuildMessageStatRepo;

  constructor(options: ConstructorParameters<typeof DiscordModule>[0]) {
    super(options);

    setInterval(
      () => {
        void this.flushRedisToDatabase();
      },
      1_000 * 60 * 60,
    );
  }

  public async combine(queue: Map<number, BucketCounter>): Promise<void> {
    await this.repo.flush(queue);
  }

  public async flushRedisToDatabase(days = 2): Promise<void> {
    await this.client.moduleManager.get("message-stats").flush();
    const snapshot = await this.client.moduleManager
      .get("message-stats-analyzer")
      .getSnapshot(days);

    if (snapshot.size > 0) {
      await this.repo.flush(snapshot);
    }

    this.logger.info(
      `Flushed Redis message statistics to database: ${snapshot.size} hourly buckets`,
    );
  }
}

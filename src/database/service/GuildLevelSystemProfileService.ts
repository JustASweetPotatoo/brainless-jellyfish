import { Collection } from "discord.js";

export default class  {
  private guildRepo: GuildUserRankingSystemRepo;
  private checkpointRepo: GuildLevelCheckpointRepo;

  constructor(database: DatabaseManager) {
    this.guildRepo = new GuildUserRankingSystemRepo({
      databaseName: database.name,
      pool: database.defaultPool,
    });
    this.checkpointRepo = new GuildLevelCheckpointRepo({
      databaseName: database.name,
      pool: database.defaultPool,GuildUserRankingSystem
    });
  }

  async create(guildId: string): Promise<GuildLevelSystemProfile> {
    await this.guildRepo.create(guildId);
    return new GuildLevelSystemProfile({ id: guildId, activate: false });
  }

  async get(guildId: string): Promise<GuildLevelSystemProfile> {
    let guildProfile = await this.guildRepo.get(guildId);
    if (!guildProfile) {
      guildProfile = new GuildLevelSystemProfile({ id: guildId, activate: false });
      await this.guildRepo.update(guildProfile.toJSON());
      return guildProfile;
    }

    let checkpoints = new Collection<string, GuildLevelCheckpoint>();
    (await this.checkpointRepo.getAllOrderByGuildId(guildId)).forEach((cpr) =>
      checkpoints.set(cpr.role_id, GuildLevelCheckpoint.rowConvert(cpr))
    );
    guildProfile.checkpointCollection = checkpoints;
    return guildProfile;
  }

  async update(data: GuildLevelSystemProfile): Promise<void> {
    await this.guildRepo.update(data.toJSON());
  }
}

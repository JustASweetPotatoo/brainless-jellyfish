import DatabaseManager from "../../DatabaseManager";
import UserLevelProfile from "../model/UserLevelProfile";
import UserLevelProfileRepository from "../../repository/ls/UserLevelProfileRepo";

export default class UserLevelProfileService {
  private readonly userProfileRepo: UserLevelProfileRepository;

  constructor(database: DatabaseManager) {
    this.userProfileRepo = new UserLevelProfileRepository({
      databaseName: database.name,
      pool: database.defaultPool,
    });
  }

  async get(userId: string, guildId: string): Promise<UserLevelProfile> {
    let userProfileJSON = await this.userProfileRepo.get({
      id: userId,
      guildId: guildId,
    });

    if (!userProfileJSON) {
      await this.userProfileRepo.create({ id: userId, guildId: guildId });
      return new UserLevelProfile({ id: userId, guildId: guildId });
    }

    return UserLevelProfile.rowConvert(userProfileJSON);
  }

  async insert(data: UserLevelProfile): Promise<UserLevelProfile> {
    await this.userProfileRepo.insert(data.toJSON());
    return data;
  }

  async update(data: UserLevelProfile): Promise<UserLevelProfile> {
    await this.userProfileRepo.update(data.toJSON());
    return data;
  }

  async updateUserLevel(
    userId: string,
    guildId: string,
    amount: number
  ): Promise<string | UserLevelProfile> {
    const userProfile = await this.get(userId, guildId);

    if (userProfile.level + amount < 0) {
      return "Can't update user with minus level !";
    }

    userProfile.level += amount;

    return userProfile;
  }

  async getGuildTopLevelProfiles(
    guildId: string,
    limit: number = 10
  ): Promise<UserLevelProfile[]> {
    const profilesJSON = await this.userProfileRepo.getOrderByExp(guildId, true, limit);
    return profilesJSON.map((profile) => UserLevelProfile.rowConvert(profile));
  }

  async getUserRankInGuild(
    id: string,
    guildId: string
  ): Promise<{ rank: number; profile: UserLevelProfile }> {
    const userRankProfile = await this.userProfileRepo.getRankByExp({ id, guildId });
    return {
      rank: userRankProfile ? userRankProfile.rank : -1,
      profile: userRankProfile
        ? UserLevelProfile.rowConvert(userRankProfile.userProfle)
        : new UserLevelProfile({ id, guildId }),
    };
  }
}

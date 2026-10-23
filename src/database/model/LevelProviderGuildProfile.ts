import { Collection } from "discord.js";
import { BaseModel } from "./constructor/BaseModel";
import RankProviderMilestone, { RankProviderMilestoneObj } from "./LevelProviderMilestone";

export interface BlackListItem {
  id: string;
  type: "channel" | "role";
}

export interface LevelProviderGuildProfileObj {
  readonly id: string;
  active?: boolean;
  log_channel_id?: string;
  rate?: number;
  type?: number;
  milestones?: RankProviderMilestoneObj[];
  blacklist?: BlackListItem[];
}

export default class LevelProviderGuildProfile extends BaseModel<LevelProviderGuildProfileObj> {
  readonly id: string;
  active: boolean;
  logChannelId?: string;
  rate: number = 1;
  type: number = 1;
  milestones: Collection<string, RankProviderMilestone> = new Collection();
  blacklist: Collection<string, BlackListItem> = new Collection();

  constructor(json: LevelProviderGuildProfileObj) {
    super();

    this.id = json.id;
    this.active = json.active ?? false;
    this.logChannelId = json.log_channel_id;
    this.type = json.type ?? 1;
    this.rate = json.rate ?? 1;
    this.blacklist = new Collection();
    for (const item of json.blacklist ?? []) {
      this.blacklist.set(item.id, {
        id: item.id,
        type: item.type === "role" ? "role" : "channel",
      });
    }
    if (json.milestones) {
      for (const milestoneJson of json.milestones) {
        const milestone = RankProviderMilestone.fromJSON(milestoneJson);
        this.milestones.set(milestone.id, milestone);
      }
    }
  }

  toJSON(): LevelProviderGuildProfileObj {
    return {
      id: this.id,
      active: this.active,
      log_channel_id: this.logChannelId,
      rate: this.rate,
      type: this.type,
      milestones: this.milestones.map((m) => m.toJSON()),
      blacklist: this.blacklist.map((item) => item),
    };
  }
}

import { Collection } from "discord.js";
import { BaseModel } from "./constructor/BaseModel";
import RankProviderMilestone, { RankProviderMilestoneObj } from "./RankProviderMilestone";
import { join } from "path";

export interface RankProviderGuildProfileJson {
  readonly id: string;
  active?: boolean;
  log_channel_id?: string;
  rate?: number;
  type?: number;
  milestones?: RankProviderMilestoneObj[];
}

export default class RankProviderGuildProfile extends BaseModel<RankProviderGuildProfileJson> {
  readonly id: string;
  active: boolean;
  logChannelId?: string;
  rate: number = 1;
  type: number = 1;
  milestones: Collection<string, RankProviderMilestone> = new Collection();

  constructor(json: RankProviderGuildProfileJson) {
    super(json);

    this.id = json.id;
    this.active = json.active ?? false;
    this.logChannelId = json.log_channel_id;
    this.type = json.type ?? 1;
    this.rate = json.rate ?? 1;
    if (json.milestones) {
      for (const milestoneJson of json.milestones) {
        const milestone = RankProviderMilestone.fromJSON(milestoneJson);
        this.milestones.set(milestone.id, milestone);
      }
    }
  }

  toJSON(): RankProviderGuildProfileJson {
    return {
      id: this.id,
      active: this.active,
      log_channel_id: this.logChannelId,
      rate: this.rate,
      type: this.type,
      milestones: this.milestones.map((m) => m.toJSON()),
    };
  }
}

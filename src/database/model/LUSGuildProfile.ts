import { Collection } from "discord.js";
import { BaseModel } from "./constructor/BaseModel";
import LUSGuildMilestone, { LUSGuildMilestoneJson } from "./LUSGuildMilestone";

export interface LUSGuildProfileJson {
  readonly id: string;
  active?: boolean;
  log_channel_id?: string;
  rate?: number;
  milestones?: LUSGuildMilestoneJson[];
}

export default class LUSGuildProfile extends BaseModel<LUSGuildProfileJson> {
  readonly id: string;
  active: boolean;
  logChannelId?: string;
  rate: number = 1;
  milestones: Collection<string, LUSGuildMilestone> = new Collection();

  constructor(json: LUSGuildProfileJson) {
    super(json);

    this.id = json.id;
    this.active = json.active ?? false;
    this.logChannelId = json.log_channel_id;
    this.rate = json.rate ?? 1;
    if (json.milestones) {
      for (const milestoneJson of json.milestones) {
        const milestone = LUSGuildMilestone.fromJSON(milestoneJson);
        this.milestones.set(milestone.id, milestone);
      }
    }
  }

  toJSON(): LUSGuildProfileJson {
    return {
      id: this.id,
      active: this.active,
      log_channel_id: this.logChannelId,
      rate: this.rate,
      milestones: this.milestones.map((m) => m.toJSON()),
    };
  }
}

import { Collection } from "discord.js";

export interface LevelUpSystemGuildProfileOptions {
  readonly id: string;
  active: boolean;
  logChannelId?: string;
  rate?: number;
  mỉlestones?: Collection<string, LevelUpMileStone> | Object;
}

export interface LevelUpSystemGuildProfileJSON {
  readonly id: string;
  active: boolean;
  log_channel_id?: string;
  rate?: number;
  mỉlestones: LevelUpMileStoneJSON[];
}

export interface LevelUpMileStoneJSON {
  readonly id: string;
  role_id: string | undefined;
  start_at: number;
  end_at: number;
}

export interface LevelUpMileStoneOptions {
  readonly id: string;
  roleId?: string;
  startAt?: number;
  endAt?: number;
}

export class LevelUpMileStone {
  readonly id: string;
  roleId: string | undefined;
  startAt: number;
  endAt: number;

  constructor(options: LevelUpMileStoneOptions) {
    this.id = options.id;
    this.roleId = options.roleId;
  }

  static toThis(options: LevelUpMileStoneJSON): LevelUpMileStone {
    return new LevelUpMileStone({
      id: options.id,
      roleId: options.role_id,
      startAt: options.start_at,
      endAt: options.end_at,
    });
  }

  toJSON(): LevelUpMileStoneJSON {
    return {
      id: this.id,
      role_id: this.roleId,
      start_at: this.startAt,
      end_at: this.endAt,
    };
  }
}

export class LevelUpSystemGuildProfile {
  // Identification
  /**
   * @description Guild id
   */
  readonly id: string;

  // State
  /**
   * @description Working state, default is false
   */
  active: boolean;

  // Log config
  /**
   * @description Log channel id, default is empty string
   */
  logChannelId: string;

  // Config
  /**
   * @description Exp rate multiplied, default is 1
   */
  rate: number;

  /**
   * @description Milestone collection, default is empty collection
   */
  milestones: Collection<string, LevelUpMileStone>;

  locale?: string;

  constructor(options: LevelUpSystemGuildProfileOptions) {
    this.id = options.id;
    this.active = options.active;
    this.logChannelId = options.logChannelId ?? "";
    this.rate = options.rate ?? 1;

    if (options.mỉlestones instanceof Collection) {
      this.milestones = options.mỉlestones;
    } else if (options.mỉlestones instanceof Object) {
      this.milestones = new Collection();
      Object.values(options.mỉlestones).forEach((milestone) =>
        this.milestones.set(milestone.id, { ...milestone })
      );
    } else this.milestones = new Collection();
  }

  static toThis(options: LevelUpSystemGuildProfileJSON): LevelUpSystemGuildProfile {
    const clg: Collection<string, LevelUpMileStone> = new Collection();

    options.mỉlestones.forEach((item) => clg.set(item.id, LevelUpMileStone.toThis(item)));

    return new LevelUpSystemGuildProfile({
      id: options.id,
      active: options.active,
      logChannelId: options.log_channel_id,
      rate: options.rate,
      mỉlestones: clg,
    });
  }

  toJSON(): LevelUpSystemGuildProfileJSON {
    return {
      id: this.id,
      log_channel_id: this.logChannelId,
      active: this.active,
      rate: this.rate,
      mỉlestones: this.milestones.map((ml) => ml.toJSON()),
    };
  }
}

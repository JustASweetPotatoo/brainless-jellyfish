import { ModuleMap } from "../../modules/core/ModuleManager";
import { BaseModel } from "./constructor/BaseModel";

export interface GuildStatusObj {
  readonly id: string;
  premium_status?: PremiumStatus;
  active_list?: Array<keyof ModuleMap>;
}

export enum PremiumStatus {
  STANDARD = 0,
  PRO = 1,
  MAX = 2,
}

export interface GuildStatusOptions {
  readonly id: string;
  premiumStatus?: PremiumStatus;
  activeList?: Array<keyof ModuleMap>;
}

export default class GuildStatus extends BaseModel<GuildStatusObj> {
  readonly id: string;
  premiumStatus: PremiumStatus;
  activeList: Array<keyof ModuleMap>;

  constructor(options: GuildStatusObj) {
    super();

    this.id = options.id;
    this.premiumStatus = options.premium_status ?? PremiumStatus.STANDARD;
    this.activeList = options.active_list ?? [];
  }

  toJSON(): GuildStatusObj {
    return { id: this.id, premium_status: this.premiumStatus, active_list: this.activeList };
  }

  setPremiumStatus(s: PremiumStatus) {
    this.premiumStatus = s;
  }

  activeModule(name: keyof ModuleMap): boolean {
    if (this.activeList.find((value) => (value = name))) {
      return false;
    }
    this.activeList.push(name);

    return true;
  }

  disableModule(name: keyof ModuleMap): boolean {
    if (!this.activeList.find((value) => (value = name))) {
      return false;
    }
    this.activeList = this.activeList.filter((value) => value != name);

    return true;
  }
}

import { ModuleMap } from "../../modules/core/ModuleManager";
import { BaseModel } from "./constructor/BaseModel";

export interface GuildStatusObj {
  readonly id: string;
  premiumStatus: PremiumStatus;
  activeList: Array<keyof ModuleMap>;
}

export enum PremiumStatus {
  STANDARD,
  PRO,
  MAX,
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

  constructor(options: GuildStatusOptions) {
    super();

    this.id = options.id;
    this.premiumStatus = options.premiumStatus ?? PremiumStatus.STANDARD;
    this.activeList = options.activeList ?? [];
  }

  toJSON(): GuildStatusObj {
    return { id: this.id, premiumStatus: this.premiumStatus, activeList: this.activeList };
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

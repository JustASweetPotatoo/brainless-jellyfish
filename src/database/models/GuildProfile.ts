export interface GuildProfileJSON {
  readonly id: string;
  region: string;
}

export default class GuildProfile {
  readonly id: string;
  public region: string;

  constructor(id: string, region: string) {
    this.id = id;
    this.region = region;
  }

  toJSON(): GuildProfileJSON {
    return {
      id: this.id,
      region: this.region,
    };
  }
}

import GuildStatus from "../database/model/GuildStatus";
import GuildStatusRepository from "../database/repository/GuildStatusRepo";
import ClientModule from "./core/ClientModule";
import { Repository } from "./core/decorators";
import { ModuleMap } from "./core/ModuleManager";

export default class GuildStatusManager extends ClientModule<"guild-status-manager"> {
  @Repository()
  private readonly repo: GuildStatusRepository;

  async disableModule<K extends keyof ModuleMap>(guildId: string, name: K): Promise<GuildStatus> {
    const status = await this.repo.get(guildId);
    status.activeList = status.activeList.filter((value) => value != name);
    await this.repo.update(status);
    return status;
  }

  async enableModule<K extends keyof ModuleMap>(guildId: string, name: K): Promise<GuildStatus> {
    const status = await this.repo.get(guildId);
    status.activeList = status.activeList.filter((value) => value != name);
    status.activeList.push(name);
    await this.repo.update(status);
    return status;
  }

  async get(guildId: string): Promise<GuildStatus> {
    let $ = await this.repo.get(guildId);
    if ($) {
      return new GuildStatus($);
    } else {
      $ = new GuildStatus({ id: guildId });
      await this.repo.update($);
      return $;
    }
  }

  async isActive(guildId: string, moduleName: keyof ModuleMap): Promise<boolean> {
    const activeList = (await this.get(guildId)).activeList;
    const isActive = activeList.find((value) => value == moduleName);

    return isActive ? true : false;
  }
}

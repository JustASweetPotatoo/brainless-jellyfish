import { Events } from "discord.js";
import Module from "./constructor/Module";
import { ModuleOptions } from "./constructor/BaseModule";
import MassClient from "../Client";

export default class ClientStatusManager extends Module {
  readonly discordEvents: Events[] = [];

  constructor(opts: ModuleOptions) {
    super("client-status-manager", opts);

    // setInterval(() => {
    //   const inf = process.memoryUsage();
    //   this.logger.info(
    //     `Memory usage (HEAP/TOTAL): ${(inf.heapUsed / 1024 / 1024).toFixed(2)}/${(
    //       inf.heapTotal /
    //       1024 /
    //       1024
    //     ).toFixed(2)}`
    //   );
    // }, 1000);
  }

  protected async onSystemOperational(client: MassClient): Promise<any> {
    return undefined;
  }
}

import ClientModule from "./ClientModule";
import { moduleRegistry } from "../moduleRegistry";
import MassClient from "../../Client";

export type ModuleUnion = InstanceType<
  (typeof moduleRegistry)[keyof typeof moduleRegistry]
>;

export type ModuleMap = {
  [K in InstanceType<
    (typeof moduleRegistry)[keyof typeof moduleRegistry]
  >["name"]]: Extract<ModuleUnion, { name: K }>;
};

export default class ModuleManager extends ClientModule<"module-manager"> {
  protected onClientReady(client: MassClient): Promise<any> {
    throw new Error("Method not implemented.");
  }
  private instances = new Map<string, ClientModule>();

  constructor(options: any) {
    super("module-manager", options);
  }

  public loadModules() {
    for (const key in moduleRegistry) {
      const ModuleClass = moduleRegistry[key as keyof typeof moduleRegistry];

      const instance = new ModuleClass({ client: this.client });

      this.instances.set(instance.name, instance);
    }

    this.client.emit("load-modules-complete");
  }

  public get<K extends keyof ModuleMap>(name: K): ModuleMap[K] {
    const mod = this.instances.get(name);

    if (!mod) throw new Error(`Module not found: ${name}`);

    return mod as ModuleMap[K];
  }

  public has(name: string): boolean {
    return this.instances.has(name);
  }
}

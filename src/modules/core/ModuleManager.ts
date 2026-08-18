import ClientModule from "./ClientModule";
import { moduleRegistry } from "./moduleRegistry";

type Registry = typeof moduleRegistry;

export type ModuleMap = {
  [K in keyof Registry as InstanceType<Registry[K]> extends {
    name: infer N extends string;
  }
    ? N
    : never]: InstanceType<Registry[K]>;
};  

export default class ModuleManager extends ClientModule<"module-manager"> {
  private readonly instances = new Map<keyof ModuleMap, ModuleMap[keyof ModuleMap]>();

  public loadModules(): void {
    const moduleOptions = { client: this.client };
    for (const Module of Object.values(moduleRegistry)) {
      const instance = new Module(moduleOptions);
      this.instances.set(instance.name, instance);
    }

    this.client.emit("load-modules-complete");
  }

  public get<K extends keyof ModuleMap>(name: K): ModuleMap[K] {
    const module = this.instances.get(name);
    if (!module) {
      throw new Error(`Module "${name}" was not found.`);
    }
    return module as ModuleMap[K];
  }
}

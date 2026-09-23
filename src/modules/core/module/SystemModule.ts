import { MODULE_EVENT_KEY, ModuleOn } from "../decorators/decorators";
import BaseModule, { BaseModuleEvents, ModuleEvents, ModuleOptions } from "./BaseModule";

/**
 * ClientModule
 *
 * Provides default interaction handlers for Discord interactions.
 */
export default abstract class SystemModule<TName extends string> extends BaseModule<
  TName,
  ModuleEvents
> {
  constructor(options: ModuleOptions) {
    super(options);
    this.emit(BaseModuleEvents.ModuleAvailable);
  }
}

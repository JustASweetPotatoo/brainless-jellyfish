import { ChatInputCommandInteraction } from 'discord.js';

type CommandHandler = (interaction: ChatInputCommandInteraction, ...args: any[]) => any;

export function CommandExecutor<T extends CommandHandler>(): MethodDecorator {
  return (_target: object, _propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {};
}

class A {
  @CommandExecutor()
  method() {}
}

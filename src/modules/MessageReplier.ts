import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  CommandInteraction,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  InteractionResponse,
  Message,
  MessageReplyOptions,
} from "discord.js";
import ClientModule from "./core/ClientModule";
import { ModuleOptions } from "./core/Module";

export type SendTemporatyTargetOptions =
  | ChatInputCommandInteraction
  | CommandInteraction
  | ButtonInteraction
  | Message;

export type SendTemporatyMessageOptions =
  | InteractionEditReplyOptions
  | InteractionReplyOptions
  | MessageReplyOptions;

export default class MessageReplier extends ClientModule {
  readonly discordEvents: never[] = [];

  constructor(options: ModuleOptions) {
    super("message-replier", options);
  }

  async sendMessage(
    target: SendTemporatyTargetOptions,
    options: SendTemporatyMessageOptions,
    timeout?: number,
  ) {
    try {
      let replyMessage: Message | InteractionResponse;

      if (target instanceof ChatInputCommandInteraction) {
        if (target.deferred || target.replied || target.ephemeral) {
          await target.editReply(options as InteractionEditReplyOptions);
        } else {
          await target.reply(options as InteractionReplyOptions);
        }
      }

      if (target instanceof Message) {
        replyMessage = await target.reply(options as MessageReplyOptions);
      }

      if (timeout) setTimeout(async () => await replyMessage.delete(), timeout);
    } catch (error) {
      this.client.errorHandler.handleClientError({
        error: error,
        logger: this.logger,
      });
    }
  }
}

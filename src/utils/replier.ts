import {
  ButtonInteraction,
  CommandInteraction,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  Message,
  MessagePayload,
  MessageReplyOptions,
  ModalSubmitInteraction,
} from "discord.js";
import LangService from "../lang/LangService";

const langService = new LangService();
export type SendTemporatyInteractionMessageInteractionType =
  | CommandInteraction
  | ButtonInteraction
  | ModalSubmitInteraction;

export type SendTemporatyInteractionMessageOptions = InteractionEditReplyOptions | InteractionReplyOptions;

export async function sendTemporatyInteractionMessageReply(
  interaction: SendTemporatyInteractionMessageInteractionType,
  options?: SendTemporatyInteractionMessageOptions,
  timeout: number = 5000,
) {
  options = options ? langService.formatPayload(options, interaction.locale) : options;
  const replyMessage = interaction.deferred
    ? await interaction.editReply(options as InteractionEditReplyOptions)
    : await interaction.reply(options as InteractionReplyOptions);

  setTimeout(() => {
    if (replyMessage instanceof Message) {
      replyMessage.deletable ? replyMessage.delete() : "";
    } else {
      interaction.deferred ? replyMessage.delete() : "";
    }
  }, timeout);
}

/**
 *
 * @param message
 * @param messageReplyOtions
 * @param timeout miliseconds
 */
export async function sendTemporatyMessageReply(
  message: Message,
  messageReplyOtions: MessageReplyOptions,
  timeout: number = 5000,
) {
  const replyMessage = await message.reply(
    langService.formatPayload(messageReplyOtions, message.guild?.preferredLocale ?? "en-US"),
  );
  setTimeout(async () => (replyMessage.deletable ? replyMessage.delete() : ""), timeout);
}

export async function sendInteractionMessageReply(
  interaction: SendTemporatyInteractionMessageInteractionType,
  options?: SendTemporatyInteractionMessageOptions,
) {
  options = options ? langService.formatPayload(options, interaction.locale) : options;
  if (interaction.deferred) {
    return await interaction.editReply(options as InteractionEditReplyOptions);
  } else {
    return await interaction.reply(options as InteractionReplyOptions);
  }
}

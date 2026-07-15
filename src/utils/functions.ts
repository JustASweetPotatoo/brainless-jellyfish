import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders";
import {
  ButtonInteraction,
  CommandInteraction,
  Interaction,
  InteractionDeferReplyOptions,
  ModalSubmitInteraction,
  PermissionFlagsBits,
  PermissionResolvable,
  RepliableInteraction,
  RestOrArray,
} from "discord.js";
import {
  ChatInputCommandInteraction,
  Collection,
  Colors,
  EmbedBuilder,
  Message,
  MessageResolvable,
  TextBasedChannel,
  TextChannel,
  ThreadChannel,
  User,
} from "discord.js";
import { searchMessageOptions } from "../interfaces/options";
import ClientError from "../error/ClientError";
import { ErrorCode } from "../error/ErrorCode";

export function craftActionRowButtonComponents(
  components: RestOrArray<ButtonBuilder>,
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().setComponents(...components);
}

export async function getNumberOfMessage(
  channel: TextBasedChannel,
  amount: number = 100,
  before?: string,
  after?: string,
): Promise<Collection<string, Message<boolean>>> {
  let messageCollection = new Collection<string, Message>();
  let startMessage: Message | undefined;
  if (before)
    startMessage = (
      await channel.messages.fetch({ before: before, limit: 1 })
    ).first();
  else startMessage = (await channel.messages.fetch({ limit: 1 })).first();
  if (!startMessage) return messageCollection;

  var resume = true;
  var counter = 0;

  while (resume) {
    const rawMessageCollection = await channel.messages.fetch({
      before: before,
      after: after,
      limit: counter + 100 > amount ? amount - counter : 100,
    });
    resume = rawMessageCollection.size >= 100 && counter + 100 <= amount;
    messageCollection = messageCollection.concat(rawMessageCollection);
  }

  return messageCollection;
}

function setMessage(
  message: Message<boolean>,
  bulkDeleteableMessageCollection: Collection<string, Message<boolean>>,
  messageCollection: Collection<string, Message<boolean>>,
  userDataCollection: Collection<string, { user: User; amount: number }>,
) {
  message.bulkDeletable
    ? bulkDeleteableMessageCollection.set(message.id, message)
    : messageCollection.set(message.id, message);

  let userData = userDataCollection.get(message.author.id);

  if (userData)
    userDataCollection.set(message.author.id, {
      user: userData.user,
      amount: userData.amount + 1,
    });
  else
    userDataCollection.set(message.author.id, {
      user: message.author,
      amount: 1,
    });
}

export function searchSubstringInMessage(
  message: Message,
  substring: string,
): boolean {
  if (message.content === substring) return true;
  let included = false;
  message.embeds.forEach((embed) => {
    if (embed.title?.includes(substring)) included = true;
    if (embed.description?.includes(substring)) included = true;
    if (embed.footer?.text.includes(substring)) included = true;
  });
  return included;
}

export async function searchMessage(
  channel: TextBasedChannel,
  options: searchMessageOptions,
  interactionMessageId: string,
) {
  const bulkDeleteableMessageCollection = new Collection<
    string,
    Message<boolean>
  >();
  const messageCollection = new Collection<string, Message<boolean>>();
  const userDataCollection = new Collection<
    string,
    { user: User; amount: number }
  >();

  const messages = await getNumberOfMessage(
    channel,
    options.amount,
    options.before ? options.before : interactionMessageId,
    options.after,
  );

  messages.forEach((message) => {
    const shouldInclude =
      (options.isBot && message.author.bot) ||
      (options.includeAttachments && message.attachments.size > 0) ||
      (options.includeEmbed && message.embeds.length > 0) ||
      (options.target && message.author.id === options.target.id) ||
      (!options.isBot &&
        !options.includeAttachments &&
        !options.includeEmbed &&
        !options.target &&
        !options.substring) ||
      (options.substring &&
        searchSubstringInMessage(message, options.substring));

    if (shouldInclude && message.id !== interactionMessageId) {
      setMessage(
        message,
        bulkDeleteableMessageCollection,
        messageCollection,
        userDataCollection,
      );
    }
  });

  return {
    bulkDeleteableMessageCollection,
    messageCollection,
    userDataCollection,
  };
}

export async function deleteMessages(
  options: searchMessageOptions,
  interaction: ChatInputCommandInteraction,
) {
  var embed: EmbedBuilder = new EmbedBuilder({
    timestamp: Date.now(),
    footer: {
      text: interaction.user.displayName,
      iconURL: interaction.user.avatarURL() ?? "",
    },
  });

  if (!interaction.channel) throw new ClientError(ErrorCode.NO_TARGET_CHANNEL);
  const targetChannel: TextBasedChannel = interaction.channel;
  const interactionMessage: Message<boolean> = await interaction.fetchReply();

  // Check if the channel is a TextChannel or a ThreadChannel
  if (
    !(
      targetChannel instanceof TextChannel ||
      targetChannel instanceof ThreadChannel
    )
  ) {
    throw new ClientError(
      ErrorCode.NO_TARGET_CHANNEL,
      "This command can only be used in text or thread channels.",
    );
  }

  if (options.substring && options.substring.length < 3) {
    embed
      .setTitle("The substring must have at least **3 characters**!")
      .setColor(Colors.Yellow);
  } else {
    const {
      bulkDeleteableMessageCollection,
      messageCollection,
      userDataCollection,
    } = await searchMessage(targetChannel, options, interactionMessage.id);

    // If there are messages to delete
    if (bulkDeleteableMessageCollection.size + messageCollection.size > 0) {
      const messages: MessageResolvable[] = Array.from(
        bulkDeleteableMessageCollection.values(),
      );
      const deletedMessages = await targetChannel.bulkDelete(messages, true);
      messageCollection.forEach(async (message) => {
        if (message.deletable) {
          const deletedMessage = await message.delete();
          deletedMessages.set(deletedMessage.id, deletedMessage);
        }
      });

      let table: Array<string> = [];
      userDataCollection.forEach((userData) => {
        table.push(`**${userData.user.displayName}: ${userData.amount}**`);
      });

      embed
        .setTitle(
          `Đã xóa ${
            bulkDeleteableMessageCollection.size + messageCollection.size
          } tin nhắn từ kênh <#${targetChannel.id}>:`,
        )
        .setDescription(table.join("\n"))
        .setColor(Colors.Green);
    } else {
      embed.setTitle("No messages found to delete.").setColor(Colors.Yellow);
    }
  }

  await interaction.editReply({ embeds: [embed] });

  setTimeout(async () => {
    await interaction.deleteReply();
  }, 5000);
}

export async function autoDeferReply(
  interaction: CommandInteraction | CommandInteraction<"cached">,
  options?: InteractionDeferReplyOptions,
) {
  if (!interaction.deferred) return interaction.deferReply(options);
  else return await interaction.fetchReply();
}

export function createEmbedWithTimestampAndCreateUser(
  interaction:
    | ChatInputCommandInteraction
    | ButtonInteraction
    | ModalSubmitInteraction,
) {
  return new EmbedBuilder({
    timestamp: Date.now(),
    footer: {
      text: interaction.user.displayName,
      iconURL: interaction.user.avatarURL() ?? "",
    },
  });
}

export function getPermissionName(
  permission: PermissionResolvable,
): string | undefined {
  return Object.entries(PermissionFlagsBits).find(
    ([, value]) => value === permission,
  )?.[0];
}

export function getPermissionNames(
  permissions: readonly PermissionResolvable[],
): string[] {
  return permissions.map(
    (perm) =>
      Object.entries(PermissionFlagsBits).find(
        ([, value]) => value === BigInt(perm as bigint),
      )?.[0] ?? String(perm),
  );
}

export type KebabCase<S extends string> =
  S extends `${infer First}${infer Rest}`
    ? Rest extends Uncapitalize<Rest>
      ? `${Lowercase<First>}${KebabCase<Rest>}`
      : `${Lowercase<First>}-${KebabCase<Rest>}`
    : S;

export function kebabCase<T extends string>(str: T): KebabCase<T> {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase() as KebabCase<T>;
}

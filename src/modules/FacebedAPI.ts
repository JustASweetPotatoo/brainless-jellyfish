import fs from "fs";
import { pipeline } from "stream/promises";
import { configDotenv } from "dotenv";
import * as cheerio from "cheerio";

configDotenv();
import {
  ChatInputCommandInteraction,
  Collection,
  Colors,
  EmbedBuilder,
  Events,
  Message,
  TextChannel,
  ThreadChannel,
  VoiceChannel,
  WebhookClient,
  WebhookMessageCreateOptions,
} from "discord.js";

import ClientModule from "./core/ClientModule";
import { On, Repository, SlashCommandExecutor } from "./core/decorators";
import FacebookAttachmentSourceRepo from "../database/repository/FacebookUrlRepo";
import {
  extractFacebookReelId,
  extractFacebookShareUrl,
  getAttachmentType,
  removeQueryUrl,
} from "../utils/functions";
import {
  DiscordImageSources,
  DiscordVideoSources,
  FacebookAttachmentSource,
} from "../database/model/FacebookAttactmentSource";
import { EventEmitter } from "stream";

interface FacebookUrlCrawledData {
  reelId: string | undefined;
  videoLinks: string[];
  imageLinks: string[];
  title: string | undefined;
  description: string | undefined;
}

export default class FacebedAPI extends ClientModule<"facebed-api"> {
  @Repository()
  private readonly repo: FacebookAttachmentSourceRepo;
  private webhookClients: Collection<string, WebhookClient> = new Collection();

  private readonly ApiUrl = process.env.PYTHON_API || "http://localhost:9812";

  private founderEmbed: EmbedBuilder = new EmbedBuilder()
    .setDescription(`> *Sứa#2120 - Powered by **Potarozz***\n> *Facebed API by **pi.kt***`)
    .setColor(Colors.Blurple);

  private readonly failedEmbed = (extractedUrl: string) =>
    new EmbedBuilder()
      .setTitle("This post is private or unavailable !")
      .setDescription(`[See posts, photos and more on Facebook](<${extractedUrl}>)`)
      .setColor(Colors.Yellow);

  private async getAttCachedSource(
    facebookSource: string,
  ): Promise<FacebookAttachmentSource | undefined> {
    let cache = await this.repo.get(facebookSource);

    return cache ? new FacebookAttachmentSource(cache) : undefined;
  }

  private wrapLinks = (text: string): string => {
    return text.replace(/\b((https?:\/\/|www\.)[^\s]+)/g, (url) => `<${url}>`);
  };

  private parseHtml(html: string): FacebookUrlCrawledData {
    const $ = cheerio.load(html);

    const metas: Array<{ propety: string; content: string }> = [];

    $("meta[property]").each((_, el) => {
      const property = $(el).attr("property");
      const content = $(el).attr("content");

      if (property && content) {
        metas.push({ propety: property, content: content });
      }
    });

    const get = (name: string): Array<string> => {
      return metas.filter((value) => value.propety == name).map((item) => item.content);
    };

    return {
      reelId: extractFacebookReelId(get("og:url").at(0) ?? ""),
      videoLinks: get("og:video:secure_url"),
      imageLinks: get("og:image"),
      title: get("og:title").at(0),
      description: get("og:description").at(0),
    };
  }

  private async downloadVideo(url: string, path = "video.mp4"): Promise<string | undefined> {
    const res = await fetch(url);

    if (!res.ok) throw new Error("Download fail");

    const fileStream = fs.createWriteStream(path);

    const body = res.body;

    if (body) {
      await pipeline(res.body, fileStream);
    } else {
      return undefined;
    }

    return path;
  }

  private async getWebhookClient(
    channel: TextChannel | VoiceChannel | ThreadChannel,
  ): Promise<WebhookClient> {
    const cacheId = `${channel.id}|${channel.guild.id}`;

    if (channel instanceof ThreadChannel) {
      return ((await channel.parent?.fetchWebhooks()) ?? new Collection()).find(
        (webhook) => webhook.owner?.id == this.client.user?.id,
      ) as unknown as WebhookClient;
    }

    let webhookClient = this.webhookClients.get(cacheId);

    if (!webhookClient) {
      const fetchedWebhook = (await channel.fetchWebhooks()).find(
        (webhook) => webhook.owner?.id == this.client.user?.id,
      );

      if (!fetchedWebhook) {
        webhookClient = (await channel.createWebhook({
          name: this.client.user?.displayName ?? "Sứa#2120",
        })) as unknown as WebhookClient;
      } else {
        webhookClient = fetchedWebhook as unknown as WebhookClient;
      }
    }

    return webhookClient;
  }

  private async getFacebookAttachmentSources(url: string) {
    const apiLink = url.replace("https://www.facebook.com", this.ApiUrl);
    const response = await fetch(apiLink).catch((error) => this.handleModuleError(error));

    if (!response) return undefined;

    const responseText = await response.text();
    return this.parseHtml(responseText);
  }

  private readonly emitter = new EventEmitter({ captureRejections: true });

  private async enable(guildId: string) {
    let isActive = await this.client.moduleManager
      .get("guild-status-manager")
      .isActive(guildId, this.name);

    if (isActive) {
      return false;
    }

    this.emitter.on(guildId, this.processMessageOnGuild);
    await this.client.moduleManager.get("guild-status-manager").enableModule(guildId, this.name);
    return true;
  }

  private async disable(guildId: string) {
    let isActive = await this.client.moduleManager
      .get("guild-status-manager")
      .isActive(guildId, this.name);

    if (isActive) {
      this.emitter.removeListener(guildId, this.processMessageOnGuild);
      await this.client.moduleManager.get("guild-status-manager").disableModule(guildId, this.name);
      return true;
    }

    return false;
  }

  private async processMessageOnGuild(message: Message<true>) {
    try {
      // Get facebook URL
      const extractedUrl = extractFacebookShareUrl(message.content);
      if (!extractedUrl) return;

      // Get refMessage
      const refMessage = await message.channel.messages
        .fetch(message.reference?.messageId ?? "")
        .catch((error) => this.logger.error(error));

      // Get webhook client
      let webhookClient: WebhookClient | undefined = await this.getWebhookClient(
        message.channel as TextChannel | VoiceChannel | ThreadChannel,
      );

      if (!webhookClient) {
        this.logger.warn(`Can't get webhook client! ${message.channelId}|${message.guildId}`);
        return;
      }

      const displayWebhookUsername = `${message.author.displayName}-Sứa#2120`;

      // Get cached video sources
      const cachedAtts = await this.getAttCachedSource(extractedUrl);
      const cachedVideos = cachedAtts?.discordVideoSources;
      if (cachedVideos && cachedVideos.length != 0) {
        const messagePayload: WebhookMessageCreateOptions = {
          content:
            this.wrapLinks(message.content) +
            `\n${removeQueryUrl(cachedVideos.at(0)?.discordMediaSource ?? "")}` +
            `\n\n> -# *UID: ${message.author.id} <t:${message.createdTimestamp}:f>*`,
          username:
            displayWebhookUsername.length > 32
              ? `${message.author.displayName}`
              : displayWebhookUsername,
          avatarURL: message.author.avatarURL()!,
          threadId: message.channel instanceof ThreadChannel ? message.channelId : undefined,
        };

        await webhookClient.send(messagePayload);
        await message.delete().catch(() => {});
        return;
      }

      // Crawling Data
      const crawledData = await this.getFacebookAttachmentSources(extractedUrl);
      if (!crawledData) {
        await message.reply({ embeds: [this.failedEmbed(extractedUrl)] });
        return;
      }

      // If has video source link
      if (crawledData.videoLinks.length != 0) {
        const path = await this.downloadVideo(
          crawledData.videoLinks[0],
          `${crawledData.reelId}.mp4`,
        );

        // If can't download the video
        if (!path) {
          await message.reply({ embeds: [this.failedEmbed(extractedUrl)] });
          this.logger.error("Can't get the video with source: " + crawledData.videoLinks);
          return;
        }

        const videoStats = fs.statSync(path);

        if (videoStats.size >= 10 * 1024 * 1024) {
          const embed = new EmbedBuilder()
            .setTitle("This video in post is too large to direct conversion")
            .setURL(crawledData.videoLinks[0])
            .setColor(Colors.Green);
          await message.reply({ embeds: [embed, this.founderEmbed] });
          this.logger.warn("Too large video: " + crawledData.videoLinks);
          return;
        }

        const messagePayload: WebhookMessageCreateOptions = {
          content:
            `${this.wrapLinks(message.content)}` +
            (refMessage && refMessage.member
              ? `\n> -# ↪ [Reply to ↗ ${refMessage.member.displayName}](<${refMessage.url}>)`
              : ""),
          embeds: [
            this.founderEmbed.setFooter({ text: `UID: ${message.author.id}` }).setTimestamp(),
          ],
          username: message.author.displayName,
          avatarURL: message.author.avatarURL()!,
          threadId: message.channel instanceof ThreadChannel ? message.channelId : undefined,
          files: [path],
        };

        const apiMessage = await webhookClient.send(messagePayload);
        const att = apiMessage.attachments.at(0);

        const attachmentSource: DiscordVideoSources = {
          index: 0,
          discordMediaSource: removeQueryUrl(att?.url ?? ""),
          facebookSource: extractedUrl,
        };

        const cacheAtts: FacebookAttachmentSource = new FacebookAttachmentSource({
          facebookSource: extractedUrl,
          discordVideoSources: [attachmentSource],
          discordFileSources: [],
          discordImageSources: [],
        });

        await this.repo.create(cacheAtts);
        await message.delete().catch((error) => undefined);
      } else if (crawledData.imageLinks) {
        const postEmbedDescription = `\n> **[${crawledData.title}](${this.wrapLinks(
          extractedUrl,
        )})**\n> ${crawledData.description}`;

        const messagePayload1: WebhookMessageCreateOptions = {
          content:
            this.wrapLinks(message.content) +
            postEmbedDescription +
            (refMessage && refMessage.member
              ? `s\n> -# ↪ [Reply to ↗ ${refMessage.member.displayName}](<${refMessage.url}>)`
              : ""),
          files: crawledData.imageLinks.slice(0, 9),
          embeds: [this.founderEmbed],
          username: message.author.displayName,
          avatarURL: message.author.avatarURL() ?? undefined,
          threadId: message.channel instanceof ThreadChannel ? message.channelId : undefined,
        };

        // const messagePayload2: WebhookMessageCreateOptions = {
        //   content:
        //     this.wrapLinks(message.content) +
        //     postEmbedDescription +
        //     (refMessage && refMessage.member
        //       ? `s\n> -# ↪ [Reply to ↗ ${refMessage.member.displayName}](<${refMessage.url}>)`
        //       : ""),
        //   files: crawledData.imageLinks.slice(0, 0),
        //   embeds: [this.founderEmbed],
        //   username: message.author.displayName,
        //   avatarURL: message.author.avatarURL() ?? undefined,
        //   threadId: message.channel instanceof ThreadChannel ? message.channelId : undefined,
        // };

        const replyMessage = await webhookClient.send(messagePayload1);

        const attachments = replyMessage.attachments
          .filter((att) => getAttachmentType(att.contentType) == "image")
          .map((item) => item)
          .map((item, index): DiscordImageSources => {
            return {
              facebookSource: extractedUrl,
              discordMediaSource: removeQueryUrl(item.url),
              index: index,
            };
          });

        const cacheAtts: FacebookAttachmentSource = new FacebookAttachmentSource({
          facebookSource: extractedUrl,
          discordVideoSources: [],
          discordFileSources: [],
          discordImageSources: attachments,
        });

        await this.repo.create(cacheAtts);
        await message.delete().catch((error) => undefined);
      } else {
        // File attachments
      }
    } catch (error) {
      this.handleModuleError(error);
    }
  }

  @SlashCommandExecutor({ guildOnly: true, requiredAdminPermission: true })
  async activeModule(interaction: ChatInputCommandInteraction<"cached">) {
    const turnOn = interaction.options.getBoolean("turn-on");

    if (turnOn) {
      const res = await this.enable(interaction.guildId);

      if (res) {
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(Colors.Green).setTitle("Operation complete !")],
        });
      } else {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Yellow)
              .setTitle("Operation Failed !")
              .setDescription("Feature already turned on !"),
          ],
        });
      }
    } else {
      const res = await this.disable(interaction.guildId);

      if (res) {
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(Colors.Green).setTitle("Operation complete !")],
        });
      } else {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Yellow)
              .setTitle("Operation Failed !")
              .setDescription("Feature already turned off !"),
          ],
        });
      }
    }
  }

  @On(Events.MessageCreate)
  async onMessageCreate(message: Message<true>) {
    if (message.author.bot) return;
    this.emitter.emit(message.guildId, message);
  }
}

import { Colors, EmbedBuilder, Events, Message } from "discord.js";
import ClientModule from "./core/ClientModule";
import { ModuleOptions } from "./core/BaseModule";
import { On } from "./core/decorators";
import { extractFbLinkFromContent } from "../utils/autoLink";

export default class AutoLink extends ClientModule<"auto-link"> {
  constructor(options: ModuleOptions) {
    super(options);
  }

  private convertLink(content: string) {
    return content.replace("https://www.facebook.com", "http://python:9812");
  }

  @On(Events.MessageCreate)
  protected async onMessageCreate(message: Message<true>): Promise<any> {
    try {
      if (!message.inGuild() || message.author.bot) return;

      const extractedLink = extractFbLinkFromContent(message.content);
      if (!extractedLink) return;

      const convertedLink = this.convertLink(extractedLink);
      const res = await fetch(convertedLink);

      if (!res.ok) {
        await message.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Dowload video unavalable !")
              .setDescription(
                `**This post is private or deleted !**\n *Please login to see (this post)[${extractedLink}]*`,
              )
              .setColor(Colors.Yellow)
              .setTimestamp(),
          ],
        });
        return;
      }

      await (await fetch(convertedLink)).text();
    } catch (error) {
      this.logger.error(error);
    }
  }
}

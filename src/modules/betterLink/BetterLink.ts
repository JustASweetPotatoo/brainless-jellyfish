import { ChatInputCommandInteraction, Colors, EmbedBuilder, Events, Message } from "discord.js";
import DiscordModule from "../core/module/DiscordModule";
import { On, SlashCommandExecutor } from "../core/decorators/decorators";
import { PremiumStatus } from "../../database/model/GuildStatus";
import { EventEmitter } from "stream";
import BetterLinkManager from "./BetterLinkManager";
import GroupDiscordModule from "../core/module/ParentDiscordModule";

export default abstract class BetterLink<T extends string> extends GroupDiscordModule<T> {
  readonly groupName: string = "better-link";
  protected abstract readonly displayName: string;
  protected manager: BetterLinkManager;
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;
  protected readonly emitter = new EventEmitter({ captureRejections: true });

  @SlashCommandExecutor({ guildOnly: true, requiredAdminPermission: true })
  async swichModuleStatus(interaction: ChatInputCommandInteraction<"cached">) {
    const guildId = interaction.guildId;
    const status = await this.client.moduleManager.enableModule(guildId, "facebed-api");

    if (status == "enabled") {
      this.emitter.on(guildId, this.processMessageOnGuild);
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(Colors.Green).setTitle("Operation complete !")],
      });
    } else if (status == "already") {
      await this.client.moduleManager.disableModule(guildId, "facebed-api");
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle("Operation complete !")
            .setDescription("Better Link for facebook url was disabled"),
        ],
      });
    }
  }

  protected abstract processMessageOnGuild(message: Message<true>): Promise<void>;

  @On(Events.ClientReady)
  private onCl() {
    this.manager = this.client.moduleManager.get("better-link-manager");
  }
}

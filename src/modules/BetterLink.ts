import { ChatInputCommandInteraction, Colors, EmbedBuilder, Events, Message } from "discord.js";
import ClientModule from "./core/ClientModule";
import { On, SlashCommandExecutor } from "./core/decorators";

export default class BetterLink extends ClientModule<"better-link"> {
  @On(Events.MessageCreate)
  protected async onMessageCreate(message: Message<true>): Promise<any> {}

  @SlashCommandExecutor({ guildOnly: true, requiredAdminPermission: true })
  async turnOnFacebedAPI(interaction: ChatInputCommandInteraction<"cached">) {
    const turnOn = interaction.options.getBoolean("turn-on");
    const module = this.client.moduleManager.get("facebed-api");

    if (turnOn) {
      const res = await module.enable(interaction.guildId);

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
      const res = await module.disable(interaction.guildId);

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
}

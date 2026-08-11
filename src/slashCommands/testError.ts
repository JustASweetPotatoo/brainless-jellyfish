import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";

/** Intentionally fails to verify the slash-command error handling pipeline. */
export default new ClientSlashCommandBuilder()
  .setName("test-error")
  .setDescription("Test the slash command error handler.")
  .setExecutor(async () => {
    throw new Error("[TEST_ERROR] Intentional error for handler testing.");
  });

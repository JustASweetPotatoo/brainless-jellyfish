import * as fs from "fs";
import { Collection, SlashCommandSubcommandGroupBuilder } from "discord.js";

import ClientError from "../../error/ClientError";
import * as path from "path";
import ClientSlashCommandSubcommandBuilder from "./SlashCommandSubcommandBuilder";
import { ErrorCode } from "../../error/ClientErrorCode";

class ClientSlashCommandSubcommandGroupBuilder extends SlashCommandSubcommandGroupBuilder {
  public readonly localFilePath: string;
  public subcommandBuilderCollection: Collection<string, ClientSlashCommandSubcommandBuilder>;
  constructor(localFilePath: string) {
    super();

    this.localFilePath = localFilePath;
    this.subcommandBuilderCollection = new Collection<string, ClientSlashCommandSubcommandBuilder>();
  }

  loadSubcommandBuilderFolder() {
    const folder = this.localFilePath.replace(".js", "");
    if (fs.existsSync(folder)) {
      fs.readdirSync(folder).forEach((item) => {
        if (item.endsWith(".ts")) {
          const builder = require(path.join(folder, item));
          if (builder instanceof ClientSlashCommandSubcommandBuilder) {
            this.addSubcommand(builder);
            this.subcommandBuilderCollection.set(builder.name, builder);
          } else throw new ClientError("Invalid builder type!", ErrorCode.BUILDER_UNDEFINED_OR_INVALID);
        }
      });
    }
  }
}

export default ClientSlashCommandSubcommandGroupBuilder;

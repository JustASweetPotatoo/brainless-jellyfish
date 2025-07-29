const {
  Client,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  GatewayIntentBits,
  PermissionsBitField,
  Message,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const token = "MTEzNzIzOTAyMTYxNDAyNjc4NA.GS5P9J.HhtojqKLrLWB-GDnstbbgdn2vHRGW9Y-mOqB9s";
const botId = "";
const dataJSONPath = "./data.json";
const roleConDanDiaNgucId = "1356643708442775654";
const channelId = "1356642113210810428";
const generalChannelName = "chào-mừng";
const cooldownTimeInHours = 12;
const cauNguyenChannelId = "1356630102775173241";
const taoVoiceChannelId = "1357336069711990904";
const categoryId = "1316741799825379392";

let data;

if (!fs.existsSync(path.join(__dirname, dataJSONPath))) {
  fs.writeFileSync("data.json", "{}");
}
data = require(path.join(__dirname, dataJSONPath));

client.on("ready", async () => {
  console.log("Client ready!");
  const channel = await client.channels.fetch(channelId);
  if (!channel) return;

  const message = await channel.send("Nhấn 👍 để nhận role Con dân địa ngục!");
  message.react("👍");
});

client.on("guildMemberAdd", (member) => {
  const channel = member.guild.channels.cache.find((ch) => ch.name === generalChannelName);
  if (!channel) return;

  channel.send(`Chào mừng ${member} đến với địa ngục, tận hưởng đi!!`);
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.emoji.name === "👍" && !user.bot) {
    const member = await reaction.message.guild.members.fetch(user.id);
    const role = await reaction.message.guild.roles.fetch(roleConDanDiaNgucId);
    if (!role) return;

    member.roles.add(role);
    user.send("Bạn đã nhận được role Con dân địa ngục!");
  }
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (reaction.emoji.name === "👍" && !user.bot) {
    const member = await reaction.message.guild.members.fetch(user.id);
    const role = await reaction.message.guild.roles.fetch(roleConDanDiaNgucId);
    if (!role) return;

    member.roles.remove(role);
    user.send("Bạn đã bị tước role Con dân địa ngục!");
  }
});

client.on("messageCreate", async (message) => {
  if (!message.inGuild()) return;

  prefixCommand(message);

  /*
    ----------------------------------------------------------------------------------------------------------
    | KIỂM TRA VÀ XOÁ TIN NHẮN TRONG KÊNH CẦU NGUYỆN                                                          |
    ----------------------------------------------------------------------------------------------------------
    */
  if (
    message.channel.id === cauNguyenChannelId &&
    !message.content.toLocaleLowerCase().startsWith("cầu nguyện") &&
    !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
    !message.author.bot
  ) {
    await message.delete().catch(console.error);
    await message.channel
      .send("Chỉ admin mới được phép gửi tin nhắn ngoài 'cầu nguyện' ở đây, bộ mi thích kiếm chuyện huh?")
      .then((msg) => {
        setTimeout(() => msg.delete().catch(console.error), 5000);
      });
  }
});

/**
 *
 * @param {Message<true>} message
 */
async function prefixCommand(message) {
  if (message.content.startsWith("!")) {
    if (message.content.startsWith("!warn")) {
      //   warnCommand(message);
    }
  }

  if (message.content.toLocaleLowerCase().startsWith("cầu nguyện")) {
    caunguyenCommand(message);
  }
}

/**
 *
 * @param {Message<true>} message
 */
async function warnCommand(message) {
  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    message.reply({ content: "Bạn không có quyền sử dụng command này !" });
  }

  const args = message.content.split(" ");
  if (args.length < 4) {
    message.reply({ content: "Sử dụng: `!warn <user> <reason> <duration>` (ví dụ: `!warn @user spam 1h`)" });
    return;
  }

  const target = message.mentions.members.first();
  if (!target) {
    message.reply({ content: "Người dùng không có, vui lòng mention người dùng cần warn !" });
  }

  //   const timeMatch = durationString.match(/(\d+)([smhd])/);
  //   if (timeMatch) {
  //     const amount = parseInt(timeMatch[1]);
  //     const unit = timeMatch[2];
  //     switch (unit) {
  //       case "s":
  //         durationMs = amount * 1000;
  //         break;
  //       case "m":
  //         durationMs = amount * 60 * 1000;
  //         break;
  //       case "h":
  //         durationMs = amount * 60 * 60 * 1000;
  //         break;
  //       case "d":
  //         durationMs = amount * 24 * 60 * 60 * 1000;
  //         break;
  //       default:
  //         return message.reply("Định dạng thời gian không hợp lệ (s, m, h, d)!");
  //     }
  //   } else {
  //     return message.reply("Định dạng thời gian không hợp lệ (ví dụ: 10s, 5m, 2h, 1d)!");
  //   }
}

/**
 *
 * @param {Message<true>} message
 */
async function caunguyenCommand(message) {
  if (!message.inGuild()) return;
  if (!message.content.toLocaleLowerCase().startsWith("cầu nguyện")) return;

  if (!data[message.author.id]) data[message.author.id] = { last_use_timestamp: 0 };

  const difference = Date.now() - data[message.author.id].last_use_timestamp;

  if (difference <= 60 * 60 * cooldownTimeInHours * 1000) {
    const seconds = Math.floor((60 * 60 * 12 * 1000 - difference) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const replyMessage = await message.channel.send(
      `Hãy đợi ${hours % 12} giờ, ${minutes % 60} phút, ${seconds % 60} giây nữa để mở quẻ tiếp theo.`
    );

    setTimeout(async () => {
      replyMessage.deletable ? await replyMessage.delete() : undefined;
    }, 5000);
    return;
  }

  const buttonBuiler = new ButtonBuilder({
    label: "Mở quẻ",
    style: ButtonStyle.Primary,
    customId: `caunguyen-${message.author.id}`,
  });
  const actionRow = new ActionRowBuilder().addComponents([buttonBuiler]);
  fs.writeFileSync(path.join(__dirname, dataJSONPath), JSON.stringify(data));
  await message.channel.send({ components: [actionRow] });
}

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId.startsWith("caunguyen")) {
    const userId = interaction.customId.split("-").at(1);

    // Kiểm tra có phải thằng tạo interaction không
    if (userId !== interaction.user.id) {
      interaction.deferred ? await interaction.deferReply({ fetchReply: true }) : undefined;
      interaction.editReply({
        content: "Bấm cái bà nội mài, quẻ này có phải của m quái đâu ?",
      });
      return;
    }

    const danhSachTenQue = ["Đại Cát", "Cát", "Mạt Cát", "Trung Cát", "Hung", "Đại Hung"];
    const tenQue = danhSachTenQue[Math.floor(Math.random() * danhSachTenQue.length)];
    const noiDungQue = data["quẻ"][tenQue][Math.floor(Math.random() * data["quẻ"][tenQue].length)];
    let content = `-${tenQue}-\n${noiDungQue}`;

    if (tenQue == "Hung" || tenQue == "Đại Hung") {
      const treoQueButton = new ButtonBuilder({
        label: "Treo quẻ giải trừ",
        style: ButtonStyle.Danger,
        customId: `treoque-${interaction.user.id}`,
      });

      const actionRow = new ActionRowBuilder().addComponents([treoQueButton]);
      await interaction.message.edit({
        content: content + "\nBạn có muốn treo quẻ này để giải trừ hung vận không?",
        components: [actionRow],
      });
    } else {
      data[interaction.user.id].treo_que_hung = true;
      data[interaction.user.id].que_da_treo = interaction.message.content; // Lưu nội dung quẻ
    }
  }

  if (interaction.customId.startsWith("treoque")) {
    // Kiểm tra có phải thằng tạo interaction không
    if (userId !== interaction.user.id) {
      interaction.deferred ? await interaction.deferReply({ fetchReply: true }) : undefined;
      interaction.editReply({
        content: "Bấm cái bà nội mài, quẻ này có phải của m quái đâu ?",
      });
      return;
    }

    const danhSachTenQue = ["Đại Cát", "Cát", "Mạt Cát", "Trung Cát", "Hung", "Đại Hung"];
    const tenQue = danhSachTenQue[Math.floor(Math.random() * danhSachTenQue.length)];
    const noiDungQue = data["quẻ"][tenQue][Math.floor(Math.random() * data["quẻ"][tenQue].length)];
    let content = `-${tenQue}-\n${noiDungQue}`;

    if (tenQue == "Hung" || tenQue == "Đại Hung") {
      const treoQueButton = new ButtonBuilder({
        label: "Treo quẻ giải trừ",
        style: ButtonStyle.Danger,
        customId: `treoque-${interaction.user.id}`,
      });

      const actionRow = new ActionRowBuilder().addComponents([treoQueButton]);
      await interaction.message.edit({
        content: content + "\nBạn có muốn treo quẻ này để giải trừ hung vận không?",
        components: [actionRow],
      });
    } else {
      data[interaction.user.id].treo_que_hung = true;
      data[interaction.user.id].que_da_treo = interaction.message.content; // Lưu nội dung quẻ
    }
  }

  if (interaction.customId.startsWith("caunguyen")) {
    const buttonUserId = interaction.customId.split("-").at(1);
    if (!buttonUserId) return;

    if (buttonUserId !== interaction.user.id) {
      interaction.deferred ? await interaction.deferReply({ ephemeral: true }) : undefined;
      interaction.editReply({
        content: "Quẻ này có phải của m đâu? Lấy quẻ khác mày !",
      });
      return;
    }

    const danhSachTenQue = ["Đại Cát", "Cát", "Mạt Cát", "Trung Cát", "Hung", "Đại Hung"];
    const tenQue = danhSachTenQue[Math.floor(Math.random() * danhSachTenQue.length)];
    const noiDungQue = data["quẻ"][tenQue][Math.floor(Math.random() * data["quẻ"][tenQue].length)];
    let content = `-${tenQue}-\n${noiDungQue}`;

    if (tenQue === "Hung" || tenQue === "Đại Hung") {
      const treoQueButton = new ButtonBuilder({
        label: "Treo quẻ giải trừ",
        style: ButtonStyle.Danger,
        customId: `treoque-${interaction.user.id}`,
      });

      const actionRow = new ActionRowBuilder().addComponents([treoQueButton]);
      await interaction.message.edit({
        content: content + "\nBạn có muốn treo quẻ này để giải trừ hung vận không?",
        components: [actionRow],
      });
    } else {
      await interaction.message.edit({
        content: content,
        components: [],
      });
      data[interaction.user.id].last_use_timestamp = Date.now();
      data[interaction.user.id].treo_que_hung = false;
      data[interaction.user.id].que_da_treo = null; // Reset que_da_treo
      fs.writeFileSync(path.join(__dirname, dataJSONPath), JSON.stringify(data));
    }
  } else if (interaction.customId.startsWith("treoque")) {
    const buttonUserId = interaction.customId.split("-").at(1);
    if (!buttonUserId || buttonUserId !== interaction.user.id) {
      return await interaction.reply({ content: "Đây không phải quẻ của bạn!", ephemeral: true });
    }

    data[interaction.user.id].treo_que_hung = true;
    data[interaction.user.id].que_da_treo = interaction.message.content; // Lưu nội dung quẻ
    fs.writeFileSync(path.join(__dirname, dataJSONPath), JSON.stringify(data));
    await interaction.update({
      content:
        "Quẻ hung của bạn đã được treo để giải trừ. Nếu rút được thẻ Hung và Đại Hung, buộc nó ở đây sẽ có thể gặp dữ hoá lành",
      components: [],
    });
  }
});

client.login(token);

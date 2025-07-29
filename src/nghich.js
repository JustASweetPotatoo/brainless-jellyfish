// const express = require("express");
const { Colors, Client, Events, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ButtonInteraction, TextChannel } = require("discord.js");

// const app = express();
// const PORT = 9000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

// client.on(Events.MessageCreate, async (message) => {
//   try {
//     if (message.content.startsWith("createVerifyMessage") && message.author.id === "866628870123552798") {
//       const verifyChannel = await client.channels.fetch("1303015244615913573");
//       const membersWith = (await message.guild.members.fetch()).filter((member) =>
//         member.roles.cache.get("1301219249842556938")
//       );
//       if (verifyChannel?.isSendable()) {
//         const buttonBuilder = new ButtonBuilder({
//           customId: "verify_button",
//           style: ButtonStyle.Primary,
//           label: "Verify",
//           emoji: "✅",
//         });
//         const buttonBuilder2 = new ButtonBuilder({
//           customId: "verify_counter",
//           style: ButtonStyle.Success,
//           label: membersWith.size.toString(),
//           emoji: "838380680257077288",
//         });

//         const actionRow = new ActionRowBuilder().addComponents([buttonBuilder, buttonBuilder2]);
//         await verifyChannel.send({
//           embeds: [
//             new EmbedBuilder({
//               title: "❗ ──── XÁC MINH ──── ❗",
//               description: "**Bạn hãy bấm vào nút `Verify` bên dưới để xác minh !**",
//               color: Colors.Blurple,
//             }),
//           ],
//           components: [actionRow],
//         });
//       }
//     }
//     if (!message.author.bot && message.attachments.size > 0) {
//       const channel = await client.channels.fetch(imageChannelId);
//       const array = [];
//       message.attachments.forEach((attachment) => array.push(attachment.url));
//       await channel.send({
//         content: `From user: ${message.author.id}`,
//         files: array,
//       });
//     }
//   } catch (error) {
//     console.log(error);
//   }
// });

client.on(
  Events.ClientReady,
  /**
   *
   * @param {Client<true>} client
   */
  async (client) => {
    console.log("started!");
    client.user?.setPresence({
      status: "invisible",
    });
    const guild = client.guilds.cache.get("811939594882777128");
    const channel = guild.channels.cache.get("1324329968423141437");

    if (channel instanceof TextChannel) {
      const msg = await channel.send({
        content: "<@775028995795583047>",
      });

      await msg.delete();
    }
    process.exit(0);
  }
);

client.login("MTE2ODQzMDc5NzU5OTAxOTAyMg.GQLBJe.LFDfB3ZqTu_gTwqgO2SmZ9-NiYpycN1JNzyJb8");

// client.on(Events.InteractionCreate, async (interaction) => {
//   if (!(interaction instanceof ButtonInteraction)) return;
//   if (!interaction.inGuild()) return;

//   const buttonBuilder = new ButtonBuilder({
//     customId: "verify_button",
//     style: ButtonStyle.Primary,
//     label: "Verify",
//     emoji: "✅",
//   });
//   const buttonBuilder2 = new ButtonBuilder({
//     customId: "verify_counter",
//     style: ButtonStyle.Success,
//     emoji: "838380680257077288",
//   });

//   if (interaction.customId === "verify_counter") {
//     await interaction.deferReply({ ephemeral: true });
//     const membersWith = (await interaction.message.guild.members.fetch()).filter((member) =>
//       member.roles.cache.get("1301219249842556938")
//     );
//     const embed = new EmbedBuilder({
//       title: `Member counter: ${membersWith.size}`,
//       description: "> ## Role <@1301219249842556938>",
//       color: Colors.Blurple,
//       timestamp: Date.now(),
//     });
//     await interaction.editReply({ embeds: [embed] });
//     return;
//   }

//   if (interaction.customId === "verify_button") {
//     await interaction.deferReply({ ephemeral: true });
//     const member = await interaction.guild?.members.fetch(interaction.user.id);

//     if (!member) return;
//     const memberNeuronRole = member.roles.cache.get("1301219249842556938");
//     if (memberNeuronRole) {
//       await interaction.editReply({
//         embeds: [
//           new EmbedBuilder({
//             title: "Thông báo !",
//             description: "Bạn đã có role neuron rồi! Bấm cái quần què <:Cat_DuaTaoDayA:1173959894941057074>",
//             color: Colors.Yellow,
//           }),
//         ],
//       });
//     } else {
//       const neuronRole = await interaction.guild?.roles.fetch("1301219249842556938");
//       if (!neuronRole) return;
//       await member.roles.add(neuronRole);
//       await interaction.editReply({
//         embeds: [
//           new EmbedBuilder({
//             title: "Thông báo !",
//             description: "Đã thêm role Neuron, chào mừng bạn đã đến với Thiên Hà Của Sứa !",
//             color: Colors.Green,
//           }),
//         ],
//       });
//       const membersWith = (await interaction.message.guild.members.fetch()).filter((member) =>
//         member.roles.cache.get("1301219249842556938")
//       );

//       buttonBuilder2.setLabel(membersWith.size.toString());
//       const actionRow = new ActionRowBuilder().addComponents([buttonBuilder, buttonBuilder2]);

//       await interaction.message.edit({ components: [actionRow] });
//     }
//   }
// });

// const imageChannelId = "1298241600421494795";
// let token;

// Route nhận token
// app.get("/bot/login/:token", async (req, res) => {
//   if (token) {
//     res.send(`
//       <html>
//         <body>
//           <h1>Login failed</h1>
//           <p>Token existed !</p>
//           <p>Status: <strong>403</strong></p>
//         </body>
//       </html>
//     `);
//     return;
//   }
//   token = req.params.token;

//   await client
//     .login(token)
//     .then(() => {
//       res.send(`
//       <html>
//         <body>
//           <h1>Login Successful</h1>
//           <p>Status: <strong>200 OK</strong></p>
//         </body>
//       </html>
//     `);
//     })
//     .catch((err) => {
//       res.send(`
//     <html>
//       <body>
//         <h1>Login Failed</h1>
//         <p>Error: ${err}</p>
//         <p>Status: <strong>402</strong></p>
//       </body>
//     </html>
//     `);
//     });
// });

// Khởi động web server
// app.listen(PORT, () => {
//   console.log(`Web server running on http://localhost:${PORT}`);
// });

import { createCanvas, loadImage } from "canvas";
import { writeFile } from "node:fs/promises";

import path from "path";
import { calcLevel, getTotalExpToReachLevel } from "./calculator";

const bannerPath = path.join(__dirname, "../assets/banner.png");

export interface GenerateRankCardOptions {
  userInf: {
    name: string;
    avatarUrl: string;
  };
  msgLvlData: {
    expValue: number;
    rank: number;
  };
  vcLvlData: {
    expValue: number;
    rank: number;
  };
  badge?: string;
}

export interface GenerateRankCardOptions2 {
  serverName: string;
  username: string;
  level: number;
  xp: number;
  maxXp: number;
  totalXp: number;
  inServerRank: number;
  avatarUrl: string;
  badgeName?: string;
}

export async function generateRankCard(opts: GenerateRankCardOptions): Promise<Buffer> {
  const width = 860;
  const height = 380;

  const textColor = "rgb(255, 255, 255)";
  const bgColorPrimary = "rgba(0, 140, 255, 0.88)";
  const bgColorSecondary = "rgba(255, 255, 255, 0.93)";

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Prepare data
  const msgLevel = calcLevel(opts.msgLvlData.expValue);
  const msgMaxExpAtCurrentLevel = getTotalExpToReachLevel(msgLevel + 1) - 1;
  const msgExpInCurrentLevel = opts.msgLvlData.expValue - getTotalExpToReachLevel(msgLevel);
  const msgExpOfLevel = msgMaxExpAtCurrentLevel - getTotalExpToReachLevel(msgLevel);

  const vcLevel = calcLevel(opts.vcLvlData.expValue);
  const vcMaxExpAtCurrentLevel = getTotalExpToReachLevel(vcLevel + 1);
  const vcExpInCurrentLevel = opts.vcLvlData.expValue - getTotalExpToReachLevel(vcLevel);
  const vcExpOfLevel = vcMaxExpAtCurrentLevel - getTotalExpToReachLevel(vcLevel);

  // background - using imported banner variable or path resolution
  const bg = await loadImage(bannerPath);

  const scale = Math.max(width / bg.width, height / bg.height);

  const newWidth = bg.width * scale;
  const newHeight = bg.height * scale;

  const x = (width - newWidth) / 2;
  const y = (height - newHeight) / 2;

  const radius = 10;

  ctx.save();

  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, 30);
  ctx.clip();

  ctx.scale(-1, 1);
  ctx.drawImage(bg, -x - newWidth, y - 50, newWidth, newHeight);

  ctx.restore();

  // overlay blur/dark
  ctx.fillStyle = "rgba(20,20,30,0.65)";
  ctx.fillRect(0, 0, width, height);

  // avatar
  const safeAvatarUrl = opts.userInf.avatarUrl.replace(".webp", ".png");
  const avatar = await loadImage(safeAvatarUrl);
  const avatarSize = 120;

  const avatarX = 120;
  const avatarY = 100;

  // border
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarSize / 2 + 4, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // avatar clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(avatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);

  ctx.restore();

  // username
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 48px Sans";
  ctx.fillText(opts.userInf.name, 220, 90);

  // ======== level badge ========
  const lvX = 220;
  const lvY = 110;
  const lvH = 40;
  const lvRad = radius;

  ctx.beginPath();
  ctx.font = "bold 24px Sans";
  const lvTextWidth = ctx.measureText(`LEVEL ${msgLevel}`).width + 50;

  ctx.fillStyle = bgColorPrimary;
  ctx.roundRect(lvX, lvY, lvTextWidth, lvH, lvRad);
  ctx.fill();

  // Text
  ctx.beginPath();
  ctx.fillStyle = textColor;
  ctx.fillText(`LEVEL ${msgLevel}`, lvX + 25, lvY + 28);

  // ======== badge ========
  if (opts.badge) {
    const badgeX = lvX + lvTextWidth + 15;
    const badgeY = 130;
    const badgeH = 40;
    const badgeRad = radius;

    ctx.font = "bold 24px Sans";
    const badgeTextWidth = ctx.measureText(opts.badge).width + 50;

    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeTextWidth, badgeH, badgeRad);
    ctx.fillStyle = bgColorPrimary;
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = textColor;
    ctx.fillText(opts.badge, badgeX + 25, badgeY + 28);
  }

  // ====== progress bar ========
  const barWidth = width - 150;
  const barHeight = 30;
  const barX = (width - barWidth) / 2;
  const barY = 230;
  const barX2 = barX;
  const barY2 = barY + barHeight + 50;

  const percent = msgExpInCurrentLevel / msgExpOfLevel;
  const progressWidth = Math.max(40, barWidth * percent);

  const percent2 = vcExpInCurrentLevel / vcExpOfLevel;
  const progressWidth2 = Math.max(40, barWidth * percent2);

  // background
  const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
  gradient.addColorStop(0, bgColorPrimary);
  gradient.addColorStop(1, bgColorPrimary);

  // progress bar
  ctx.beginPath();
  ctx.roundRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 20);
  ctx.fillStyle = bgColorSecondary;
  ctx.fill();

  ctx.beginPath();
  ctx.roundRect(barX, barY, progressWidth, barHeight, 20);
  ctx.fillStyle = gradient;
  ctx.fill();

  // progress bar 2
  ctx.beginPath();
  ctx.roundRect(barX2 - 2, barY2 - 2, barWidth + 4, barHeight + 4, 20);
  ctx.fillStyle = bgColorSecondary;
  ctx.fill();

  ctx.beginPath();
  ctx.roundRect(barX2, barY2, progressWidth2, barHeight, 20);
  ctx.fillStyle = gradient;
  ctx.fill();

  // xp text
  ctx.fillStyle = textColor;
  ctx.textAlign = "end";
  ctx.font = "bold 20px Sans";
  ctx.fillText(`Total: ${opts.msgLvlData.expValue} exp`, barX + barWidth, barY - 15);
  ctx.fillText(`Total: ${opts.vcLvlData.expValue} exp`, barX2 + barWidth, barY2 - 15);

  ctx.textAlign = "start";
  ctx.fillText(`Text Rank #${opts.msgLvlData.rank} - Level ${msgLevel}`, barX, barY - 15);
  ctx.fillText(`Voice Rank #${opts.vcLvlData.rank} - Level ${vcLevel}`, barX2, barY2 - 15);

  const msgXpText = `${msgExpInCurrentLevel} / ${msgExpOfLevel} exp`;
  const msgXpTextX = barX + barWidth / 2;
  const msgXpTextY = barY + 24;

  const vcXpText = `${vcExpInCurrentLevel} / ${vcExpOfLevel} exp`;
  const vcXpTextX = barX2 + barWidth / 2;
  const vcXpTextY = barY2 + 24;

  ctx.font = "bold 20px Sans";
  ctx.textAlign = "center";
  ctx.fillStyle = bgColorPrimary;

  ctx.lineWidth = 4;
  ctx.strokeStyle = textColor;
  ctx.strokeText(msgXpText, msgXpTextX, msgXpTextY);
  ctx.strokeText(vcXpText, vcXpTextX, vcXpTextY);

  ctx.fillText(msgXpText, msgXpTextX, msgXpTextY);
  ctx.fillText(vcXpText, vcXpTextX, vcXpTextY);
  ctx.restore();

  await writeFile("./output.png", canvas.toBuffer("image/png"));

  return canvas.toBuffer("image/png");
}

export default generateRankCard;

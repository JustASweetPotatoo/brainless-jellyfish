import UserLevelProfile, {
  UserLevelProfileJSON,
} from "../database/model/UserLevelProfile";

export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getTotalExpToReachLevel(level: number): number {
  return Math.round((5 / 3) * level ** 3 + 25 * level ** 2 + 100 * level);
}

export function calcLevel(exp: number): number {
  let level = 0;
  while (exp >= getTotalExpToReachLevel(level + 1)) level++;
  return level;
}

export function getApproximateExpToReachLevel(level: number): number {
  return getTotalExpToReachLevel(level) - 20;
}

const tutien = {
  ngungKhi: "Ngưng Khí",
  trucco: "Trúc Cơ",
  ketdan: "Kết Đan",
  nguyenanh: "Nguyên Anh",
  thiennhan: {
    name: "Thiên Nhân",
    child: {
      soky: "Sơ Kỳ",
      trungky: "Trung Kỳ",
      hauky: "Hậu Kỳ",
    },
  },
  banthan: "Bán Thần",
  thienton: {
    name: "Thiên Tôn",
    child: {
      soky: "Sơ Kỳ",
      trungky: "Trung Kỳ",
      hauky: "Hậu Kỳ",
    },
  },
  thienco: {
    name: "Thiên Cổ",
    child: {
      soky: "Sơ Kỳ",
      trungky: "Trung Kỳ",
      hauky: "Hậu Kỳ",
    },
  },
  chuate: "Chúa Tể",
  vinhhangcanh: "Lọ Đế Chí Tôn",
};

export function getTutienState(level: number): {
  main: string;
  child?: string;
} {
  const t = tutien;

  if (level >= 999) return { main: t.vinhhangcanh };
  if (level >= 780) return { main: t.chuate };

  if (level >= 695) return { main: t.thienco.name, child: t.thienco.child.hauky };
  if (level >= 620) return { main: t.thienco.name, child: t.thienco.child.trungky };
  if (level >= 545) return { main: t.thienco.name, child: t.thienco.child.soky };

  if (level >= 470) return { main: t.thienton.name, child: t.thienton.child.hauky };
  if (level >= 405) return { main: t.thienton.name, child: t.thienton.child.trungky };
  if (level >= 340) return { main: t.thienton.name, child: t.thienton.child.soky };

  if (level >= 275) return { main: t.banthan };

  if (level >= 220) return { main: t.thiennhan.name, child: t.thiennhan.child.hauky };
  if (level >= 175) return { main: t.thiennhan.name, child: t.thiennhan.child.trungky };
  if (level >= 130) return { main: t.thiennhan.name, child: t.thiennhan.child.soky };

  if (level >= 85) return { main: t.nguyenanh };
  if (level >= 50) return { main: t.ketdan };
  if (level >= 25) return { main: t.trucco };
  if (level >= 10) return { main: t.ngungKhi };

  return { main: "Phàm Nhân" };
}

export function getRandomExpByContentLenght(content: string): number {
  const contentMaxLength = 100;
  const contentSplitedMaxLenght = 20;

  const contentSplitedLength = content.split(" ").length; // 1
  const contentLenght = content.length; // 1

  const ratio_1 =
    contentLenght > contentMaxLength ? 1.0 : contentLenght / contentMaxLength;
  const ratio_2 =
    contentSplitedLength > contentSplitedMaxLenght
      ? 1.0
      : contentSplitedLength / contentSplitedMaxLenght;

  const ratio = (ratio_1 + 2 * ratio_2) / 2;
  const final = ratio / 2 < 0.5 ? 0.5 : ratio / 2;

  return Math.ceil(getRandomInt(25, 35) * final);
}

export const GREEN_SQUARE_STRING = ":green_square:";
export const WHITE_LAGRGE_SQUARE_STRING = ":white_large_square:";
export const RED_LARGE_SQUARE_STRING = ":red_square:";

export function craftUserLevelProgressBar(percentage: number, level: number): string {
  if (level >= 999) return RED_LARGE_SQUARE_STRING.repeat(10);

  let numberOfGreenSquare = Math.floor(percentage / 10);
  let numberOfWhiteSquare = 10 - numberOfGreenSquare;

  return (
    GREEN_SQUARE_STRING.repeat(numberOfGreenSquare) +
    WHITE_LAGRGE_SQUARE_STRING.repeat(numberOfWhiteSquare)
  );
}

export interface UserlevelStatistic extends UserLevelProfileJSON {
  percentage_progress: number;
}

export function calculateUserLevelStatistic(
  userProfile: UserLevelProfile
): UserlevelStatistic {
  const currentLevelExpRange =
    getTotalExpToReachLevel(userProfile.messageExp + 1) -
    getTotalExpToReachLevel(userProfile.messageExp);

  const expOnCurrentLevel =
    userProfile.messageExp - getTotalExpToReachLevel(userProfile.messageExp);
  const percentageProgress = Math.floor((expOnCurrentLevel / currentLevelExpRange) * 100);

  return { ...userProfile.toJSON(), percentage_progress: percentageProgress };
}

export function calcExp(content: string) {
  const contentMaxLength = 100;
  const contentSplitedMaxLenght = 20;

  const contentSplitedLength = content.split(" ").length; // 1
  const contentLenght = content.length; // 1

  const ratio_1 =
    contentLenght > contentMaxLength ? 1.0 : contentLenght / contentMaxLength;
  const ratio_2 =
    contentSplitedLength > contentSplitedMaxLenght
      ? 1.0
      : contentSplitedLength / contentSplitedMaxLenght;

  const ratio = (ratio_1 + 2 * ratio_2) / 2;
  const final = ratio / 2 < 0.5 ? 0.5 : ratio / 2;

  return Math.ceil(getRandomInt(25, 35) * final);
}

export function craftEmbedProgressBar(percentage: number) {
  percentage = Math.floor(percentage);
  const green_square = ":green_square:";
  const white_large_square = ":white_large_square:";
  const numberOfGreenSquare = Math.floor(percentage / 10);
  return percentage >= 999
    ? ":red_square:".repeat(10)
    : `${green_square.repeat(numberOfGreenSquare)}${white_large_square.repeat(
        10 - numberOfGreenSquare
      )} ${percentage}%`;
}

export function calcPercentageOfProgress(exp: number) {
  const currentLevel = calcLevel(exp);
  const a2 = getTotalExpToReachLevel(currentLevel + 1);
  const a1 = getTotalExpToReachLevel(currentLevel);

  const a3 = Math.floor(((exp - a1) / (a2 - a1)) * 100);

  return a3;
}

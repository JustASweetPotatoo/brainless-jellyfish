import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function hashOtp(email: string, otp: string): string {
  const secret = process.env.AUTH_OTP_SECRET ?? process.env.DISCORD_CLIENT_SECRET;
  if (!secret) {
    throw new Error("Set AUTH_OTP_SECRET or DISCORD_CLIENT_SECRET before enabling admin login.");
  }

  return createHmac("sha256", secret).update(`${email}:${otp}`).digest("hex");
}

function safeEqualHex(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

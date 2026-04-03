/**
 * نظام مصادقة مستقل — Email/Password + JWT محلي
 * أسرع من Manus OAuth: لا latency خارجي، كل شيء محلي
 */
import * as bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "crypto";
import { ENV } from "./env";
import * as db from "../db";

const SALT_ROUNDS = 12;

// ===== تشفير كلمة المرور =====
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ===== توليد openId فريد للمستخدمين المحليين =====
export function generateLocalOpenId(): string {
  return `local_${randomBytes(16).toString("hex")}`;
}

// ===== توليد token عشوائي =====
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

// ===== إنشاء JWT session (محلي — لا يحتاج Manus) =====
export async function createSessionToken(openId: string, name: string): Promise<string> {
  const secret = new TextEncoder().encode(ENV.cookieSecret);
  const expiresAt = Math.floor(Date.now() / 1000) + 365 * 24 * 3600;
  return new SignJWT({ openId, name, appId: "fada-local" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expiresAt)
    .sign(secret);
}

// ===== التحقق من JWT session =====
export async function verifySessionToken(
  token: string | undefined | null
): Promise<{ openId: string; name: string } | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const { openId, name } = payload as Record<string, unknown>;
    if (typeof openId !== "string" || typeof name !== "string") return null;
    return { openId, name };
  } catch {
    return null;
  }
}

// ===== تسجيل مستخدم جديد =====
export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ openId: string; sessionToken: string }> {
  const existing = await db.getUserByEmail(input.email);
  if (existing) throw new Error("البريد الإلكتروني مسجّل مسبقاً");

  const passwordHash = await hashPassword(input.password);
  const openId = generateLocalOpenId();

  await db.upsertUser({
    openId,
    name: input.name,
    email: input.email,
    passwordHash,
    emailVerified: true, // نفعّل مباشرة بدون تحقق بريد في البداية
    loginMethod: "email",
    lastSignedIn: new Date(),
  });

  const sessionToken = await createSessionToken(openId, input.name);
  return { openId, sessionToken };
}

// ===== تسجيل الدخول =====
export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ user: Awaited<ReturnType<typeof db.getUserByOpenId>>; sessionToken: string }> {
  const user = await db.getUserByEmail(input.email);
  if (!user || !user.passwordHash) {
    throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");

  await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
  const sessionToken = await createSessionToken(user.openId, user.name ?? "");
  return { user, sessionToken };
}

// ===== طلب إعادة تعيين كلمة المرور =====
export async function requestPasswordReset(email: string): Promise<string | null> {
  const user = await db.getUserByEmail(email);
  if (!user) return null;

  const token = generateToken();
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // ساعة

  await db.upsertUser({
    openId: user.openId,
    passwordResetToken: token,
    passwordResetExpiry: expiry,
  });

  return token;
}

// ===== إعادة تعيين كلمة المرور =====
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const user = await db.getUserByResetToken(token);
  if (!user || !user.passwordResetExpiry) return false;
  if (new Date() > user.passwordResetExpiry) return false;

  const passwordHash = await hashPassword(newPassword);
  await db.upsertUser({
    openId: user.openId,
    passwordHash,
    passwordResetToken: null,
    passwordResetExpiry: null,
  });

  return true;
}

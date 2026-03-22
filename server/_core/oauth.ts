import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";
import * as db from "../db";
import { getDb } from "../db";
import { getMousaUserByOpenId } from "../mousa";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // 1. Upsert user in local DB
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      // 2. Auto-link Mousa.ai account (non-blocking, best-effort)
      // Runs in background so it never delays the login redirect
      const openIdSnapshot = userInfo.openId;
      getMousaUserByOpenId(openIdSnapshot)
        .then(async (mousaData) => {
          if (!mousaData?.userId) return;
          const localUser = await db.getUserByOpenId(openIdSnapshot);
          if (!localUser || localUser.mousaUserId) return; // already linked
          const dbInstance = await getDb();
          if (!dbInstance) return;
          await dbInstance
            .update(users)
            .set({
              mousaUserId: mousaData.userId,
              mousaBalance: mousaData.balance,
              mousaLastSync: new Date(),
            })
            .where(eq(users.openId, openIdSnapshot));
          console.log(
            `[OAuth] Auto-linked Mousa.ai userId=${mousaData.userId} for openId=${openIdSnapshot}`
          );
        })
        .catch((err) => {
          // Non-critical: log but don't fail login
          console.warn(
            "[OAuth] Failed to auto-link Mousa.ai account:",
            err?.message ?? err
          );
        });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

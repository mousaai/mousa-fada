import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

function isLocalHost(req: Request): boolean {
  const hostname = req.hostname || "";
  return LOCAL_HOSTS.has(hostname) || isIpAddress(hostname);
}

/**
 * Cookie options للجلسة.
 *
 * Safari ITP و Brave Shields يمنعان الـ cookies من domain مختلف
 * إلا إذا كانت SameSite=None + Secure=true.
 *
 * القاعدة:
 * - في الإنتاج (HTTPS): SameSite=None, Secure=true, Domain=.mousa.ai
 * - في التطوير (localhost): SameSite=Lax, Secure=false, بدون Domain
 */
export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const isLocal = isLocalHost(req);
  const isSecure = isSecureRequest(req);

  if (isLocal) {
    // localhost — لا يدعم SameSite=None بدون Secure
    return {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false,
    };
  }

  // الإنتاج — SameSite=None + Secure=true لدعم Safari/Brave
  // Domain=.mousa.ai يسمح بمشاركة الـ cookie بين fada.mousa.ai و mousa.ai
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true, // مطلوب دائماً مع SameSite=None
    domain: ".mousa.ai",
  };
}

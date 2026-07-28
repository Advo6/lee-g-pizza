import { createHmac, timingSafeEqual } from "crypto";

import { cookies } from "next/headers";

import type { NextRequest } from "next/server";



export const ADMIN_COOKIE_NAME = "admin_session";

const SESSION_SALT = "lee-g-admin-session-v1";



export function getAdminPassword(): string {

  return process.env.ADMIN_PASSWORD || "lee-g-admin";

}



export function createSessionToken(): string {

  return createHmac("sha256", getAdminPassword()).update(SESSION_SALT).digest("hex");

}



export function verifySessionToken(token: string | undefined | null): boolean {

  if (!token) return false;

  const expected = createSessionToken();

  try {

    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));

  } catch {

    return false;

  }

}



export function verifyPassword(password: string): boolean {

  const expected = getAdminPassword();

  try {

    return timingSafeEqual(Buffer.from(password), Buffer.from(expected));

  } catch {

    return false;

  }

}



export function isAdminRequest(req: NextRequest): boolean {

  return verifySessionToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value);

}



export async function isAdminAuthenticated(): Promise<boolean> {

  const cookieStore = await cookies();

  return verifySessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);

}



export const ADMIN_SESSION_COOKIE_OPTIONS = {

  httpOnly: true,

  secure: process.env.NODE_ENV === "production",

  sameSite: "lax" as const,

  path: "/",

  maxAge: 60 * 60 * 24 * 7,

};



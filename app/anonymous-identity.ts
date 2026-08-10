import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

const DEVICE_COOKIE = "carbon_device_id";
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AnonymousIdentity = {
  userId: string;
  displayName: string;
  email: string;
};

export async function getAnonymousIdentity(): Promise<AnonymousIdentity> {
  const cookieStore = await cookies();
  const existingId = cookieStore.get(DEVICE_COOKIE)?.value;
  const deviceId =
    existingId && UUID_PATTERN.test(existingId) ? existingId : randomUUID();

  if (deviceId !== existingId) {
    cookieStore.set(DEVICE_COOKIE, deviceId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_YEAR_IN_SECONDS,
    });
  }

  return {
    userId: `device:${deviceId}`,
    displayName: "新用户",
    email: "",
  };
}

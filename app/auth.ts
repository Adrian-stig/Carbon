import { auth, currentUser } from "@clerk/nextjs/server";

export type AppUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

export function isClerkConfigured() {
  return Boolean(
    process.env.CLERK_SECRET_KEY &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
}

export async function getAppUser(): Promise<AppUser | null> {
  if (!isClerkConfigured()) return null;

  const session = await auth();
  if (!session.isAuthenticated || !session.userId) return null;

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress;
  if (!user || !email) return null;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return {
    userId: session.userId,
    email,
    fullName: fullName || null,
    displayName: fullName || email.split("@")[0],
  };
}

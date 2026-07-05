import { createClerkClient } from "@clerk/backend";

export const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY;
export const clerkSecretkey = process.env.CLERK_SECRET_KEY;

if (!clerkPublishableKey || !clerkSecretkey) {
  throw new Error("Clerk environment keys are required!");
}

export const clerkClient = createClerkClient({
  publishableKey: clerkPublishableKey,
  secretKey: clerkSecretkey,
});

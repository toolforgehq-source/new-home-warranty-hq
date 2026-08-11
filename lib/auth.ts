import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    "http://localhost:3000",
  ].filter((url): url is string => typeof url === "string" && url.length > 0),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === "true",
    async sendResetPassword({ user, url, token }) {
      // TODO: send password reset email via Resend
      console.log("[sendResetPassword]", user.email, url, token);
    },
  },
  emailVerification: {
    async sendVerificationEmail({ user, url, token }) {
      // TODO: send verification email via Resend
      console.log("[sendVerificationEmail]", user.email, url, token);
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "HOMEOWNER", input: false },
      status: { type: "string", defaultValue: "ACTIVE", input: false },
      permissions: { type: "string[]", defaultValue: [], input: false },
      phone: { type: "string", required: false },
      smsOptIn: { type: "boolean", defaultValue: false },
      smsConsentAt: { type: "date", required: false },
      onboardingCompletedAt: { type: "date", required: false },
    },
  },
  plugins: [nextCookies()],
});

export type Auth = typeof auth;

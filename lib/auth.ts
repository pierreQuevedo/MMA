// lib/auth.ts
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";
import { createAuthMiddleware } from "better-auth/api";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL!,     // e.g. http://localhost:3000
  secret: process.env.BETTER_AUTH_SECRET!,   // obligatoire en prod
  database: pool,                             // Pool pg supporté officiellement

  session: {
    expiresIn: 60 * 60 * 24 * 7,  // 7 jours
    updateAge: 60 * 60 * 24,      // refresh si > 24h
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookies: {
      session_token: {
        // name: "myapp_session", // optionnel, si tu veux renommer
        attributes: {
          sameSite: "lax",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        },
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    minPasswordLength: 8,
  },

  onAPIError: {
    throw: true,
    onError: (error /*, ctx */) => {
      console.error("[BetterAuth] API error:", error);
    },
    errorURL: "/auth/error",
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // ctx.path est bien supporté
      // (ex: "/sign-up/email", "/sign-in/email", etc.)
      console.log("[BA before]", ctx.path);
    }),
    after: createAuthMiddleware(async (ctx) => {
      console.log("[BA after]", ctx.path, "returned:", ctx.context.returned);
    }),
  },

  plugins: [nextCookies()], // garder en dernier
});

// •	superadmin@exemple.com / password123 → /admin/dashboard
// •	owner@acme.com / password123 → /acme/dashboard (Owner)
// •	member@acme.com / password123 → /acme/dashboard (Member)
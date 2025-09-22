import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,
  database: pool,
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookies: {
      session_token: { attributes: { sameSite: "lax", secure: process.env.NODE_ENV === "production", httpOnly: true } },
    },
  },
  emailAndPassword: { enabled: true },
  plugins: [nextCookies()],
});
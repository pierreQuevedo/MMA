import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getServerSession() {
  // headers() est synchrone → pas de await
  const rh = headers();

  // Cast vers Headers (compatibilité Better Auth)
  const h = new Headers(rh as any);

  return auth.api.getSession({ headers: h });
}
"use client";
import { createContext, useContext } from "react";

type AdminCtx = { session: any; appUser: any };
const Ctx = createContext<AdminCtx | null>(null);

export function AdminProvider({ value, children }: { value: AdminCtx; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdmin() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdmin must be used within <AdminProvider>");
  return v;
}
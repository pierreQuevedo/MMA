"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { data,error } = await authClient.signIn.email({ email, password });
    console.log("signIn", { data, error });
    if (error) {
      // todo: toast erreur
      return;
    }
    // Important: on passe par /post-login qui décide où aller
    window.location.href = "/post-login";
  }

  return (
    <main className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Connexion</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full rounded border p-2" type="email" value={email}
               onChange={(e)=>setEmail(e.target.value)} placeholder="email@exemple.com" required/>
        <input className="w-full rounded border p-2" type="password" value={password}
               onChange={(e)=>setPassword(e.target.value)} placeholder="Mot de passe" required/>
        <button className="w-full rounded bg-black px-4 py-2 text-white">Se connecter</button>
      </form>
    </main>
  );
}


// 	•	Tous les utilisateurs auront password123 comme mot de passe.
	// •	Tu peux te connecter via ta page /login avec :
	// •	superadmin@exemple.com → /admin/dashboard
	// •	owner@acme.com → /acme/dashboard
	// •	member@acme.com → /acme/dashboard

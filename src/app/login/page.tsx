"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login() {
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMsg("Virhe: " + error.message);
      setLoading(false);
      return;
    }

    // jos middleware on käytössä, voidaan ohjata takaisin "next":iin
    const next = new URLSearchParams(window.location.search).get("next") || "/reports";
    window.location.href = next;
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow">
        <h1 className="text-xl font-semibold text-slate-900">Kirjaudu sisään</h1>

        <div className="mt-4 grid gap-3">
          <div>
            <div className="text-sm font-medium text-slate-700">Sähköposti</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="info@jltt.fi"
              autoComplete="email"
            />
          </div>

          <div>
            <div className="text-sm font-medium text-slate-700">Salasana</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="••••••••"
              autoComplete="current-password"
              onKeyDown={(e) => {
                if (e.key === "Enter") login();
              }}
            />
          </div>

          <button
            onClick={login}
            disabled={!email || !password || loading}
            className="mt-1 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Kirjaudutaan…" : "Kirjaudu"}
          </button>

          {msg ? <div className="text-sm text-slate-700">{msg}</div> : null}
        </div>
      </div>
    </main>
  );
}

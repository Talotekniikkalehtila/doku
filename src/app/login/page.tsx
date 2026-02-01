"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const BRAND = "#3060a6";

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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

    const { data: s2 } = await supabase.auth.getSession();
    if (!s2.session) {
      setMsg("Sessio puuttuu. Tarkista domain / cookie.");
      setLoading(false);
      return;
    }

    const next =
      new URLSearchParams(window.location.search).get("next") || "/";
    window.location.href = next;
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{
        background: `linear-gradient(135deg,
          ${hexToRgba(BRAND, 0.95)},
          ${hexToRgba(BRAND, 0.75)},
          ${hexToRgba(BRAND, 0.9)}
        )`,
      }}
    >
      {/* Taustan “valoefekti” */}
      <div
        className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full blur-3xl"
        style={{ background: hexToRgba("#ffffff", 0.25) }}
      />
      <div
        className="absolute -bottom-32 -right-32 h-[420px] w-[420px] rounded-full blur-3xl"
        style={{ background: hexToRgba("#000000", 0.15) }}
      />

      {/* Login-kortti */}
      <div className="relative z-10 w-full max-w-sm px-5">
        <div
          className="rounded-3xl border p-6 shadow-xl backdrop-blur-xl"
          style={{
            background: hexToRgba("#ffffff", 0.92),
            borderColor: hexToRgba("#ffffff", 0.35),
          }}
        >
          <div className="mb-6 text-center">
            <div
              className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl text-white"
              style={{
                background: `linear-gradient(135deg, ${BRAND}, ${hexToRgba(
                  BRAND,
                  0.85
                )})`,
              }}
            >
              🔒
            </div>
            <h1 className="text-xl font-semibold text-slate-900">
              Kirjaudu sisään
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Dokumentointisovellus
            </p>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Sähköposti
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ focusRingColor: BRAND }}
                placeholder="info@jltt.fi"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Salasana
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ focusRingColor: BRAND }}
                placeholder="••••••••"
                autoComplete="current-password"
                onKeyDown={(e) => e.key === "Enter" && login()}
              />
            </div>

            <button
              onClick={login}
              disabled={!email || !password || loading}
              className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow transition active:scale-[0.98] disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${BRAND}, ${hexToRgba(
                  BRAND,
                  0.85
                )})`,
              }}
            >
              {loading ? "Kirjaudutaan…" : "Kirjaudu"}
            </button>

            {msg && (
              <div className="text-center text-sm text-slate-700">{msg}</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

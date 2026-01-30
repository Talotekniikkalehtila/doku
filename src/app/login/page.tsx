"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendMagicLink() {
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // 🔴 TÄRKEÄ: EI localhostia
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMsg("Virhe: " + error.message);
    } else {
      setMsg("Kirjautumislinkki lähetetty sähköpostiisi.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow">
        <h1 className="text-xl font-semibold text-slate-900">
          Kirjaudu sisään
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Syötä sähköpostiosoite. Saat kirjautumislinkin sähköpostiisi.
        </p>

        <input
          type="email"
          placeholder="sähköposti@yritys.fi"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-4 w-full rounded-xl border px-3 py-2 text-sm"
        />

        <button
          onClick={sendMagicLink}
          disabled={!email || loading}
          className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Lähetetään…" : "Lähetä kirjautumislinkki"}
        </button>

        {msg && (
          <div className="mt-4 text-sm text-slate-700">
            {msg}
          </div>
        )}
      </div>
    </main>
  );
}

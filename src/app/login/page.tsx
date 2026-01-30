"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (s.session?.user?.id) window.location.href = "/";
    })();
  }, []);

  async function sendLink() {
    setSending(true);
    setMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin, // palaa etusivulle linkistä
      },
    });

    if (error) {
      setMsg("Virhe: " + error.message);
      setSending(false);
      return;
    }

    setMsg("Lähetetty! Tarkista sähköposti ja avaa kirjautumislinkki.");
    setSending(false);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-md p-4 grid gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-slate-500">Kirjautuminen</div>
          <div className="text-xl font-semibold">Dokumentointi</div>

          <div className="mt-4 grid gap-2">
            <div className="text-xs text-slate-500">Sähköposti</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border px-3 py-2"
              placeholder="nimi@yritys.fi"
              type="email"
            />

            <button
              onClick={sendLink}
              disabled={sending || !email}
              className="mt-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              type="button"
            >
              {sending ? "Lähetetään..." : "Lähetä kirjautumislinkki"}
            </button>

            {msg ? <div className="mt-2 text-sm text-slate-700">{msg}</div> : null}
          </div>
        </div>

        <button
          onClick={() => (window.location.href = "/")}
          className="rounded-xl px-4 py-2 text-sm hover:bg-slate-100"
          type="button"
        >
          ← Takaisin
        </button>
      </div>
    </main>
  );
}

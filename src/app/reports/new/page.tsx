"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function NewReportPage() {
  const [title, setTitle] = useState("Uusi raportti");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function createReport() {
    setLoading(true);
    setMsg("");

    const { data: s } = await supabase.auth.getSession();
    const uid = s.session?.user?.id;
    if (!uid) {
      window.location.href = "/login";
      return;
    }

    await supabase
      .from("profiles")
      .upsert({ id: uid, display_name: s.session?.user?.email });

    const { data, error } = await supabase
      .from("reports")
      .insert({ owner_id: uid, title })
      .select("id")
      .single();

    console.log("create report result:", { data, error });

    if (error) {
      setMsg("Raportin luonti epäonnistui: " + error.message);
      setLoading(false);
      return;
    }

    if (!data?.id) {
      setMsg("Raportti luotiin, mutta ID puuttuu. Tarkista insert/select.");
      setLoading(false);
      return;
    }

    window.location.href = `/reports/${data.id}`;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-xl p-4 grid gap-4">
        <div className="rounded-2xl border border-slate-300 bg-white p-4">
          <div className="text-sm text-slate-800">Luo uusi raportti</div>

          <div className="mt-3 grid gap-2">
            <label className="text-xs font-medium text-slate-900">
              Raportin nimi
            </label>

            <input
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Esim. IV-huollon raportti"
            />
          </div>

          <button
            onClick={createReport}
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Luodaan..." : "Luo ja siirry muokkaukseen"}
          </button>

          {msg ? <div className="mt-3 text-sm text-red-600">{msg}</div> : null}
        </div>

        <button
          onClick={() => (window.location.href = "/")}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 hover:bg-slate-50"
        >
          ← Takaisin
        </button>
      </div>
    </main>
  );
}

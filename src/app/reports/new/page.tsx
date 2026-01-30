"use client";

import { useEffect, useState } from "react";
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

  await supabase.from("profiles").upsert({ id: uid, display_name: s.session?.user?.email });

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
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-xl p-4 grid gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-slate-500">Luo uusi raportti</div>
          <div className="mt-2 grid gap-2">
            <div className="text-xs text-slate-500">Raportin nimi</div>
            <input
              className="rounded-xl border px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <button
            onClick={createReport}
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            {loading ? "Luodaan..." : "Luo ja siirry muokkaukseen"}
          </button>

          {msg ? <div className="mt-3 text-sm text-red-600">{msg}</div> : null}
        </div>

        <button onClick={() => (window.location.href = "/")} className="rounded-xl px-4 py-2 text-sm hover:bg-slate-100">
          ← Takaisin
        </button>
      </div>
    </main>
  );
}

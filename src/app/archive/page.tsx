"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ArchivePage() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session?.user?.id) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("reports")
        .select("id,title,status,created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) setMsg(error.message);
      setRows(data ?? []);
    })();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl p-4 grid gap-4">
        <div className="flex items-center justify-between">
          <button onClick={() => (window.location.href = "/")} className="rounded-xl px-3 py-2 text-sm hover:bg-slate-100">
            ← Takaisin
          </button>
          <div className="text-sm font-semibold">Arkisto</div>
          <div />
        </div>

        <div className="rounded-2xl border bg-white p-4">
          {msg ? <div className="text-sm text-red-600">{msg}</div> : null}

          <div className="grid gap-2">
            {rows.map((r) => (
              <button
                key={r.id}
                onClick={() => (window.location.href = `/reports/${r.id}`)}
                className="flex items-center justify-between rounded-xl border px-4 py-3 text-left hover:bg-slate-50"
              >
                <div>
                  <div className="font-semibold">{r.title}</div>
                  <div className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="text-xs text-slate-500">{r.status}</div>
              </button>
            ))}

            {rows.length === 0 ? (
              <div className="text-sm text-slate-500">Ei vielä raportteja.</div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

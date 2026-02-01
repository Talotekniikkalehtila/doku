"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ReportRow = {
  id: string;
  title: string | null;
  created_at: string;
};

export default function ArchivePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from("reports")
      .select("id,title,created_at")
      .order("created_at", { ascending: false });

    if (!error && data) setRows(data as any);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filteredRows = rows.filter((r) => {
    const q = query.toLowerCase();
    return (
      (r.title ?? "").toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => router.back()}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 hover:bg-slate-50"
          >
            ← Takaisin
          </button>

          <h1 className="text-lg font-semibold text-slate-900">Arkisto</h1>

          {/* spacer jotta otsikko pysyy keskellä */}
          <div className="w-[92px]" />
        </div>

        {/* Haku */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Hae raporttia nimellä tai ID:llä…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        {/* Lista */}
        {loading ? (
          <div className="mt-4 text-slate-700">Ladataan…</div>
        ) : filteredRows.length === 0 ? (
          <div className="mt-4 text-slate-700">
            {query ? "Ei hakutuloksia." : "Ei raportteja vielä."}
          </div>
        ) : (
          <div className="mt-4 grid gap-2">
            {filteredRows.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-slate-300 bg-white p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/reports/${r.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {r.title || "Raportti"}
                  </Link>

                  <button
                    onClick={async () => {
                      if (!confirm("Poistetaanko raportti pysyvästi?")) return;
                      const { error } = await supabase
                        .from("reports")
                        .delete()
                        .eq("id", r.id);

                      if (error)
                        return alert("Poisto epäonnistui: " + error.message);

                      load();
                    }}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 hover:bg-slate-50"
                  >
                    Poista
                  </button>
                </div>

                <div className="mt-1 text-sm text-slate-700">
                  {new Date(r.created_at).toLocaleString("fi-FI")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}


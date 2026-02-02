"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, Search, Trash2, RefreshCcw, Archive as ArchiveIcon } from "lucide-react";

type ReportRow = {
  id: string;
  title: string | null;
  created_at: string;
};

const BRAND = "#3060a6";

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const glassCardStyle = {
  background: hexToRgba("#ffffff", 0.86),
  borderColor: hexToRgba("#ffffff", 0.55),
} as const;

const glassCardClass =
  "rounded-3xl border p-5 shadow-lg ring-1 ring-white/60 backdrop-blur-xl";

export default function ArchivePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      return (r.title ?? "").toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    });
  }, [rows, query]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Sama bränditausta kuin etusivu */}
      <div
        className="absolute inset-0 animate-homebg"
        style={{
          background: `
            radial-gradient(1200px 600px at 10% 10%, ${hexToRgba(BRAND, 0.18)}, transparent 60%),
            radial-gradient(1000px 500px at 90% 20%, ${hexToRgba(BRAND, 0.12)}, transparent 60%),
            radial-gradient(900px 500px at 50% 95%, ${hexToRgba(BRAND, 0.10)}, transparent 60%),
            linear-gradient(180deg, ${hexToRgba(BRAND, 0.10)}, transparent 35%)
          `,
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-7 grid gap-4">
        {/* Header card */}
        <div className={glassCardClass} style={glassCardStyle}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-white/60 backdrop-blur-xl transition active:scale-[0.99]"
              style={{ background: hexToRgba("#ffffff", 0.88) }}
              type="button"
            >
              <ArrowLeft size={18} />
              Takaisin
            </button>

            <div className="min-w-0 text-center">
              <div className="text-xs font-medium text-slate-600">Dokumentointi</div>
              <h1 className="mt-1 inline-flex items-center justify-center gap-2 text-2xl font-semibold text-slate-900">
                <ArchiveIcon size={22} style={{ color: BRAND }} />
                Arkisto
              </h1>
              <div className="mt-2 text-sm text-slate-700">
                {rows.length} raporttia
              </div>
            </div>

            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-white/60 backdrop-blur-xl transition active:scale-[0.99]"
              style={{ background: hexToRgba("#ffffff", 0.88) }}
              type="button"
              title="Päivitä"
            >
              <RefreshCcw size={18} className="text-slate-500" />
              Päivitä
            </button>
          </div>
        </div>

        {/* Search card (glass + shimmer) */}
        <div
          className="group relative overflow-hidden rounded-3xl p-5 shadow-lg ring-1 ring-white/60 backdrop-blur-xl"
          style={{ background: hexToRgba("#ffffff", 0.86) }}
        >
          {/* Shimmer */}
          <div
            className="pointer-events-none absolute -inset-y-10 -left-40 w-40 rotate-12 opacity-0 blur-xl transition duration-700 group-hover:opacity-100 group-hover:translate-x-[720px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${hexToRgba("#ffffff", 0.65)}, transparent)`,
            }}
          />

          <div className="flex items-center gap-3">
            <div
              className="grid h-11 w-11 place-items-center rounded-2xl text-white shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${BRAND}, ${hexToRgba(BRAND, 0.85)})`,
              }}
              aria-hidden
            >
              <Search size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900">Haku</div>
              <div className="text-xs text-slate-600">Nimellä tai ID:llä</div>
            </div>
          </div>

          <input
            type="text"
            placeholder="Hae raporttia…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-4 w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-600 outline-none transition focus:border-white/90 focus:ring-4"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className={glassCardClass} style={glassCardStyle}>
            <div className="text-slate-700">Ladataan…</div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className={glassCardClass} style={glassCardStyle}>
            <div className="text-slate-700">
              {query ? "Ei hakutuloksia." : "Ei raportteja vielä."}
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredRows.map((r) => (
              <div
                key={r.id}
                className="group relative overflow-hidden rounded-3xl p-5 shadow-lg ring-1 ring-white/60 backdrop-blur-xl transition active:scale-[0.995]"
                style={{ background: hexToRgba("#ffffff", 0.86) }}
              >
                {/* hover shimmer kevyt */}
                <div
                  className="pointer-events-none absolute -inset-y-10 -left-44 w-44 rotate-12 opacity-0 blur-xl transition duration-700 group-hover:opacity-100 group-hover:translate-x-[820px]"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${hexToRgba("#ffffff", 0.55)}, transparent)`,
                  }}
                />

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/reports/${r.id}`}
                      className="block text-lg font-semibold text-slate-900 hover:underline truncate"
                      title={r.title ?? "Raportti"}
                    >
                      {r.title || "Raportti"}
                    </Link>

                    <div className="mt-1 text-sm text-slate-700">
                      {new Date(r.created_at).toLocaleString("fi-FI")}
                    </div>

                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BRAND }} />
                      ID: <span className="font-mono">{r.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/reports/${r.id}`}
                      className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99]"
                      style={{
                        background: `linear-gradient(135deg, ${BRAND}, ${hexToRgba(BRAND, 0.92)})`,
                      }}
                    >
                      Avaa →
                    </Link>

                    <button
                      onClick={async () => {
                        if (busyId) return;
                        if (!confirm("Poistetaanko raportti pysyvästi?")) return;

                        setBusyId(r.id);
                        const { error } = await supabase.from("reports").delete().eq("id", r.id);
                        setBusyId(null);

                        if (error) return alert("Poisto epäonnistui: " + error.message);

                        load();
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-white/60 backdrop-blur-xl transition active:scale-[0.99]"
                      style={{ background: hexToRgba("#ffffff", 0.88) }}
                      type="button"
                      title="Poista"
                    >
                      <Trash2 size={16} className="text-rose-600" />
                      {busyId === r.id ? "…" : "Poista"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
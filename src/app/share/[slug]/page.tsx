"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ImageMarkerEditor } from "@/components/ImageMarkerEditor";
import { PointModal } from "@/components/PointModal";

// ✅ VAIHDA TÄMÄ
const BUCKET = "report-images";

type ShareMeta = {
  report_id: string;
  password_required: boolean;
  expires_at: string | null;
};

export default function SharePage() {
  const { slug } = useParams<{ slug: string }>();

  const [meta, setMeta] = useState<ShareMeta | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [password, setPassword] = useState("");
  const [submittedPass, setSubmittedPass] = useState<string | null>(null);

  const [loadingData, setLoadingData] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [report, setReport] = useState<any>(null);
  const [points, setPoints] = useState<any[]>([]);
  const [pointImages, setPointImages] = useState<any[]>([]);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const [openPointId, setOpenPointId] = useState<string | null>(null);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-xl font-semibold">Jaettu raportti</h1>
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Supabase env puuttuu selaimesta. URL: {String(!!url)} / ANON: {String(!!anon)}
        </div>
      </div>
    </main>
  );
}
  const openPoint = useMemo(
    () => points.find((p) => p.id === openPointId) || null,
    [points, openPointId]
  );
  const openImgs = useMemo(
    () => pointImages.filter((im) => im.point_id === openPointId),
    [pointImages, openPointId]
  );

  const supabaseBase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  function makeShareClient(passToUse: string | null) {
    const headers: Record<string, string> = { "x-share-slug": slug as string };
    if (passToUse) headers["x-share-pass"] = passToUse;

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers } }
    );
  }

  // 1) meta RPC: share_get_meta
  useEffect(() => {
    if (!slug) return;

    let alive = true;
    (async () => {
      setLoadingMeta(true);
      setErr(null);
      setMeta(null);

      const { data, error } = await supabaseBase.rpc("share_get_meta", { p_slug: slug });

      if (!alive) return;

      if (error) {
        setErr("Share-linkin haku epäonnistui: " + error.message);
        setLoadingMeta(false);
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        setErr("Share-linkkiä ei löytynyt tai se on poistettu.");
        setLoadingMeta(false);
        return;
      }

      if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
        setErr("Share-linkki on vanhentunut.");
        setLoadingMeta(false);
        return;
      }

      setMeta({
        report_id: row.report_id,
        password_required: !!row.password_required,
        expires_at: row.expires_at ?? null,
      });

      setLoadingMeta(false);
    })();

    return () => {
      alive = false;
    };
  }, [slug, supabaseBase]);

  // 2) data RLS: reports + report_points + report_point_images
  async function loadShared(passToUse: string | null) {
    if (!meta || !slug) return;

    setErr(null);
    setLoadingData(true);

    try {
      setSubmittedPass(passToUse);

      const client = makeShareClient(passToUse);

      // report
      const { data: r, error: er } = await client
        .from("reports")
        .select("*")
        .eq("id", meta.report_id)
        .single();
      if (er) throw new Error(er.message);

      // points
      const { data: ps, error: ep } = await client
        .from("report_points")
        .select("*")
        .eq("report_id", meta.report_id)
        .order("created_at", { ascending: true });
      if (ep) throw new Error(ep.message);

      // point images
      const pointIds = (ps ?? []).map((p: any) => p.id);
      let ims: any[] = [];
      if (pointIds.length) {
        const { data: im, error: ei } = await client
          .from("report_point_images")
          .select("*")
          .in("point_id", pointIds)
          .order("created_at", { ascending: true });
        if (ei) throw new Error(ei.message);
        ims = im ?? [];
      }

      // cover signed url (private bucket)
      if (r?.cover_image_path) {
        const { data: cu, error: ce } = await client.storage
          .from(BUCKET)
          .createSignedUrl(r.cover_image_path, 60 * 60); // 1h
        if (ce) throw new Error(ce.message);
        setCoverUrl(cu?.signedUrl ?? null);
      } else {
        setCoverUrl(null);
      }

      // signed urlt pistekuville
      const imsWithUrls = await Promise.all(
        ims.map(async (im: any) => {
          if (!im.image_path) return { ...im, _signedUrl: null };
          const { data: su, error: se } = await client.storage
            .from(BUCKET)
            .createSignedUrl(im.image_path, 60 * 60);
          if (se) return { ...im, _signedUrl: null };
          return { ...im, _signedUrl: su?.signedUrl ?? null };
        })
      );

      setReport(r);
      setPoints(ps ?? []);
      setPointImages(imsWithUrls);
    } catch (e: any) {
      setReport(null);
      setPoints([]);
      setPointImages([]);
      setCoverUrl(null);
      setErr(e?.message || "Datan haku epäonnistui.");
    } finally {
      setLoadingData(false);
    }
  }

  // auto load if no password
  useEffect(() => {
    if (!meta) return;
    if (meta.password_required) return;
    loadShared(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.report_id]);

  if (!slug) return null;

  if (loadingMeta) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10 text-slate-600">Haetaan jakolinkkiä…</div>
      </main>
    );
  }

  if (err || !meta) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <h1 className="text-xl font-semibold text-slate-900">Jaettu raportti</h1>
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {err || "Linkki ei ole käytettävissä."}
          </div>
        </div>
      </main>
    );
  }

  // password gate
  if (meta.password_required && !report) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <h1 className="text-xl font-semibold text-slate-900">Raportti on suojattu</h1>
          <p className="mt-2 text-slate-600">Syötä salasana nähdäksesi raportin.</p>

          <div className="mt-5 rounded-2xl border bg-white p-4 shadow-sm">
            <label className="block text-sm font-medium text-slate-700">Salasana</label>
            <input
              className="mt-2 w-full rounded-xl border px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <button
              className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={loadingData || !password.trim()}
              onClick={() => loadShared(password.trim())}
              type="button"
            >
              {loadingData ? "Avataan…" : "Avaa"}
            </button>

            {err ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {err}
              </div>
            ) : null}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 grid gap-4">
        <div>
          <div className="text-sm text-slate-500">Jaettu raportti</div>
          <h1 className="text-2xl font-semibold text-slate-900">{report?.title || "Raportti"}</h1>
        </div>

        <div className="rounded-2xl border bg-white p-4 grid gap-3">
          <div>
            <div className="text-sm font-semibold">Kuva</div>
            <div className="text-xs text-slate-500">
              Klikkaa pisteitä nähdäksesi sisällön. (Read-only)
            </div>
          </div>

          {coverUrl ? (
            <ImageMarkerEditor
              imageUrl={coverUrl}
              points={points}
              // ✅ read-only: ei lisäystä, vain avaus
              onAddPoint={() => {}}
              onOpenPoint={(id: string) => setOpenPointId(id)}
            />
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
              Ei kuvaa.
            </div>
          )}
        </div>

        <PointModal
          open={!!openPointId}
          onClose={() => setOpenPointId(null)}
          title={openPoint?.label || ""}
          note={openPoint?.note || ""}
          // ✅ read-only: ei tallennusta eikä uploadia
          onSave={async () => {}}
          onUploadImage={async () => {}}
          images={openImgs.map((im) => ({ id: im.id, url: im._signedUrl || null }))}
          readOnly
        />
      </div>
    </main>
  );
}

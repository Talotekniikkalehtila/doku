"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ImageMarkerEditor } from "@/components/ImageMarkerEditor";
import { PointModal } from "@/components/PointModal";
import {
  createPoint,
  getOwnerReport,
  requireUserId,
  signedUrl,
  updatePoint,
  uploadCover,
  uploadPointImage,
} from "@/lib/reportApi";

/** ========== SHARE (DB + RLS, ei Edgeä) ========== */

function makeSlug(len = 14) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

type ShareRow = {
  id: string;
  slug: string;
  report_id: string;
  expires_at: string | null;
  created_at: string;
  password_hash?: string | null;
};

async function shareGetDB(reportId: string): Promise<ShareRow | null> {
  const { data, error } = await supabase
    .from("share_links")
    .select("id, slug, report_id, expires_at, created_at, password_hash")
    .eq("report_id", reportId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as any) ?? null;
}

async function shareEnsureDB(reportId: string): Promise<ShareRow> {
  const existing = await shareGetDB(reportId);
  if (existing) return existing;

  const slug = makeSlug();
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user?.id;
  if (!uid) throw new Error("Et ole kirjautunut sisään.");

  const { data, error } = await supabase
    .from("share_links")
    .insert({ report_id: reportId, slug, created_by: uid })
    .select("id, slug, report_id, expires_at, created_at, password_hash")
    .single();

  if (error) {
    // slug collision retry (harvinaista)
    if (String(error.message).toLowerCase().includes("duplicate")) {
      const slug2 = makeSlug();
      const { data: d2, error: e2 } = await supabase
        .from("share_links")
        .insert({ report_id: reportId, slug: slug2, created_by: uid })
        .select("id, slug, report_id, expires_at, created_at, password_hash")
        .single();
      if (e2) throw new Error(e2.message);
      return d2 as any;
    }
    throw new Error(error.message);
  }

  return data as any;
}

type RpcShareSetPasswordRow = {
  slug: string;
  has_password: boolean;
};

export default function ReportEditPage() {
  const params = useParams<{ id: string }>();
  const reportId = params.id;

  const [ownerId, setOwnerId] = useState<string | null>(null);

  const [report, setReport] = useState<any>(null);
  const [points, setPoints] = useState<any[]>([]);
  const [pointImages, setPointImages] = useState<any[]>([]);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // Share (slug + password)
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [shareMsg, setShareMsg] = useState("");

  // Point modal
  const [openPointId, setOpenPointId] = useState<string | null>(null);

  const openPoint = useMemo(
    () => points.find((p) => p.id === openPointId) || null,
    [points, openPointId]
  );
  const openImgs = useMemo(
    () => pointImages.filter((im) => im.point_id === openPointId),
    [pointImages, openPointId]
  );

  async function refreshShare() {
    try {
      setShareMsg("Päivitetään…");
      const row = await shareEnsureDB(reportId);

      setShareSlug(row.slug);
      setHasPassword(!!row.password_hash);

      setShareMsg("Jakolinkki valmis.");
    } catch (e: any) {
      console.error("refreshShare FAIL:", e);
      setShareMsg("Virhe: " + (e?.message || "tuntematon"));
    }
  }

  async function saveSharePassword() {
    setShareMsg("");

    // Tyhjä = poisto (käytännöllinen)
    if (!passInput.trim()) {
      await removeSharePassword();
      return;
    }

    try {
      const { data, error } = await supabase.rpc("share_set_password", {
        p_report_id: reportId,
        p_password: passInput.trim(),
      });

      if (error) throw new Error(error.message);

      const row = (Array.isArray(data) ? data[0] : data) as RpcShareSetPasswordRow;
      setShareSlug(row.slug);
      setHasPassword(!!row.has_password);
      setPassInput("");
      setShareMsg("Tallennettu.");

      // varmistetaan että myös password_hash-tila pysyy synkassa
      await refreshShare();
    } catch (e: any) {
      console.error("saveSharePassword FAIL:", e);
      setShareMsg("Virhe: " + (e?.message || "tuntematon"));
    }
  }

  async function removeSharePassword() {
    setShareMsg("");
    try {
      const { data, error } = await supabase.rpc("share_set_password", {
        p_report_id: reportId,
        p_password: "",
      });

      if (error) throw new Error(error.message);

      const row = (Array.isArray(data) ? data[0] : data) as RpcShareSetPasswordRow;
      setShareSlug(row.slug);
      setHasPassword(!!row.has_password);
      setPassInput("");
      setShareMsg("Salasana poistettu.");

      await refreshShare();
    } catch (e: any) {
      console.error("removeSharePassword FAIL:", e);
      setShareMsg("Virhe: " + (e?.message || "tuntematon"));
    }
  }

  async function refresh() {
    const uid = await requireUserId();
    setOwnerId(uid);

    const data = await getOwnerReport(reportId);

    setReport(data.report);
    setPoints(data.points);

    // Cover signed URL
    if (data.report.cover_image_path) {
      const url = await signedUrl(data.report.cover_image_path);
      setCoverUrl(url);
    } else {
      setCoverUrl(null);
    }

    // Signed URLs for point images
    const withUrls = await Promise.all(
      (data.point_images ?? []).map(async (im: any) => {
        const url = await signedUrl(im.image_path);
        return { ...im, _signedUrl: url };
      })
    );
    setPointImages(withUrls);
  }

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session?.user?.id) {
        window.location.href = "/login";
        return;
      }

      await refresh();
      await refreshShare();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  async function onUploadCover(file: File) {
    if (!ownerId) return;
    await uploadCover(ownerId, reportId, file);
    await refresh();
  }

  async function onAddPoint(x: number, y: number) {
    await createPoint(reportId, x, y);
    await refresh();
  }

  async function onSavePoint(next: { title: string; note: string }) {
    if (!openPointId) return;
    await updatePoint(openPointId, { label: next.title, note: next.note });
    setOpenPointId(null);
    await refresh();
  }

  async function onUploadPointImage(file: File) {
    if (!ownerId || !openPointId) return;
    await uploadPointImage(ownerId, reportId, openPointId, file);
    await refresh();
  }

  const shareLink =
    shareSlug && typeof window !== "undefined"
      ? `${window.location.origin}/share/${shareSlug}`
      : "";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl p-4 grid gap-4">
        {/* Top bar */}
<div className="flex items-center justify-between gap-2">
  <button
    onClick={() => (window.location.href = "/")}
    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
    type="button"
  >
    ← Takaisin
  </button>

  <div className="text-sm font-medium text-slate-900">
    {report?.title || "Raportti"}
  </div>

  <button
    onClick={() => (window.location.href = "/archive")}
    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
    type="button"
  >
    Arkisto →
  </button>
</div>

        {/* Cover + markers */}
        <div className="rounded-2xl border border-slate-300 bg-white p-4 grid gap-3">
  <div className="flex flex-wrap items-start justify-between gap-2">
    <div>
      <div className="text-sm font-semibold text-slate-900">Pääkuva</div>
      <div className="text-xs text-slate-700">
        Lisää kuva ja merkitse huomiot punaisilla pisteillä.
      </div>
    </div>

    <div className="flex flex-wrap gap-2">
      {/* 📸 Ota kuva (kamera) */}
      <label className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
        📸 Ota kuva
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) await onUploadCover(f);
            e.currentTarget.value = "";
          }}
        />
      </label>

      {/* 🖼️ Valitse galleriasta */}
      <label className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50">
        🖼️ Valitse galleriasta
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) await onUploadCover(f);
            e.currentTarget.value = "";
          }}
        />
      </label>
    </div>
  </div>

          {coverUrl ? (
            <ImageMarkerEditor
              imageUrl={coverUrl}
              points={points}
              onAddPoint={onAddPoint}
              onOpenPoint={(id) => setOpenPointId(id)}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-700">
  Lisää ensin pääkuva.
</div>
          )}
        </div>

        {/* Share box */}
        <div className="rounded-2xl border bg-white p-4 grid gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Jaa raportti</div>
              <div className="text-xs text-slate-900">
                Luo jakolinkki ja aseta salasana (valinnainen).
              </div>
            </div>
            <button
              onClick={refreshShare}
              className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-slate-100"
              type="button"
            >
              Päivitä
            </button>
          </div>

          {shareSlug ? (
            <div className="grid gap-2">
              <div className="text-xs text-slate-700">Linkki</div>
              <div className="flex gap-2">
                <input
  readOnly
  value={shareLink}
  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
 />
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareLink);
                    setShareMsg("Linkki kopioitu.");
                  }}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Kopioi
                </button>
              </div>

              <div className="mt-2 grid gap-2">
                <div className="text-xs text-slate-700">
                  Salasana: {hasPassword ? "✅ asetettu" : "— ei käytössä"}
                </div>

                <div className="flex flex-wrap gap-2">
                  <input
  type="password"
  placeholder="Uusi salasana (tyhjä = poisto)"
  value={passInput}
  onChange={(e) => setPassInput(e.target.value)}
  className="flex-1 min-w-[220px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-600"
 />

                  <button
                    type="button"
                    onClick={saveSharePassword}
                    className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Aseta / Päivitä
                  </button>

                  <button
                    type="button"
                    onClick={removeSharePassword}
                    className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-100"
                  >
                    Poista salasana
                  </button>

                  <button
                    type="button"
                    onClick={() => window.open(`/share/${shareSlug}`, "_blank")}
                    className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-100"
                  >
                    Testaa avaus →
                  </button>
                </div>

                {shareMsg ? <div className="text-sm text-slate-700">{shareMsg}</div> : null}
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-700">
              Luo jakolinkki painamalla “Päivitä”.
            </div>
          )}
        </div>

        {/* Point modal */}
        <PointModal
          open={!!openPointId}
          onClose={() => setOpenPointId(null)}
          title={openPoint?.label || ""}
          note={openPoint?.note || ""}
          onSave={onSavePoint}
          onUploadImage={onUploadPointImage}
          images={openImgs.map((im) => ({ id: im.id, url: im._signedUrl || null }))}
        />
      </div>
    </main>
  );
}

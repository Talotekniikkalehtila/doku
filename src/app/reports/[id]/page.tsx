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
import {
  ArrowLeft,
  Archive,
  Copy,
  Camera,
  Image as ImageIcon,
  Share2,
  KeyRound,
  RefreshCcw,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

/** ====== BRAND THEME (sama kuin etusivu) ====== */
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
  // Fullscreen image modal
const [openImage, setOpenImage] = useState<string | null>(null);

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

    if (data.report.cover_image_path) {
      const url = await signedUrl(data.report.cover_image_path);
      setCoverUrl(url);
    } else {
      setCoverUrl(null);
    }

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
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Sama bränditausta + animaatio kuin etusivulla */}
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

      <div className="relative mx-auto max-w-3xl px-4 pb-24 pt-7 grid gap-4">
        {/* Top bar – glass */}
        <div className={glassCardClass} style={glassCardStyle}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => (window.location.href = "/")}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-white/60 backdrop-blur-xl transition active:scale-[0.99]"
              style={{ background: hexToRgba("#ffffff", 0.88) }}
              type="button"
            >
              <ArrowLeft size={18} />
              Takaisin
            </button>

            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-600">Raportti</div>
              <div className="mt-1 text-lg font-semibold text-slate-900 truncate">
                {report?.title || "Raportti"}
              </div>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                <ShieldCheck size={14} />
                Muokkaustila
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BRAND }} />
              </div>
            </div>

            <button
              onClick={() => (window.location.href = "/archive")}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-white/60 backdrop-blur-xl transition active:scale-[0.99]"
              style={{ background: hexToRgba("#ffffff", 0.88) }}
              type="button"
            >
              Arkisto
              <Archive size={18} />
            </button>
          </div>
        </div>

        {/* Cover + markers – glass */}
        <div className={glassCardClass} style={glassCardStyle}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Pääkuva</div>
              <div className="text-xs text-slate-700">
                Lisää kuva ja merkitse huomiot pisteillä.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <label
                className="cursor-pointer inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99]"
                style={{
                  background: `linear-gradient(135deg, ${BRAND}, ${hexToRgba(BRAND, 0.92)})`,
                }}
              >
                <Camera size={18} />
                Ota kuva
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
              <button
  type="button"
  disabled={!coverUrl}
  onClick={() => coverUrl && setOpenImage(coverUrl)}
  className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-white/60 backdrop-blur-xl transition active:scale-[0.99] disabled:opacity-50"
  style={{ background: hexToRgba("#ffffff", 0.88) }}
>
  <ExternalLink size={16} className="text-slate-500" />
  Avaa kokonäyttöön
</button>

              <label
                className="cursor-pointer inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-white/60 backdrop-blur-xl transition active:scale-[0.99]"
                style={{ background: hexToRgba("#ffffff", 0.88) }}
              >
                <ImageIcon size={18} className="text-slate-500" />
                Valitse galleriasta
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

          <div className="mt-4">
            {coverUrl ? (
              <ImageMarkerEditor
                imageUrl={coverUrl}
                points={points}
                onAddPoint={onAddPoint}
                onOpenPoint={(id) => setOpenPointId(id)}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-700 bg-white/70">
                Lisää ensin pääkuva.
              </div>
            )}
          </div>
        </div>

        {/* Share box – glass */}
        <div className={glassCardClass} style={glassCardStyle}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Share2 size={16} style={{ color: BRAND }} />
                Jaa raportti
              </div>
              <div className="text-xs text-slate-700">
                Luo jakolinkki ja aseta salasana (valinnainen).
              </div>
            </div>

            <button
              onClick={refreshShare}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-white/60 backdrop-blur-xl transition active:scale-[0.99]"
              style={{ background: hexToRgba("#ffffff", 0.88) }}
              type="button"
            >
              <RefreshCcw size={16} className="text-slate-500" />
              Päivitä
            </button>
          </div>

          <div className="mt-4">
            {shareSlug ? (
              <div className="grid gap-3">
                <div className="text-xs text-slate-700">Linkki</div>

                <div className="flex flex-wrap gap-2">
                  <input
                    readOnly
                    value={shareLink}
                    className="flex-1 min-w-[260px] rounded-2xl border border-white/70 bg-white/80 px-4 py-2 text-sm text-slate-900 outline-none"
                  />

                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(shareLink);
                      setShareMsg("Linkki kopioitu.");
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99]"
                    style={{
                      background: `linear-gradient(135deg, ${BRAND}, ${hexToRgba(BRAND, 0.92)})`,
                    }}
                  >
                    <Copy size={16} />
                    Kopioi
                  </button>

                  <button
                    type="button"
                    onClick={() => window.open(`/share/${shareSlug}`, "_blank")}
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-white/60 backdrop-blur-xl transition active:scale-[0.99]"
                    style={{ background: hexToRgba("#ffffff", 0.88) }}
                  >
                    <ExternalLink size={16} className="text-slate-500" />
                    Testaa avaus
                  </button>
                </div>

                <div className="mt-1 text-xs text-slate-700">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium">
                    <KeyRound size={14} />
                    Salasana: {hasPassword ? "✅ asetettu" : "— ei käytössä"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <input
                    type="password"
                    placeholder="Uusi salasana (tyhjä = poisto)"
                    value={passInput}
                    onChange={(e) => setPassInput(e.target.value)}
                    className="flex-1 min-w-[240px] rounded-2xl border border-white/70 bg-white/80 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-600 outline-none"
                  />

                  <button
                    type="button"
                    onClick={saveSharePassword}
                    className="rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99]"
                    style={{
                      background: `linear-gradient(135deg, ${BRAND}, ${hexToRgba(BRAND, 0.92)})`,
                    }}
                  >
                    Aseta / Päivitä
                  </button>

                  <button
                    type="button"
                    onClick={removeSharePassword}
                    className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-white/60 backdrop-blur-xl transition active:scale-[0.99]"
                    style={{ background: hexToRgba("#ffffff", 0.88) }}
                  >
                    Poista salasana
                  </button>
                </div>

                {shareMsg ? <div className="text-sm text-slate-700">{shareMsg}</div> : null}
              </div>
            ) : (
              <div className="text-sm text-slate-700">
                Luo jakolinkki painamalla “Päivitä”.
              </div>
            )}
          </div>
        </div>

        {/* Point modal */}
        <PointModal
          open={!!openPointId}
          onClose={() => setOpenPointId(null)}
          title={openPoint?.label || ""}
          note={openPoint?.note || ""}
          onSave={onSavePoint}
          onUploadImage={onUploadPointImage}
          onOpenImage={(url) => setOpenImage(url)}
          images={openImgs.map((im) => ({ id: im.id, url: im._signedUrl || null }))}
        />
      </div>

      {openImage && <ImageModal src={openImage} onClose={() => setOpenImage(null)} />}
    </main>
  );
} // ✅ tämä sulkee ReportEditPage-komponentin

function ImageModal({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] max-w-[92vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 rounded-full bg-white/10 px-4 py-2 text-white text-sm font-semibold hover:bg-white/20"
          type="button"
        >
          ✕ Sulje
        </button>
        <img
          src={src}
          alt=""
          className="max-h-[92vh] max-w-[92vw] rounded-2xl object-contain"
        />
      </div>
    </div>
  );
}


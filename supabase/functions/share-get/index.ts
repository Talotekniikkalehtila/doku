// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { slug, sessionToken } = await req.json();
    if (!slug) return json({ error: "Missing slug" }, 400);
    if (!sessionToken) return json({ error: "Missing sessionToken" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: share, error: e0 } = await admin
      .from("report_shares")
      .select("id, report_id")
      .eq("slug", slug)
      .single();

    if (e0 || !share) return json({ error: "Not found" }, 404);

    const tokenHash = await sha256(sessionToken);

    const { data: sess, error: eS } = await admin
      .from("report_share_sessions")
      .select("id, expires_at")
      .eq("share_id", share.id)
      .eq("token_hash", tokenHash)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (eS || !sess) return json({ error: "Unauthorized" }, 401);
    if (new Date(sess.expires_at).getTime() < Date.now()) return json({ error: "Session expired" }, 401);

    // Fetch report + points + point images
    const { data: report, error: eR } = await admin
      .from("reports")
      .select("id,title,status,cover_image_path,created_at")
      .eq("id", share.report_id)
      .single();

    if (eR || !report) return json({ error: "Report not found" }, 404);

    const { data: points } = await admin
      .from("report_points")
      .select("id,x,y,label,note,created_at,updated_at")
      .eq("report_id", report.id)
      .order("created_at", { ascending: true });

    const pointIds = (points ?? []).map(p => p.id);
    const { data: imgs } = pointIds.length
      ? await admin.from("report_point_images").select("id,point_id,image_path,created_at").in("point_id", pointIds)
      : { data: [] as any[] };

    // Signed URLs
    const bucket = "report-images";

    let coverUrl: string | null = null;
    if (report.cover_image_path) {
      const { data } = await admin.storage.from(bucket).createSignedUrl(report.cover_image_path, 60 * 30);
      coverUrl = data?.signedUrl ?? null;
    }

    const imagesWithUrls = await Promise.all((imgs ?? []).map(async (im) => {
      const { data } = await admin.storage.from(bucket).createSignedUrl(im.image_path, 60 * 30);
      return { ...im, signed_url: data?.signedUrl ?? null };
    }));

    return json({
      report: { ...report, cover_signed_url: coverUrl },
      points: points ?? [],
      point_images: imagesWithUrls,
    });
  } catch (err: any) {
    return json({ error: err?.message ?? "Unknown error" }, 500);
  }
});

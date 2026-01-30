// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

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

function slugifyToken(len = 10) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("=", "")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .slice(0, 14);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
   
const altHeader = req.headers.get("x-supabase-auth") || req.headers.get("X-Supabase-Auth") || "";
    const { reportId, password } = await req.json();
    if (!reportId) return json({ error: "Missing reportId" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Accept Bearer token from Authorization OR x-supabase-auth
const bearer = authHeader.toLowerCase().startsWith("bearer ")
  ? authHeader
  : (altHeader.toLowerCase().startsWith("bearer ") ? altHeader : "");

if (!bearer) return json({ error: "Missing auth" }, 401);

const userJwt = bearer.slice(7); // removes "Bearer "
    const { data: u, error: eu } = await admin.auth.getUser(userJwt);
if (eu || !u?.user?.id) return json({ error: "Invalid auth" }, 401);
const uid = u.user.id;

    // Verify ownership
    const { data: rpt, error: er } = await admin
      .from("reports")
      .select("id, owner_id")
      .eq("id", reportId)
      .single();

    if (er || !rpt) return json({ error: "Report not found" }, 404);
    if (rpt.owner_id !== uid) return json({ error: "Forbidden" }, 403);

    // Ensure share row exists
    let { data: share } = await admin
      .from("report_shares")
      .select("id, slug, password_hash")
      .eq("report_id", reportId)
      .maybeSingle();

    if (!share) {
      // Create unique slug
      let slug = slugifyToken();
      for (let i = 0; i < 5; i++) {
        const { data: exists } = await admin.from("report_shares").select("id").eq("slug", slug).maybeSingle();
        if (!exists) break;
        slug = slugifyToken();
      }

      const { data: created, error: ec } = await admin
        .from("report_shares")
        .insert({ report_id: reportId, slug })
        .select("id, slug, password_hash")
        .single();

      if (ec) return json({ error: ec.message }, 500);
      share = created;
    }

    // Update password hash
    if (typeof password === "string") {
      if (password.trim().length === 0) {
        // remove password
        const { data: up, error: ep } = await admin
          .from("report_shares")
          .update({ password_hash: null })
          .eq("id", share.id)
          .select("id, slug, password_hash")
          .single();
        if (ep) return json({ error: ep.message }, 500);
        return json({ slug: up.slug, hasPassword: !!up.password_hash });
      } else {
        const hash = await bcrypt.hash(password, 10);
        const { data: up, error: ep } = await admin
          .from("report_shares")
          .update({ password_hash: hash })
          .eq("id", share.id)
          .select("id, slug, password_hash")
          .single();
        if (ep) return json({ error: ep.message }, 500);
        return json({ slug: up.slug, hasPassword: !!up.password_hash });
      }
    }

    // Return current state (no change)
    return json({ slug: share.slug, hasPassword: !!share.password_hash });
  } catch (err: any) {
    return json({ error: err?.message ?? "Unknown error" }, 500);
  }
});

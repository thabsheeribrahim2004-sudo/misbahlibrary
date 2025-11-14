// Deno Deploy / Supabase Edge Function: bootstrap-admin
// Grants admin role to the calling user ONLY if no admins exist yet.
// This is a safe bootstrap path for first-time setup.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Json = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client bound to the caller's JWT for auth context
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get("Authorization") ?? "" },
      },
    });

    // Service role client to bypass RLS for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Count how many admins already exist
    const { count, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if (countError) {
      console.error("Count admins error", countError);
      return new Response(JSON.stringify({ error: "Failed to check admins" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if ((count ?? 0) > 0) {
      // If admins exist, do not allow self-bootstrap
      return new Response(
        JSON.stringify({ error: "Admins already exist. Ask an admin to grant you access." }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Grant admin role to the caller
    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: user.id, role: "admin" });

    if (insertError) {
      // Ignore duplicate unique constraint (already admin)
      const msg = String(insertError.message || "");
      if (!msg.toLowerCase().includes("duplicate")) {
        console.error("Insert admin error", insertError);
        return new Response(JSON.stringify({ error: "Failed to grant admin" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, role: "admin" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("bootstrap-admin unexpected error", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

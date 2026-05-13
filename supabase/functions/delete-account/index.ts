import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const userEmail = String(userData.user.email || "").trim().toLowerCase();
    const userPhone = String(userData.user.phone || "").replace(/\D/g, "");
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const linkedUserIds = new Set<string>([userId]);
    if (userEmail || userPhone) {
      let profilesQuery = admin.from("profiles").select("id, email, phone");
      if (userEmail && userPhone) {
        profilesQuery = profilesQuery.or(`email.ilike.${userEmail},phone.ilike.%${userPhone.slice(-10)}`);
      } else if (userEmail) {
        profilesQuery = profilesQuery.ilike("email", userEmail);
      } else if (userPhone) {
        profilesQuery = profilesQuery.ilike("phone", `%${userPhone.slice(-10)}`);
      }
      const { data: linkedProfiles } = await profilesQuery;
      for (const profile of linkedProfiles || []) {
        if (profile?.id) linkedUserIds.add(profile.id);
      }
    }

    const linkedIds = Array.from(linkedUserIds);
    const bharatOrderIds = new Set<string>();
    const { data: bharatOrders } = await admin
      .from("payment_orders")
      .select("id")
      .eq("module", "bharat_gaurav")
      .in("user_id", linkedIds);
    for (const order of bharatOrders || []) {
      if (order?.id) bharatOrderIds.add(order.id);
    }
    if (userEmail) {
      const { data: emailOrders } = await admin
        .from("payment_orders")
        .select("id")
        .eq("module", "bharat_gaurav")
        .or(`metadata->>customer_email.eq.${userEmail},metadata->>email.eq.${userEmail}`);
      for (const order of emailOrders || []) {
        if (order?.id) bharatOrderIds.add(order.id);
      }
    }

    // Deep wipe Bharat Gaurav state first, including records linked by old UID/email metadata.
    await admin.from("bharat_gaurav_memberships").delete().in("user_id", linkedIds);
    if (bharatOrderIds.size > 0) {
      await admin.from("bharat_gaurav_memberships").delete().in("payment_order_id", Array.from(bharatOrderIds));
      await admin.from("payment_orders").delete().in("id", Array.from(bharatOrderIds));
    }
    await admin.from("payment_orders").delete().eq("module", "bharat_gaurav").in("user_id", linkedIds);

    // Best-effort delete user data from app tables
    const tables = [
      "payment_orders",
      "merchant_profiles",
      "matrimony_profiles",
      "kyc_verifications",
      "blood_donors",
      "blood_donations",
      "blood_requests",
      "classifieds",
      "jobs",
      "job_applications",
      "complaints",
      "saved_shops",
      "shop_ratings",
      "service_providers",
      "family_members",
      "last_known_locations",
      "user_roles",
      "profiles",
    ];
    for (const id of linkedIds) {
      for (const t of tables) {
        try {
          await admin.from(t).delete().eq("user_id", id);
        } catch (_) { /* ignore */ }
      }
      try { await admin.from("profiles").delete().eq("id", id); } catch (_) {}
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ADMIN_PIN = "02032026";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-pin",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const pin = req.headers.get("x-admin-pin") || "";
  if (pin !== ADMIN_PIN) return json({ error: "unauthorized" }, 401);

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let body: any = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const action: string = body.action || "overview";

  try {
    switch (action) {
      case "overview": {
        const now = new Date();
        const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const [users, premium, merchants, premiumMerchants, payToday, payMonth, kyc, complaints] = await Promise.all([
          sb.from("profiles").select("id", { count: "exact", head: true }),
          sb.from("bharat_gaurav_memberships").select("id", { count: "exact", head: true }).eq("status", "active"),
          sb.from("merchant_profiles").select("id", { count: "exact", head: true }),
          sb.from("merchant_profiles").select("id", { count: "exact", head: true }).eq("is_premium", true),
          sb.from("payment_orders").select("amount").eq("status", "paid").gte("updated_at", startDay),
          sb.from("payment_orders").select("amount").eq("status", "paid").gte("updated_at", startMonth),
          sb.from("kyc_verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
          sb.from("complaints").select("id", { count: "exact", head: true }).eq("status", "pending"),
        ]);
        const sum = (r: any) => (r.data || []).reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
        return json({
          users: users.count || 0,
          premium: premium.count || 0,
          merchants: merchants.count || 0,
          premiumMerchants: premiumMerchants.count || 0,
          freeMerchants: (merchants.count || 0) - (premiumMerchants.count || 0),
          todayEarn: sum(payToday),
          monthEarn: sum(payMonth),
          kyc: kyc.count || 0,
          complaints: complaints.count || 0,
        });
      }
      case "users": {
        const { data } = await sb.from("profiles").select("*").order("created_at", { ascending: false }).limit(1000);
        return json({ rows: data || [] });
      }
      case "merchants": {
        const { data } = await sb.from("merchant_profiles").select("*").order("created_at", { ascending: false }).limit(1000);
        return json({ rows: data || [] });
      }
      case "matrimony": {
        const { data } = await sb.from("matrimony_profiles").select("*").order("created_at", { ascending: false }).limit(1000);
        return json({ rows: data || [] });
      }
      case "subscriptions": {
        const [bg, mp, mat] = await Promise.all([
          sb.from("bharat_gaurav_memberships").select("*").order("created_at", { ascending: false }),
          sb.from("merchant_profiles").select("user_id,shop_name,premium_plan,premium_start_date,plan_ends_at,is_premium,created_at").eq("is_premium", true).order("created_at", { ascending: false }),
          sb.from("matrimony_profiles").select("user_id,name,subscription_plan,subscription_start,subscription_end,created_at").not("subscription_plan", "is", null).order("created_at", { ascending: false }),
        ]);
        return json({ bg: bg.data || [], mp: mp.data || [], mat: mat.data || [] });
      }
      case "kyc": {
        const filter = body.filter || "pending";
        let q = sb.from("kyc_verifications").select("*").order("created_at", { ascending: false }).limit(500);
        if (filter !== "all") q = q.eq("status", filter);
        const { data } = await q;
        return json({ rows: data || [] });
      }
      case "complaints": {
        const { data } = await sb.from("complaints").select("*").order("created_at", { ascending: false }).limit(500);
        return json({ rows: data || [] });
      }
      case "audit": {
        const filter = body.filter || "all";
        let q = sb.from("payment_orders").select("*").order("created_at", { ascending: false }).limit(500);
        if (filter !== "all") q = q.eq("status", filter);
        const { data } = await q;
        return json({ rows: data || [] });
      }
      case "analytics": {
        const since = new Date(); since.setDate(since.getDate() - 30);
        const [users, payments, merchants, members] = await Promise.all([
          sb.from("profiles").select("created_at").gte("created_at", since.toISOString()),
          sb.from("payment_orders").select("amount,created_at,status").eq("status", "paid").gte("created_at", since.toISOString()),
          sb.from("merchant_profiles").select("is_premium"),
          sb.from("bharat_gaurav_memberships").select("plan,status,amount"),
        ]);
        return json({
          users: users.data || [], payments: payments.data || [],
          merchants: merchants.data || [], members: members.data || [],
        });
      }
      case "update": {
        // body: { table, id, patch }
        const { table, id, patch } = body;
        const allowed = ["merchant_profiles", "matrimony_profiles", "kyc_verifications", "complaints"];
        if (!allowed.includes(table)) return json({ error: "table not allowed" }, 400);
        const { error } = await sb.from(table).update(patch).eq("id", id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }
      default:
        return json({ error: "unknown action" }, 400);
    }
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
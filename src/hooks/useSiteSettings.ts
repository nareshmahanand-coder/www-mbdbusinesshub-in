import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  id: string;
  maintenance_mode: boolean;
  merchant_registrations_enabled: boolean;
  razorpay_key_reference: string | null;
  ai_key_reference: string | null;
  merchant_area_label: string;
  admin_area_label: string;
  admin_security_updated_at: string | null;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: "",
  maintenance_mode: false,
  merchant_registrations_enabled: true,
  razorpay_key_reference: "",
  ai_key_reference: "",
  merchant_area_label: "Merchant Dashboard",
  admin_area_label: "Admin Portal",
  admin_security_updated_at: null,
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("site_settings")
      .select("id, maintenance_mode, merchant_registrations_enabled, razorpay_key_reference, ai_key_reference, merchant_area_label, admin_area_label, admin_security_updated_at")
      .limit(1)
      .maybeSingle();

    setSettings(data ? { ...DEFAULT_SITE_SETTINGS, ...data } : DEFAULT_SITE_SETTINGS);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  return { settings, loading, refresh };
};

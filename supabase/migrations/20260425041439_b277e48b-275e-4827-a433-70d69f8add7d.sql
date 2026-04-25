-- Add moderation fields for existing marketplace modules
ALTER TABLE public.classifieds
ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved';

ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved';

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved';

-- Job applications for Admin Portal inspection
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  applicant_user_id uuid NOT NULL,
  applicant_name text NOT NULL DEFAULT '',
  applicant_phone text DEFAULT '',
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage job applications" ON public.job_applications;
CREATE POLICY "Admins can manage job applications"
ON public.job_applications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can manage own job applications" ON public.job_applications;
CREATE POLICY "Users can manage own job applications"
ON public.job_applications
FOR ALL
TO authenticated
USING (auth.uid() = applicant_user_id)
WITH CHECK (auth.uid() = applicant_user_id);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_user_id ON public.job_applications(applicant_user_id);

DROP TRIGGER IF EXISTS update_job_applications_updated_at ON public.job_applications;
CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Skill development admissions for Admin Portal inspection
CREATE TABLE IF NOT EXISTS public.skill_admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  student_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  city text DEFAULT '',
  course_name text NOT NULL DEFAULT '',
  course_category text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.skill_admissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage skill admissions" ON public.skill_admissions;
CREATE POLICY "Admins can manage skill admissions"
ON public.skill_admissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can manage own skill admissions" ON public.skill_admissions;
CREATE POLICY "Users can manage own skill admissions"
ON public.skill_admissions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_skill_admissions_user_id ON public.skill_admissions(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_admissions_status ON public.skill_admissions(status);

DROP TRIGGER IF EXISTS update_skill_admissions_updated_at ON public.skill_admissions;
CREATE TRIGGER update_skill_admissions_updated_at
BEFORE UPDATE ON public.skill_admissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Admin policies for live inspection and quality controls across existing modules
DROP POLICY IF EXISTS "Admins can manage classifieds" ON public.classifieds;
CREATE POLICY "Admins can manage classifieds"
ON public.classifieds
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage jobs" ON public.jobs;
CREATE POLICY "Admins can manage jobs"
ON public.jobs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view family members" ON public.family_members;
CREATE POLICY "Admins can view family members"
ON public.family_members
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view last known locations" ON public.last_known_locations;
CREATE POLICY "Admins can view last known locations"
ON public.last_known_locations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage contact requests" ON public.contact_requests;
CREATE POLICY "Admins can manage contact requests"
ON public.contact_requests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
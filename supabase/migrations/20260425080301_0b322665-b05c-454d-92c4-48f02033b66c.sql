ALTER TABLE public.memberships
ADD CONSTRAINT memberships_transaction_id_unique UNIQUE (transaction_id);
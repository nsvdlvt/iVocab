-- Migration: Consolidate E-Team role into Member role
-- Policy & Safety guarantees:
-- 1. Does NOT delete any user accounts or user learning data.
-- 2. Does NOT drop the `role` column or destructively alter `public.user_role_enum`.
-- 3. Never elevates any account to `'admin'`.
-- 4. Moves existing `'e_team'` accounts strictly to `'member'` so they access the unified `/u/...` experience.
-- 5. Leaves all Admin RLS policies (`public.is_admin()` / `role = 'admin'`) untouched and strictly enforced.

BEGIN;

UPDATE public.profiles
SET role = 'member'
WHERE role = 'e_team';

COMMIT;

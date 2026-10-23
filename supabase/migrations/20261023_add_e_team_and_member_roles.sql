-- Migration: Add 'e_team' and 'member' roles to user_role_enum
-- Safely alters the existing enum without disrupting existing 'user' or 'admin' rows

ALTER TYPE public.user_role_enum ADD VALUE IF NOT EXISTS 'e_team';
ALTER TYPE public.user_role_enum ADD VALUE IF NOT EXISTS 'member';

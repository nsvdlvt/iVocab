-- Create an enum for user roles
CREATE TYPE public.user_role_enum AS ENUM ('user', 'admin');

-- Add the role column to the profiles table
ALTER TABLE public.profiles
ADD COLUMN role public.user_role_enum NOT NULL DEFAULT 'user';

-- Create an index for faster role queries
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('DIRETOR', 'GERENTE');

-- Create user_roles table to store admin roles linked to auth.users
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    nome text NOT NULL,
    cidades text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is authenticated admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- Create function to get user cities
CREATE OR REPLACE FUNCTION public.get_user_cities(_user_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(cidades, '{}'::text[])
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Directors can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'DIRETOR'));

CREATE POLICY "Directors can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'DIRETOR'));

CREATE POLICY "Directors can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'DIRETOR'));

CREATE POLICY "Directors can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'DIRETOR'));

-- Drop old RLS policies on consultores
DROP POLICY IF EXISTS "Consultores são públicos para leitura" ON public.consultores;
DROP POLICY IF EXISTS "Qualquer um pode atualizar consultores" ON public.consultores;
DROP POLICY IF EXISTS "Qualquer um pode deletar consultores" ON public.consultores;
DROP POLICY IF EXISTS "Qualquer um pode inserir consultores" ON public.consultores;

-- New RLS policies for consultores - only authenticated admins
CREATE POLICY "Admins can view consultores"
ON public.consultores
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert consultores"
ON public.consultores
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update consultores"
ON public.consultores
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete consultores"
ON public.consultores
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Drop old RLS policies on indicacoes
DROP POLICY IF EXISTS "Indicações são públicas para leitura" ON public.indicacoes;
DROP POLICY IF EXISTS "Qualquer um pode criar indicação" ON public.indicacoes;
DROP POLICY IF EXISTS "Qualquer um pode atualizar indicações" ON public.indicacoes;
DROP POLICY IF EXISTS "Qualquer um pode deletar indicações" ON public.indicacoes;

-- New RLS policies for indicacoes
-- Allow public INSERT for the referral form (anonymous users can create indicacoes)
CREATE POLICY "Anyone can create indicacoes"
ON public.indicacoes
FOR INSERT
WITH CHECK (true);

-- Only authenticated admins can view/update/delete
CREATE POLICY "Admins can view indicacoes"
ON public.indicacoes
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update indicacoes"
ON public.indicacoes
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete indicacoes"
ON public.indicacoes
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Drop old RLS policies on administradores (we'll deprecate this table)
DROP POLICY IF EXISTS "Administradores são públicos para leitura" ON public.administradores;
DROP POLICY IF EXISTS "Qualquer um pode atualizar administradores" ON public.administradores;
DROP POLICY IF EXISTS "Qualquer um pode deletar administradores" ON public.administradores;
DROP POLICY IF EXISTS "Qualquer um pode inserir administradores" ON public.administradores;

-- Restrict administradores table - only directors can access (during migration period)
CREATE POLICY "Directors can view administradores"
ON public.administradores
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'DIRETOR'));

CREATE POLICY "Directors can manage administradores"
ON public.administradores
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'DIRETOR'));
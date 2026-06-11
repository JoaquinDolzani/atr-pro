
-- Allow any authenticated user (athletes) to discover who is the coach
CREATE POLICY "authenticated read coach roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (role = 'coach'::app_role);

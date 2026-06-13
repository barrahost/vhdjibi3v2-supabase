-- Ajoute la colonne last_login_at (date de derniere connexion).
-- Ecrite par AuthContext.login() a chaque connexion reussie (best-effort cote app),
-- et lue dans le profil utilisateur ("Derniere connexion").
-- Permet a terme de detecter les utilisateurs decroches cote admin.

ALTER TABLE public.users  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

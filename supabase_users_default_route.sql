-- Page d'accueil par defaut d'un utilisateur (redirection a la connexion).
-- NULL = tableau de bord (comportement standard).
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_route TEXT;

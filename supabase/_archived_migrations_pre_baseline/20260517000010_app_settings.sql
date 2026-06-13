-- Table de configuration globale de l'application
CREATE TABLE IF NOT EXISTS public.app_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT now(),
  updated_by  TEXT
);

-- Valeurs par défaut
INSERT INTO public.app_settings (key, value) VALUES
  ('general', '{
    "churchName": "Vases d''Honneur Assemblée Grâce Confondante",
    "timezone": "Africa/Abidjan",
    "maintenanceMode": false
  }'::jsonb),
  ('sms', '{
    "username": "vhdjibi3",
    "senderId": "",
    "smsCostXOF": 24,
    "lowCreditThreshold": 10
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

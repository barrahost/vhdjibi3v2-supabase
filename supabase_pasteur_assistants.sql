-- Attribution des portefeuilles Pasteur Assistant (organigramme du 02/08/2026)

UPDATE users SET business_profiles = business_profiles || '[{"type": "pasteur_assistant", "isActive": true, "departmentIds": ["FB2hOsWDKJ2QF8cWUgqW", "fOOSUOaPf4gA1GPWgX2A", "QpFTn6behEIrHByDMCPP", "4C6evegTQnMrMniwRr4R", "eWlO4EB3KD06lkGzIo90", "GXTy4cvbJgZS9Gh8fH1I", "lAdLXujrJNKr8PDy5DEH", "miWhd3VovHSiwKF3TLIK", "Zo8ooJJkqewuwIQPS7kd", "x3y3uiYTigvXbikv3UId"]}]'::jsonb, updated_at = now()
WHERE church_id = 'bergerie' AND full_name = 'PA RACHELLE SEZAN'
  AND NOT business_profiles @> '[{"type": "pasteur_assistant"}]'::jsonb;

UPDATE users SET business_profiles = business_profiles || '[{"type": "pasteur_assistant", "isActive": true, "departmentIds": ["cGwiiJPKeHfQ9xlKUIrO", "nQt1xiyCKOgIBvEsddTB", "xtsas4Cy5GGLFVSkG4Dc", "PGFdBwPotZZFEPQvpLsU", "ARZ3Rl6K3ykdPE71W3CD", "L4MTtLfPAHFmqdDQ3xQ8", "39e882b3-14c6-4f9d-ab7b-b56e72345363", "pWBzYN3XwzeeOrWhuGIe", "M4F26BLIV5AoxcvTW3CF"]}]'::jsonb, updated_at = now()
WHERE church_id = 'bergerie' AND full_name = 'AP TANO PATRICE'
  AND NOT business_profiles @> '[{"type": "pasteur_assistant"}]'::jsonb;

UPDATE users SET business_profiles = business_profiles || '[{"type": "pasteur_assistant", "isActive": true, "departmentIds": ["a927e0b6-3df9-4564-903a-39b3940bc0e1", "9TOZo9Ba2W2vU4NLTugd", "EfvLsuysWDXZtPL8LEzF", "43RfvwVIY8INqang0vKp", "heA3uQW7BJBzmRcnfH3n", "hk9iz8aMWPvWTtrCBhHU", "1HLcIsnqCzOzG2iwdHyM"]}]'::jsonb, updated_at = now()
WHERE church_id = 'bergerie' AND full_name = 'AP SERY CHRISTIAN'
  AND NOT business_profiles @> '[{"type": "pasteur_assistant"}]'::jsonb;

# Consignes pour Claude — Bergerie

Application web de gestion d'église (React + Vite + TypeScript, Supabase, Cloudflare Pages).

## Dossier de travail local du propriétaire

Les sessions Claude Code sur le web tournent dans le cloud : elles n'ont pas accès à l'ordinateur du propriétaire.
Son dossier de travail de référence est `C:\Bergerie` (sur Mac : `~/Bergerie`) :

| Dossier | Contenu |
| --- | --- |
| `1-code\` | copie locale du dépôt GitHub (`1-code\vhdjibi3v2-supabase`) |
| `2-presentations\` | présentations (PowerPoint, PDF) |
| `3-captures\` | captures d'écran |
| `4-sql\` | scripts SQL exécutés dans Supabase, nommés `AAAA-MM-JJ_nom.sql`, avec un journal `LISEZMOI.txt` |
| `5-documents-sources\` | documents d'origine (guide du Centre Kodesh, etc.) |

Quand Claude livre des fichiers au propriétaire :

- indiquer pour chacun son dossier de destination (ex. « à placer dans `C:\Bergerie\2-presentations\` ») ;
- utiliser ces chemins dans les commandes et les consignes (ex. `git clone` dans `C:\Bergerie\1-code\`) ;
- pour plusieurs fichiers, fournir un ZIP dont le dossier racine est `Bergerie\`, à décompresser dans `C:\` ;
- nommer les fichiers sans accent ni espace (ex. `Cultes_brief_controle_debrief.pptx`) et garder des chemins courts ;
- ne pas placer `1-code` dans OneDrive, Dropbox ou Google Drive ;
- tout fichier du dossier local que Claude doit lire doit être joint à la conversation.

## Déploiement

- La production est la branche `migration-supabase` : Cloudflare Pages redéploie le site à chaque commit poussé dessus.
- Claude n'a pas d'identifiants Supabase : les scripts SQL (`supabase_*.sql` à la racine) sont exécutés par le propriétaire dans le SQL Editor de Supabase.

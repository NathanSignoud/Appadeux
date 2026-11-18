---
name: deploiement
description: Builder et déployer l'app Nous sur Cloudflare Workers (static assets), appliquer les changements Supabase, et vérifier que la PWA s'installe sur iOS et Android. À utiliser avant chaque mise en ligne ou en cas de souci de déploiement.
---

# Déploiement

## Déploiement normal

Un `git push` sur `main` suffit : Cloudflare (Workers Builds) récupère le code, lance `npm run build` puis `npx wrangler deploy`.

Avant de pousser :
1. `npm run build` passe sans erreur en local.
2. Les migrations SQL sont appliquées : `npx supabase db push --remote` (Cloudflare ne touche pas à Supabase).
3. Les Edge Functions modifiées sont déployées : `npx supabase functions deploy <nom> --use-api`.
4. `npm run preview` : vérifier l'app servie depuis `dist/`.

## Réglages Cloudflare (déjà faits une fois)

- Workers & Pages → le Worker `appadeux` → Settings → Build :
  - dépôt GitHub connecté, branche `main` ;
  - build command : `npm run build` ; deploy command : `npx wrangler deploy` ;
  - **Variables** : aucune à configurer. `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` (publiques) sont dans `.env.production`, versionné.
    Cloudflare refuse les variables d'exécution sur un Worker 100 % statique, et Vite les lit au build de toute façon.
- Fallback SPA : `assets.not_found_handling = "single-page-application"` dans `wrangler.jsonc`.
- Supabase → Authentication → URL Configuration : mettre l'URL du site dans *Site URL*.

## Vérifier la PWA

- Chrome desktop → DevTools → Application → Manifest : pas d'erreur, icônes présentes ; Service Workers : actif.
- **Android (Chrome)** : menu ⋮ → « Installer l'application ».
- **iOS (Safari uniquement)** : bouton Partager → « Sur l'écran d'accueil ». Vérifier l'icône, le nom « Nous », l'ouverture plein écran sans barre Safari.
- Recharger une route profonde (ex. `/calendrier`) : elle doit s'afficher, pas une 404.
- Après un déploiement, la PWA installée se met à jour seule au lancement suivant (`registerType: 'autoUpdate'`).

## En cas de problème

- Page blanche en production : vérifier `.env.production` (noms exacts, préfixe `VITE_`) puis les logs de build Cloudflare.
- Connexion impossible : vérifier *Site URL* et que l'URL Supabase correspond au bon projet.
- Vieille version affichée : fermer complètement la PWA et la rouvrir (le service worker se met à jour).

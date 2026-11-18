---
name: nouvelle-fonctionnalite
description: Checklist complète pour ajouter une fonctionnalité à l'app Nous, de la migration SQL jusqu'au test sur mobile et à la mise à jour du CLAUDE.md. À suivre pour chaque nouvelle feature ou écran qui touche des données.
---

# Ajouter une fonctionnalité

Cocher chaque étape dans l'ordre. Ne pas sauter la RLS ni le test mobile.

1. **Cadrer** : relire la section concernée de `PROMPT.MD`. Si une décision n'est pas tranchée, demander à l'utilisateur.
2. **Migration SQL** : suivre la skill `migration-supabase` (tables, index, contraintes).
3. **Politiques RLS** : une politique par opération (select/insert/update/delete), basée sur `my_couple_id()`. Secret = filtre `auth.uid()` en plus.
4. **Realtime** : si l'autre doit voir les changements en direct, ajouter la table à `supabase_realtime`.
5. **Appliquer et générer les types** :
   ```bash
   npx supabase db push
   npx supabase gen types typescript --linked > src/lib/database.types.ts
   ```
6. **Hooks de données** dans `src/features/<nom>/hooks.ts` :
   - lecture via `supabase.from(...)` typée par `Tables<'x'>` ;
   - abonnement Realtime (`supabase.channel(...).on('postgres_changes', ...)`) avec désabonnement au démontage ;
   - écriture : mise à jour optimiste seulement si l'erreur est gérée (on revient en arrière + message).
7. **UI** dans `src/features/<nom>/` : respecter la direction visuelle du `CLAUDE.md`, textes en français, états vide / chargement / erreur prévus, zones tactiles d'au moins 44 px.
8. **Route** dans `src/App.tsx` (et dans la barre d'onglets ou la page Plus si besoin).
9. **Vérifier** : `npm run build` sans erreur, puis test manuel sur mobile (`npm run dev -- --host`, ouvrir l'IP locale sur le téléphone), avec **deux comptes** pour vérifier le temps réel et l'isolement des données.
10. **CLAUDE.md** : mettre à jour le schéma, l'arborescence et les décisions prises.
11. **Commit** en français, un commit par étape cohérente.

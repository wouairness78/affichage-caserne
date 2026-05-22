# Affichage dynamique CIS Saint-Arnoult-en-Yvelines

## Hébergement gratuit conseillé
- Netlify : hébergement du site
- Supabase : base de données + authentification admin + stockage photos

## Fichiers
- `index.html` : affichage TV
- `admin.html` : interface admin
- `style.css` : design commun
- `app.js` : écran TV
- `admin.js` : panneau admin
- `supabase-config.js` : à compléter avec tes clés Supabase
- `schema-supabase.sql` : tables à créer dans Supabase

## Étapes rapides
1. Créer un projet Supabase.
2. Dans Supabase > SQL Editor, coller le contenu de `schema-supabase.sql` puis exécuter.
3. Dans Supabase > Authentication, créer ton utilisateur admin avec email + mot de passe.
4. Dans `supabase-config.js`, remplacer :
   - `TON_URL_SUPABASE`
   - `TA_CLE_ANON_SUPABASE`
5. Déposer le dossier sur Netlify.
6. TV : ouvrir `index.html`.
7. Admin : ouvrir `admin.html`.

## Important
Le bloc Twitter/X est prévu en saisie manuelle pour commencer, car X bloque souvent l'accès direct gratuit aux derniers posts.

# 🏛️ Registre Numérique des Cotisations du Village

Application web et mobile (PWA) conçue pour moderniser et remplacer les cahiers papier de suivi des cotisations mensuelles du village.

---

## ✨ Fonctionnalités Principales

- **👤 Fiche unique par membre** : Génération automatique d'un numéro matricule unique (`MBR-0001`), distinction des homonymes grâce au numéro de téléphone et quartier.
- **💰 Enregistrement instantané des versements** : Saisie rapide en quelques secondes avec mode de paiement (Espèces, Wave, Orange Money, etc.) et contrôle anti-doublon pour le même mois.
- **📱 Partage direct du reçu officiel par WhatsApp** : Utilisation de la *Web Share API* et du lien direct WhatsApp avec un texte soigné et horodaté faisant foi juridique et communautaire.
- **📊 Tableau de bord mensuel & Annuel** : Indicateurs en temps réel (taux de recouvrement, montant collecté, membres à jour vs en retard, statistiques par quartier).
- **🔔 Rappel WhatsApp en 1 clic** : Envoi de messages de courtoisie pré-remplis pour les membres en retard de cotisation.
- **📥 Exports professionnels** :
  - Classeurs Excel (`.xlsx`) détaillés pour les membres et le journal des écritures comptables.
  - Rapports PDF prêts pour impression lors des Assemblées Générales et réunions de bureau.
- **🛡️ Gestion des rôles et contrôle d'accès** :
  - **Administrateur** : Gestion complète des membres, versements et comptes utilisateurs/rôles.
  - **Trésorier** : Ajout de membres, encaissements et partage des reçus.
  - **Membre du bureau** : Consultation en lecture seule (pas de modification ou suppression possible).
- **📲 Installation sur smartphone (PWA)** : S'installe en 1 clic sur l'écran d'accueil sans passer par le Play Store ou l'App Store.

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Lancement en mode développement
```bash
npm run dev
```
Ouvrez votre navigateur sur `http://localhost:3000`.

> **Note :** L'application intègre un **Mode Démo & Local** actif par défaut. Vous pouvez tester toutes les fonctionnalités immédiatement sans configuration préalable !

---

## 🗄️ Connexion à la Base de Données Supabase (Optionnel pour mise en production)

1. Créez un projet gratuit sur [Supabase](https://supabase.com).
2. Rendez-vous dans le **SQL Editor** de votre console Supabase.
3. Copiez et exécutez le script SQL fourni dans [supabase/schema.sql](./supabase/schema.sql).
4. Créez un fichier `.env.local` à la racine du projet :
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon-publique-supabase
NEXT_PUBLIC_DEFAULT_COTISATION_AMOUNT=2000
NEXT_PUBLIC_CURRENCY=FCFA
NEXT_PUBLIC_VILLAGE_NAME="Association du Village"
```
5. Redémarrez le serveur `npm run dev`. Vos données seront désormais synchronisées et sauvegardées en temps réel sur le cloud !

---

## 🌐 Déploiement sur Vercel en 1 Clic

1. Poussez votre code sur GitHub :
```bash
git init
git add .
git commit -m "Initial commit - Registre cotisations village"
git branch -M main
git remote add origin https://github.com/votre-compte/gestion-cotisation.git
git push -u origin main
```
2. Importez le dépôt sur [Vercel](https://vercel.com).
3. Renseignez les variables d'environnement dans les paramètres Vercel si vous utilisez Supabase.
4. Cliquez sur **Deploy** !

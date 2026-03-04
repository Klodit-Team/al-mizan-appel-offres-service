# Phase 1 : Modélisation des Données (Prisma Schema) 🗄️

L'objectif de cette phase est de traduire le diagramme approfondi de la base de données (`ao_db`) en schémas physiques via Prisma. Contrairement à TypeORM, Prisma centralise toute la structure dans un seul fichier : `prisma/schema.prisma`.

## 🎯 Ce que tu dois accomplir :

### 1. Définition du Schéma Prisma

Toute la structure a été centralisée dans `prisma/schema.prisma`.
Ce fichier contient :

- Les **Enums** (`StatutAO`, `TypeProcedure`, `TypeAvis`, etc.)
- Les **Modèles** (`AppelOffres`, `Lot`, `CritereEligibilite`, etc.) avec leurs relations typées.

### 2. Synchronisation avec PostgreSQL

Maintenant que le schéma est prêt, tu dois le pousser vers la base de données.

1. Assure-toi que Docker est lancé : `docker-compose up -d`
2. Lance la commande de synchronisation :
   ```bash
   npx prisma db push
   ```
   _Cette commande crée les tables dans PostgreSQL sans avoir besoin de fichiers .entity.ts._

### 3. Génération du Client Prisma

Une fois la base de données synchronisée, génère le client TypeScript :

```bash
npx prisma generate
```

_Cela crée un client typé dans ton dossier node_modules que tu utiliseras dans tes services._

### 4. Utilisation du PrismaService

Un service a été créé dans `src/prisma/prisma.service.ts`.
Pour utiliser la base de données dans un autre service (ex: `AppelOffresService`), tu n'auras qu'à l'injecter :

```typescript
constructor(private prisma: PrismaService) {}

// Exemple d'utilisation :
// this.prisma.appelOffres.findMany()
```

## ✅ Critère de validation :

Tape `npx prisma studio`. Cela va ouvrir une interface web sur `http://localhost:5555`. Tu dois y voir toutes tes tables (`appel_offres`, `lot`, `avis_ao`, etc.) prêtes à recevoir des données !

# 📑 Rapport d'erreurs : Migration Prisma

Ce document résume l'état actuel de la migration vers Prisma et les obstacles techniques rencontrés lors de l'initialisation du schéma.

---

## 🏗️ État de la migration

| Composant | Statut | Détails |
|-----------|--------|---------|
| Dépendances | ✅ OK | `prisma` et `@prisma/client` installés. |
| Modélisation | ✅ OK | `prisma/schema.prisma` contient les 9 modèles métier. |
| Intégration NestJS | ✅ OK | `PrismaModule` et `PrismaService` créés et importés. |
| Infrastructure | ✅ OK | Docker PostgreSQL est lancé et "Healthy". |
| **Synchronisation BDD**| ❌ **KO** | `npx prisma db push` échoue. |

---

## 🚨 Détails du problème technique

Le problème principal survient lors de l'exécution des commandes Prisma CLI (`db push`, `generate`, `validate`).

### Symptôme
Prisma ne parvient pas à valider l'URL de connexion à la base de données, même lorsqu'elle est correctement définie.

### Message d'erreur type
```text
Prisma schema loaded from prisma\schema.prisma
  |>  prisma\schema.prisma:3 
3 |   url      = env("DATABASE_URL")
Validation Error Count: 1     
[Context: getConfig]
```

### Observations
1. **Fichier .env** : La variable `DATABASE_URL` est présente sous la forme `postgresql://ao_user:secret@localhost:5432/ao_db?schema=public`. 
2. **Accessibilité** : Un test via Node.js (`require('dotenv').config()`) confirme que la variable est lisible par le système.
3. **Engine Prisma** : Les logs ont montré des échecs intermittents lors du téléchargement des "Prisma engines" (fichiers `.exe.sha256`), ce qui pourrait indiquer un binaire corrompu ou un problème de réseau/droits d'écriture lors de l'installation des outils Prisma sur Windows.

---

## 🛠️ Pistes de résolution pour toi

Si tu souhaites régler cela seul, voici les étapes recommandées :

1. **Vérifier l'encodage du fichier `.env`** : Assure-toi qu'il est en `UTF-8` (sans BOM). Parfois, les caractères invisibles empêchent Prisma de lire la variable.
2. **Réinstaller les binaires Prisma** : 
   ```bash
   rm -rf node_modules/.prisma node_modules/@prisma
   npm install
   npx prisma generate
   ```
3. **Tester avec un `.env` simplifié** : Supprimer tous les commentaires et ne laisser que la ligne `DATABASE_URL`.
4. **Proxy/Pare-feu** : Si les "engines" n'ont pas fini de se télécharger correctement, Prisma CLI restera instable. Assure-toi que la commande `npx prisma version` affiche bien les chemins des "Query Engine".

---

> [!NOTE]
> Tout le code (Module, Service, Schéma complet) est déjà écrit et prêt. Une fois que la commande `npx prisma db push` passera sur ta machine, l'application sera prête pour la Phase 2.

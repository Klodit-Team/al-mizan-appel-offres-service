# 🗺️ Logique de Conception Globale du Microservice Appels d'Offres

Ce document explique **pourquoi** nous avons structuré le développement en 6 phases distinctes et **comment** elles s'imbriquent logiquement pour construire un microservice robuste, sans jamais être bloqués par des dépendances circulaires.

---

## 🏗️ L'approche par "Couches Oignon" (Onion Architecture)

Plutôt que de développer une fonctionnalité de A à Z (ex: "Bouton Créer un AO sur le frontend jusqu'au RabbitMQ"), on développe le projet par **couches successives de dépendances**. On commence par ce qui n'a besoin de rien d'autre, et on construit par-dessus.

### 🗄️ Phase 1 : La Fondation (Modélisation de la Base de Données)

**L'idée :** Aucune logique métier ne peut exister sans un modèle de données strict.
**L'outil :** `Prisma` + `PostgreSQL`.
_Pourquoi en premier ?_ Parce que le fichier `schema.prisma` devient notre **SSOT** (Single Source of Truth - Source de Vérité Unique). Dès que la BDD existe, Prisma nous génère les types TypeScript parfaits. On est sûrs de ne jamais se tromper de colonne par la suite.

### 🏗️ Phase 2 : Le Cœur Métier (CRUD sur l'Entité Racine)

**L'idée :** L'entité `AppelOffres` est le "Parent" abstrait de tout le reste.
**L'outil :** `NestJS` (Modules, Services, Controllers) + `PrismaClient`.
_Pourquoi en deuxième ?_ Un _Lot_ n'a pas de sens sans _Appel d'Offres_. Un _Fichier_ n'a pas de sens sans _Appel d'Offres_. Il faut donc absolument pouvoir créer, lire, modifier et changer le statut d'un **Appel d'Offres vide** avant d'aller plus loin. C'est l'ossature de l'application.

### 🧩 Phase 3 : Les Sous-Ressources (Lots et Critères)

**L'idée :** On habille l'ossature. Un AO a N Lots, et N Critères.
**L'outil :** Relations SQL (`OneToMany`).
_Pourquoi en troisième ?_ Maintenant que la table abstraite AO existe, on doit lier les tables enfants de la base de données. On va construire les URLs RESTful typiques comme : `POST /appels-offres/{id}/lots`. On peuple sémantiquement notre marché public.

### 📁 Phase 4 : Les Fichiers Physiques (GED via MinIO)

**L'idée :** Un AO est prêt, les lots sont définis, il faut maintenant y attacher le Cahier des Charges (CDC) en PDF.
**L'outil :** `AWS-S3 SDK` branché sur MinIO.
_Pourquoi en quatrième ?_ Gérer des fichiers est asynchrone et coûteux en ressources. On ne le fait que lorsque toutes les vérifications primaires (l'AO existe, son statut permet l'upload) sont garanties par les Phases 2 et 3.

### 📡 Phase 5 : La Communication (Asynchrone via RabbitMQ)

**L'idée :** Le microservice AO n'est pas tout seul. Il doit dire au monde qu'il a travaillé.
**L'outil :** `RabbitMQ`.
_Pourquoi en cinquième ?_ C'est la phase de désolidarisation. Plutôt que d'appeler directement le module de Notification pour dire "Hé, j'ai publié un AO", on envoie un message dans un tuyau : "Un AO est publié, voilà son ID". C'est l'ultime étape d'une action parfaitement réussie en interne.

### 🛡️ Phase 6 : Tolérance Zéro (Workflows Experts, IA & Sécurité RBAC)

**L'idée :** Bloquer l'API aux personnes non autorisées et gérer les cas légaux extrêmes.
**L'outil :** `Guards NestJS`, Mocks d'IA (Gre-à-Gre).
_Pourquoi en dernier ?_ Si on mettait la sécurité dès la Phase 2, on perdrait un temps fou à générer des tokens JWT valides juste pour tester un endpoint avec Postman. On construit la maison, on teste que les portes marchent, puis **à la fin**, on met les serrures et les caméras de sécurité.

---

## 🔄 En Résumé : Le Flux d'Exécution d'une Requête Typique :

Quand le frontend (React/Angular) appelle `/api/v1/appels-offres` :

1. **Phase 6 (Guards)** : Est-ce qu'on a le bon rôle (`SERVICE_CONTRACTANT`) ?
2. **Phase 2 (DTO)** : Le JSON envoyé a-t-il la bonne forme (ex: `montant > 0`) ?
3. **Phase 2 (Controller)** : Transmet la demande au `AppelOffresService`.
4. **Phase 2/3 (Service/Prisma)** : Vérifie dans la BDD (Phase 1) si l'ID existe, met à jour le statut, lie les sous-ressources.
5. **Phase 4 (S3)** : Si on avait envoyé un fichier, on le met sur MinIO.
6. **Phase 5 (RabbitMQ)** : L'action est confirmée dans la BDD, on émet le message `ao.created` au reste du Système d'Information KLODIT.

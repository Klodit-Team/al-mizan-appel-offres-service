# 🏛️ Al-Mizan — Microservice Appels d'Offres

> **Plateforme Intelligente et Souveraine de Gestion des Marchés Publics**
> Équipe KLODIT · ENS Informatique · 4ème année CS SIL · 2025–2026

---

## 📑 Table des Matières

1. [Présentation du Projet](#1-présentation-du-projet)
2. [Processus Métiers Complets](#2-processus-métiers-complets)
3. [Contenu du Microservice Appels d'Offres](#3-contenu-du-microservice-appels-doffres)
   - [Backlog Fonctionnel](#31-backlog-fonctionnel--15-user-stories)
   - [Schéma de Base de Données](#32-schéma-de-base-de-données-ao_db)
   - [Endpoints API REST](#33-endpoints-api-rest)
   - [Événements RabbitMQ](#34-événements-rabbitmq)
   - [Sécurité Spécifique](#35-sécurité-spécifique)
4. [Stack Technologique](#4-stack-technologique)
5. [Architecture du Microservice](#5-architecture-du-microservice)
6. [Acteurs du Système](#6-acteurs-du-système)
7. [Matrice de Conformité Réglementaire](#7-matrice-de-conformité-réglementaire)

---

## 1. Présentation du Projet

**Al-Mizan** est une **Plateforme Intelligente et Souveraine de Gestion des Marchés Publics** en Algérie, développée par l'équipe KLODIT (11 membres). Elle vise à digitaliser intégralement le cycle de vie des marchés publics conformément à la **Loi n°23-12** et à la **Loi n°18-07** (protection des données personnelles).

### Problèmes résolus

| Problème | Solution Al-Mizan |
|----------|------------------|
| 🔴 Opacité des processus papier | Journalisation inaltérable SHA-256 + Portail transparence public |
| 🔴 Lenteur administrative | Workflow digitalisé bout-en-bout, automatisation |
| 🔴 Risques de fraude (collusion, saucissonnage) | IA détection d'anomalies (taux cible ≥ 85%) |
| 🔴 Absence de traçabilité | Logs chaînés append-only (SHA-256) |
| 🔴 Non-conformité numérique | Infrastructure 100% souveraine (On-Premise ou Cloud Algérien) |

### Architecture Globale — 10 Microservices + 5 Services IA

| Service | Port | Base de Données | Responsabilité |
|---------|------|-----------------|----------------|
| Auth Service | 8001 | auth_db | Authentification, sessions, MFA |
| User Service | 8002 | user_db | Profils, RBAC, vérification identité |
| **Appel d'Offres Service** | **8003** | **ao_db** | **Création, publication, cycle de vie AO** |
| Soumission Service | 8004 | soumission_db | Dépôt E2EE, horodatage, intégrité |
| Document Service | 8005 | document_db | Fichiers, pièces admin, OCR pipeline |
| Evaluation Service | 8006 | eval_db | Notation, calcul scores, grilles |
| Commission Service | 8007 | commission_db | Commissions, PV d'ouverture |
| Recours Service | 8008 | recours_db | Dépôt et traitement des recours |
| Audit Service | 8009 | audit_db | Logs append-only, SHA-256 chaîné |
| Notification Service | 8010 | notif_db | Emails, SMS, push Android |

---

## 2. Processus Métiers Complets

Le système couvre **7 processus métiers** correspondant au cycle de vie complet d'un marché public.

---

### 🟢 Processus 1 — Expression du Besoin & Création de l'Appel d'Offres

| Étape | Acteur | Action |
|-------|--------|--------|
| 1.1 | Service Contractant (SC) | Crée un AO (référence, objet, type, montant estimé, dates limites) |
| 1.2 | SC | Découpe l'AO en **lots** |
| 1.3 | SC + IA GenAI | Rédige le **Cahier des Charges (CDC)** assisté par IA |
| 1.4 | SC | Définit les **critères d'éligibilité** (conditions éliminatoires) |
| 1.5 | SC | Définit les **critères d'évaluation** technique et financier |

---

### 🟡 Processus 2 — Publication & Diffusion

| Étape | Acteur | Action |
|-------|--------|--------|
| 2.1 | SC / Système | Génère l'**avis réglementaire** conforme (BOMOP + presse nationale) |
| 2.2 | Système | Publie sur le **portail public** (accès sans inscription préalable) |
| 2.3 | Système | Contrôle automatique du respect du **délai minimum** |
| 2.4 | OE (Public) | Consulter les AO publiés et télécharge le CDC |

---

### 🟠 Processus 3 — Soumission Électronique Sécurisée

| Étape | Acteur | Action |
|-------|--------|--------|
| 3.1 | Opérateur Économique (OE) | Crée une soumission en brouillon pour un AO / lot |
| 3.2 | OE | Upload l'offre **technique** (hash SHA-256 d'intégrité) |
| 3.3 | OE (navigateur) | Chiffre l'offre **financière** E2EE (AES-256-GCM + RSA-4096 clé publique Commission) |
| 3.4 | OE | Signe numériquement avec **ECDSA P-384** |
| 3.5 | OE | Attache la **caution bancaire** et les pièces administratives |
| 3.6 | Système | **Fermeture automatique** à la seconde près à la date/heure limite |

---

### 🔴 Processus 4 — Ouverture des Plis & Évaluation

| Étape | Acteur | Action |
|-------|--------|--------|
| 4.1 | SC | Programme la **séance d'ouverture** (date, lieu, caractère public/privé) |
| 4.2 | Commission COPE | Vérifie le **quorum** des membres présents |
| 4.3 | N membres Commission | Fournissent leurs **fragments de clé** (Shamir Secret Sharing K-of-N) |
| 4.4 | Système | Reconstitue la clé et **déchiffre les offres financières** |
| 4.5 | Commission | Génère le **PV d'ouverture** horodaté automatiquement |
| 4.6 | IA OCR/NLP | Vérifie automatiquement la **conformité administrative** des dossiers |
| 4.7 | Évaluateurs | Notent chaque critère par soumission (**évaluation en aveugle**) |
| 4.8 | IA Évaluation | Suggère des notes avec **score de confiance** |
| 4.9 | Système | Calcule les **scores pondérés** et le classement final |

---

### 🔵 Processus 5 — Attribution & Gestion des Recours

| Étape | Acteur | Action |
|-------|--------|--------|
| 5.1 | SC | Prononce l'**attribution provisoire** (soumission retenue) |
| 5.2 | Système | Notifie automatiquement **tous** les soumissionnaires |
| 5.3 | Système | Lance le **timer de recours** (10 jours légaux, Art. 83 Loi 23-12) |
| 5.4 | OE écarté | Dépose un **recours en ligne** dans le délai légal |
| 5.5 | Commission des Marchés | Examine et statue sur la recevabilité du recours |
| 5.6 | SC | Prononce l'**attribution définitive** (après expiration/clôture de recours) |
| 5.7 | SC | Crée la **fiche marché** (formalisation contractuelle) |

---

## 3. Contenu du Microservice Appels d'Offres

> **Service Appels d'Offres** · Port `8003` · Base de données `ao_db` (PostgreSQL)

### 3.1 Backlog Fonctionnel — 15 User Stories

| # | Fonctionnalité | Acteur | Priorité |
|---|---------------|--------|----------|
| 1 | **Créer un AO** (référence, objet, type, montant estimé, dates limites) | SC | 🔴 Haute |
| 2 | **Gérer les lots** (découpage AO en lots, numéro, désignation, montant estimé) | SC | 🔴 Haute |
| 3 | **Publier / retirer le CDC** (upload avec prix de retrait, accès OE) | SC | 🔴 Haute |
| 4 | **Définir les critères d'éligibilité** (CA min, expérience, certifications) | SC | 🔴 Haute |
| 5 | **Définir les critères d'évaluation** (technique + financier, pondération%) | SC | 🔴 Haute |
| 6 | **Publier un avis réglementaire** (AO, attribution prov./déf., annulation) | SC | 🔴 Haute |
| 7 | **Machine à états du cycle de vie** : `BROUILLON → PUBLIE → ... → ATTRIBUE` | SC / Système | 🔴 Haute |
| 8 | **Prononcer l'attribution provisoire** (lancer période recours) | SC | 🔴 Haute |
| 9 | **Prononcer l'attribution définitive** (après expiration recours) | SC | 🔴 Haute |
| 10 | **Créer la fiche marché** (formalisation contractuelle) | SC | 🟡 Moyenne |
| 11 | **Soumettre une demande gré-à-gré** (justifications + pièces obligatoires) | SC | 🟡 Moyenne |
| 12 | **Analyse IA d'une demande gré-à-gré** (score de conformité + recommandation) | Système / IA | 🟡 Moyenne |
| 13 | **Valider / rejeter une demande gré-à-gré** (comparaison recommandation IA) | Contrôleur | 🟡 Moyenne |
| 14 | **Consulter les AO publiés** (filtres : type, wilaya, secteur — pagination) | OE | 🔴 Haute |
| 15 | **Retirer le CDC** (téléchargement avec traçabilité + URL présignée) | OE | 🔴 Haute |

---

### 3.2 Schéma de Base de Données (`ao_db`)

Le service contient les tables PostgreSQL suivantes, générées via **Prisma** :
- `appel_offres` (table principale)
- `lot` (découpage)
- `critere_eligibilite` (éliminatoires)
- `critere_evaluation` (notes et pondérations)
- `document_cdc` (liens MinIO)
- `avis_ao` (publications BOMOP/Presse)
- `attribution` (provisoire/définitive)
- `marche` (contrat final)
- `demande_gre_a_gre` (procédure dérogatoire avec IA)
- `retrait_cdc` (traçabilité de qui a téléchargé quoi)

---

### 3.3 Endpoints API REST

```text
Base URL : /api/v1

── Appels d'Offres ──────────────────────────────────────────────────
POST    /appels-offres                       Créer un AO (SC)
GET     /appels-offres                       Lister AO publiés (public, filtres + cursor)
GET     /appels-offres/:id                   Détail d'un AO
PATCH   /appels-offres/:id/statut            Changer le statut (machine à états)

── Sous-Ressources (Lots, CDC, Critères, Avis...) ────────────────────
POST/GET/PATCH/DELETE /appels-offres/:id/lots
POST/GET/DELETE       /appels-offres/:id/cdc
POST/GET/DELETE       /appels-offres/:id/criteres-...
POST/GET/GET          /appels-offres/:id/avis
POST/GET              /appels-offres/:id/attribution
POST/GET              /appels-offres/:id/marche
```

---

### 3.4 Événements RabbitMQ

| Type | Exchange | Routing Key | Description |
|------|----------|-------------|-------------|
| **Émission** | `ao.events` | `ao.published` | Informe Notifications et Audit de la publication |
| **Émission** | `ao.events` | `ao.attribution.provisoire` | Déclenche le timer de recours |
| **Consomme** | `recours.events` | `recours.periode.expired` | Déverrouille l'attribution définitive |

---

## 4. Stack Technologique (Cible)

| Couche | Technologie | Commentaire |
|--------|------------|-------------|
| **Backend** | NestJS 10 (TypeScript) | API Modulaire |
| **Bases de données** | PostgreSQL 15 + **Prisma ORM** | Instance isolée `ao_db` via Prisma Client |
| **Cache** | Redis 7 + CacheManager | Performances et rate limiting |
| **Fichiers** | MinIO (Client S3) | Stockage AWS-S3 compatible |
| **Messaging** | RabbitMQ | Async events |
| **Document API**| Swagger | `/api/docs` auto-généré |
| **CI/CD** | Jenkins / GitHub Actions / Docker Multi-stage | Pipelines de build et test configurés, prêt pour K8s |

---

## 5. Architecture du Microservice

```
Client / API Gateway
       │
       ▼
┌─────────────────────────────────────────────────┐
│         Microservice AO (Port 8003)             │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │ Middleware (Input Validation + Auth)     │    │
│  └──────────────────┬──────────────────────┘    │
│  ┌──────────────────▼──────────────────────┐    │
│  │  Controllers (REST API — /api/v1/...)   │    │
│  └──────────────────┬──────────────────────┘    │
│  ┌──────────────────▼──────────────────────┐    │
│  │  Service Layer (Business Logic)         │    │
│  └──────┬──────────────────────────┬───────┘    │
│  ┌──────▼──────┐          ┌────────▼────────┐   │
│  │ PrismaClient│          │ Event Publisher │   │
│  │ (ORM Layer) │          │ (RabbitMQ)      │   │
│  └──────┬──────┘          └────────┬────────┘   │
└─────────┼──────────────────────────┼─────────────┘
          │                          │
    ┌─────▼─────┐             ┌──────▼──────┐
    │ PostgreSQL│             │  RabbitMQ   │
    │ (ao_db)   │             │  Exchange   │
    └───────────┘             └─────────────┘
```

---

## 6. Acteurs du Système

| Rôle | Permissions sur ce Service |
|------|---------------------------|
| `ADMIN` | Toutes les opérations, audit |
| `SERVICE_CONTRACTANT` | Créer/modifier/publier AO, gérer critères, prononcer attributions |
| `OPERATEUR_ECONOMIQUE` | Consulter AO, retirer CDC (traçabilité) |
| `CONTROLEUR` | Valider/rejeter demandes gré-à-gré |
| `PUBLIC` | Consulter AO publiés (lecture seule) |

---

## 7. 🚀 État d'Avancement Actuel

### Ce qui est en place (Configuration Initialisée) :
1. **Infrastructure Docker locale** (`docker-compose.yml`) avec PostgreSQL, Redis, MinIO et RabbitMQ.
2. **Pipelines CI/CD** (GitHub Actions et Jenkinsfile) configurés :
   - Tests automatisés (avec la balise `--passWithNoTests` prêt à inclure nos tests unitaires).
   - Validation ESLint/Prettier.
   - Build de sécurité Docker à travers `hadolint`.
3. **Connectivité des modules globaux** : API Rest, Cache Redis, ConfigModule pour le `.env`.
4. **Modélisation Base de Données (Phase 1 VALIDÉE)** :
   - Passage complet à **Prisma v6**.
   - Le fichier `schema.prisma` gère de façon centralisée les 9 modèles métier (`AppelOffres`, `Lot`, `CritereEligibilite`, etc.) et les énumérations.
   - La base de données contient **10 tables déployées avec succès** de façon automatisée en base `ao_db`.
   - `PrismaService` injecté globalement et prêt à être utilisé par tous nos futurs contrôleurs et services métier.

5. **Coeur Métier Appels d'Offres (Phase 2 VALIDÉE)** :
   - Structure du module générée (`Controller`, `Service`, `DTO`).
   - Protections anti-injections et validation de payload implémentées avec succès via `class-validator` et `@nestjs/swagger` dans les DTOs.
   - CRUD complet branché directement sur PostgreSQL via `PrismaClient` (création avec vérification, suppression logique, listage).
   - **Machine à États métier** : Un endpoint `PATCH /:id/statut` a été codé avec des règles strictes pour bloquer les transitions de statuts illégales (ex: interdire de passer de BROUILLON à ATTRIBUE). L'API renvoie des erreurs 400 intelligentes en cas d'abus.

6. **Sous-Ressources Lots & Critères (Phase 3 VALIDÉE)** :
   - Génération et configuration des 3 modules NestJS imbriqués : `LotsModule`, `CriteresEligibiliteModule`, `CriteresEvaluationModule`.
   - Enregistrement de tous les modules métier dans `AppModule` avec `PrismaModule` correctement injecté dans chacun.
   - **Gestion des Lots** : CRUD complet sur `POST/GET /appels-offres/:aoId/lots` avec règle métier — création bloquée si l'AO n'est pas au statut `BROUILLON` (409 Conflict), 404 si l'AO n'existe pas.
   - **Critères d'Éligibilité** : CRUD complet (`POST/GET/PATCH/DELETE /appels-offres/:aoId/criteres-eligibilite`) avec l'enum Prisma `TypeCritereEligibilite` (`CA_MIN`, `EXPERIENCE`, `CERTIFICATION`) typé dans le DTO et validé par `@IsEnum`.
   - **Critères d'Évaluation** : CRUD complet (`POST/GET/PATCH/DELETE /appels-offres/:aoId/criteres-evaluation`) avec l'enum Prisma `CategorieCritereEvaluation` (`TECHNIQUE`, `FINANCIER`) et validation du `poids` (Float, borné entre 0 et 100).
   - `GET /appels-offres/:id` retourne désormais l'AO **avec ses sous-ressources incluses** (`lots`, `criteresEligibilite`, `criteresEvaluation`), conformément au critère de validation Swagger de la phase.

### Prochaines étapes : Les 3 Phases restantes
Nous continuons le développement fonctionnel :
- **Phase 4** : Brancher notre SDK AWS-S3 sur l'`Upload / Download` de MinIO pour stocker le CDC.
- **Phase 5** : Publier dans l'event-bus `RabbitMQ` pour informer les autres microservices.
- **Phase 6** : Les Workflows complexes via IA, le Gré-à-Gré et l'intégration du RBAC (`@Roles(...)`).

### 📊 Suivi du Backlog Fonctionnel (15 User Stories)

| Fait | # | Fonctionnalité | Acteur | Priorité |
|:----:|---|---------------|--------|----------|
| ✅ | 1 | **Créer un AO** (référence, objet, type, montant estimé, dates limites) | SC | 🔴 Haute |
| ✅ | 2 | **Gérer les lots** (découpage AO en lots, numéro, désignation, montant estimé) | SC | 🔴 Haute |
| ⬜ | 3 | **Publier / retirer le CDC** (upload avec prix de retrait, accès OE) | SC | 🔴 Haute |
| ✅ | 4 | **Définir les critères d'éligibilité** (CA min, expérience, certifications) | SC | 🔴 Haute |
| ✅ | 5 | **Définir les critères d'évaluation** (technique + financier, pondération%) | SC | 🔴 Haute |
| ⬜ | 6 | **Publier un avis réglementaire** (AO, attribution prov./déf., annulation) | SC | 🔴 Haute |
| ✅ | 7 | **Machine à états du cycle de vie** : `BROUILLON → PUBLIE → ... → ATTRIBUE` | SC / Système | 🔴 Haute |
| ⬜ | 8 | **Prononcer l'attribution provisoire** (lancer période recours) | SC | 🔴 Haute |
| ⬜ | 9 | **Prononcer l'attribution définitive** (après expiration recours) | SC | 🔴 Haute |
| ⬜ | 10 | **Créer la fiche marché** (formalisation contractuelle) | SC | 🟡 Moyenne |
| ⬜ | 11 | **Soumettre une demande gré-à-gré** (justifications + pièces obligatoires) | SC | 🟡 Moyenne |
| ⬜ | 12 | **Analyse IA d'une demande gré-à-gré** (score de conformité + recommandation) | Système / IA | 🟡 Moyenne |
| ⬜ | 13 | **Valider / rejeter une demande gré-à-gré** (comparaison recommandation IA) | Contrôleur | 🟡 Moyenne |
| ✅ | 14 | **Consulter les AO publiés** (filtres : type, wilaya, secteur — pagination) | OE | 🔴 Haute |
| ⬜ | 15 | **Retirer le CDC** (téléchargement avec traçabilité + URL présignée) | OE | 🔴 Haute |

> **Progression : 6 / 15 User Stories livrées** (Phases 1, 2 & 3 complètes)

---
*Base issue du Cahier des Spécifications Logicielles (CSL) Al-Mizan v1.0, équipe KLODIT.*


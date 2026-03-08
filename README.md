# 🏛️ Al-Mizan — Microservice Appels d'Offres

> **Plateforme Intelligente et Souveraine de Gestion des Marchés Publics**
> Équipe KLODIT · ENS Informatique · 4ème année CS SIL · 2025–2026

---

## 📑 Table des Matières

1. [Présentation du Projet](#1-présentation-du-projet)
2. [Processus Métiers Complets](#2-processus-métiers-complets)
3. [Contenu du Microservice Appels d'Offres](#3-contenu-du-microservice-appels-doffres)
   - [3.1 Backlog Fonctionnel — 15 User Stories](#31-backlog-fonctionnel--15-user-stories)
   - [3.2 Schéma de Base de Données (`ao_db`)](#32-schéma-de-base-de-données-ao_db)
   - [3.3 Endpoints API REST](#33-endpoints-api-rest)
   - [3.4 Événements RabbitMQ](#34-événements-rabbitmq)
   - [3.5 Sécurité Spécifique](#35-sécurité-spécifique)
4. [Stack Technologique (Cible)](#4-stack-technologique-cible)
5. [Architecture du Microservice](#5-architecture-du-microservice)
6. [Acteurs du Système](#6-acteurs-du-système)
7. [Matrice de Conformité Réglementaire](#7-matrice-de-conformité-réglementaire)
8. [État d'Avancement Actuel](#8--état-davancement-actuel)

---

## 1. Présentation du Projet

**Al-Mizan** est une **Plateforme Intelligente et Souveraine de Gestion des Marchés Publics** en Algérie, développée par l'équipe KLODIT (11 membres). Elle vise à digitaliser intégralement le cycle de vie des marchés publics conformément à la **Loi n°23-12** et à la **Loi n°18-07** (protection des données personnelles).

### Problèmes résolus

| Problème                                        | Solution Al-Mizan                                                |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| 🔴 Opacité des processus papier                 | Journalisation inaltérable SHA-256 + Portail transparence public |
| 🔴 Lenteur administrative                       | Workflow digitalisé bout-en-bout, automatisation                 |
| 🔴 Risques de fraude (collusion, saucissonnage) | IA détection d'anomalies (taux cible ≥ 85%)                      |
| 🔴 Absence de traçabilité                       | Logs chaînés append-only (SHA-256)                               |
| 🔴 Non-conformité numérique                     | Infrastructure 100% souveraine (On-Premise ou Cloud Algérien)    |

### Architecture Globale — 10 Microservices + 5 Services IA

| Service                    | Port     | Base de Données | Responsabilité                             |
| -------------------------- | -------- | --------------- | ------------------------------------------ |
| Auth Service               | 8001     | auth_db         | Authentification, sessions, MFA            |
| User Service               | 8002     | user_db         | Profils, RBAC, vérification identité       |
| **Appel d'Offres Service** | **8003** | **ao_db**       | **Création, publication, cycle de vie AO** |
| Soumission Service         | 8004     | soumission_db   | Dépôt E2EE, horodatage, intégrité          |
| Document Service           | 8005     | document_db     | Fichiers, pièces admin, OCR pipeline       |
| Evaluation Service         | 8006     | eval_db         | Notation, calcul scores, grilles           |
| Commission Service         | 8007     | commission_db   | Commissions, PV d'ouverture                |
| Recours Service            | 8008     | recours_db      | Dépôt et traitement des recours            |
| Audit Service              | 8009     | audit_db        | Logs append-only, SHA-256 chaîné           |
| Notification Service       | 8010     | notif_db        | Emails, SMS, push Android                  |

---

## 2. Processus Métiers Complets

Le système couvre **7 processus métiers** correspondant au cycle de vie complet d'un marché public.

---

### 🟢 Processus 1 — Expression du Besoin & Création de l'Appel d'Offres

| Étape | Acteur                   | Action                                                             |
| ----- | ------------------------ | ------------------------------------------------------------------ |
| 1.1   | Service Contractant (SC) | Crée un AO (référence, objet, type, montant estimé, dates limites) |
| 1.2   | SC                       | Découpe l'AO en **lots**                                           |
| 1.3   | SC + IA GenAI            | Rédige le **Cahier des Charges (CDC)** assisté par IA              |
| 1.4   | SC                       | Définit les **critères d'éligibilité** (conditions éliminatoires)  |
| 1.5   | SC                       | Définit les **critères d'évaluation** technique et financier       |

---

### 🟡 Processus 2 — Publication & Diffusion

| Étape | Acteur       | Action                                                              |
| ----- | ------------ | ------------------------------------------------------------------- |
| 2.1   | SC / Système | Génère l'**avis réglementaire** conforme (BOMOP + presse nationale) |
| 2.2   | Système      | Publie sur le **portail public** (accès sans inscription préalable) |
| 2.3   | Système      | Contrôle automatique du respect du **délai minimum**                |
| 2.4   | OE (Public)  | Consulter les AO publiés et télécharge le CDC                       |

---

### 🟠 Processus 3 — Soumission Électronique Sécurisée

| Étape | Acteur                    | Action                                                                               |
| ----- | ------------------------- | ------------------------------------------------------------------------------------ |
| 3.1   | Opérateur Économique (OE) | Crée une soumission en brouillon pour un AO / lot                                    |
| 3.2   | OE                        | Upload l'offre **technique** (hash SHA-256 d'intégrité)                              |
| 3.3   | OE (navigateur)           | Chiffre l'offre **financière** E2EE (AES-256-GCM + RSA-4096 clé publique Commission) |
| 3.4   | OE                        | Signe numériquement avec **ECDSA P-384**                                             |
| 3.5   | OE                        | Attache la **caution bancaire** et les pièces administratives                        |
| 3.6   | Système                   | **Fermeture automatique** à la seconde près à la date/heure limite                   |

---

### 🔴 Processus 4 — Ouverture des Plis & Évaluation

| Étape | Acteur               | Action                                                                   |
| ----- | -------------------- | ------------------------------------------------------------------------ |
| 4.1   | SC                   | Programme la **séance d'ouverture** (date, lieu, caractère public/privé) |
| 4.2   | Commission COPE      | Vérifie le **quorum** des membres présents                               |
| 4.3   | N membres Commission | Fournissent leurs **fragments de clé** (Shamir Secret Sharing K-of-N)    |
| 4.4   | Système              | Reconstitue la clé et **déchiffre les offres financières**               |
| 4.5   | Commission           | Génère le **PV d'ouverture** horodaté automatiquement                    |
| 4.6   | IA OCR/NLP           | Vérifie automatiquement la **conformité administrative** des dossiers    |
| 4.7   | Évaluateurs          | Notent chaque critère par soumission (**évaluation en aveugle**)         |
| 4.8   | IA Évaluation        | Suggère des notes avec **score de confiance**                            |
| 4.9   | Système              | Calcule les **scores pondérés** et le classement final                   |

---

### 🔵 Processus 5 — Attribution & Gestion des Recours

| Étape | Acteur                 | Action                                                                      |
| ----- | ---------------------- | --------------------------------------------------------------------------- |
| 5.1   | SC                     | Prononce l'**attribution provisoire** (soumission retenue)                  |
| 5.2   | Système                | Notifie automatiquement **tous** les soumissionnaires                       |
| 5.3   | Système                | Lance le **timer de recours** (10 jours légaux, Art. 83 Loi 23-12)          |
| 5.4   | OE écarté              | Dépose un **recours en ligne** dans le délai légal                          |
| 5.5   | Commission des Marchés | Examine et statue sur la recevabilité du recours                            |
| 5.6   | SC                     | Prononce l'**attribution définitive** (après expiration/clôture de recours) |
| 5.7   | SC                     | Crée la **fiche marché** (formalisation contractuelle)                      |

---

### 🟣 Processus Externe — Procédure Dérogatoire de Gré-à-Gré Assistée par IA

Si l'Appel d'Offres est de type "Gré-à-Gré", le processus de publication classique est suspendu au profit d'un workflow de double validation, conforme à l'Art. 41 de la Loi 23-12.

| Étape | Acteur                   | Action                                                                   | US associée |
| ----- | ------------------------ | ------------------------------------------------------------------------ | ----------- |
| E.1   | Service Contractant (SC) | **Soumet un dossier justificatif** (motivations + pièces jointes MinIO)  | US 11       |
| E.2   | IA (NLP)                 | **Analyse le dossier** et émet un score de conformité + recommandation   | US 12       |
| E.3   | Système                  | Transmet le dossier et le rapport IA au Contrôleur compétent             | -           |
| E.4   | Contrôleur               | **Valide ou Rejette la demande** après examen du score IA et des pièces  | US 13       |
| E.5   | SC                       | Si validé : Poursuit la procédure (attribution directe). Si rejeté : Fin.| -           |

---

## 3. Contenu du Microservice Appels d'Offres

> **Service Appels d'Offres** · Port `8003` · Base de données `ao_db` (PostgreSQL)

### 3.1 Backlog Fonctionnel — 15 User Stories

| #   | Fonctionnalité                                                                 | Acteur       | Priorité   |
| --- | ------------------------------------------------------------------------------ | ------------ | ---------- |
| 1   | **Créer un AO** (référence, objet, type, montant estimé, dates limites)        | SC           | 🔴 Haute   |
| 2   | **Gérer les lots** (découpage AO en lots, numéro, désignation, montant estimé) | SC           | 🔴 Haute   |
| 3   | **Publier / retirer le CDC** (upload avec prix de retrait, accès OE)           | SC           | 🔴 Haute   |
| 4   | **Définir les critères d'éligibilité** (CA min, expérience, certifications)    | SC           | 🔴 Haute   |
| 5   | **Définir les critères d'évaluation** (technique + financier, pondération%)    | SC           | 🔴 Haute   |
| 6   | **Publier un avis réglementaire** (AO, attribution prov./déf., annulation)     | SC           | 🔴 Haute   |
| 7   | **Machine à états du cycle de vie** : `BROUILLON → PUBLIE → ... → ATTRIBUE`    | SC / Système | 🔴 Haute   |
| 8   | **Prononcer l'attribution provisoire** (lancer période recours)                | SC           | 🔴 Haute   |
| 9   | **Prononcer l'attribution définitive** (après expiration recours)              | SC           | 🔴 Haute   |
| 10  | **Créer la fiche marché** (formalisation contractuelle)                        | SC           | 🟡 Moyenne |
| 11  | **Soumettre une demande gré-à-gré** (justifications + pièces obligatoires)     | SC           | 🟡 Moyenne |
| 12  | **Analyse IA d'une demande gré-à-gré** (score de conformité + recommandation)  | Système / IA | 🟡 Moyenne |
| 13  | **Valider / rejeter une demande gré-à-gré** (comparaison recommandation IA)    | Contrôleur   | 🟡 Moyenne |
| 14  | **Consulter les AO publiés** (filtres : type, wilaya, secteur — pagination)    | OE           | 🔴 Haute   |
| 15  | **Retirer le CDC** (téléchargement avec traçabilité + URL présignée)           | OE           | 🔴 Haute   |

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

#### Événements **publiés** par le Service Appels d'Offres

| Exchange | Routing Key | Payload | Consommateurs |
|----------|-------------|---------|---------------|
| `ao.events` | `ao.created` | `{ ao_id, sc_id, type, objet }` | Audit |
| `ao.events` | `ao.published` | `{ ao_id, date_publication, wilaya, secteur }` | Notifications, Audit |
| `ao.events` | `ao.status_changed` | `{ ao_id, ancien_statut, nouveau_statut, changed_by }` | Audit |
| `ao.events` | `ao.attribution.provisoire` | `{ ao_id, soumission_id, operateur_id, date_fin_recours }` | **Notifications** (tous les soumissionnaires), **Recours** (start timer) |
| `ao.events` | `ao.attribution.definitive` | `{ ao_id, marche_id, operateur_id }` | Notifications, Audit |
| `ao.events` | `ao.annule` | `{ ao_id, motif }` | Notifications, Audit |
| `ao.events` | `ao.gre_a_gre.submitted` | `{ gag_id, ao_id, justification }` | **IA Gré à Gré** (analyse) |

#### Événements **consommés** par le Service Appels d'Offres

| Exchange | Routing Key | Action déclenchée |
|----------|-------------|-------------------|
| `recours.events` | `recours.periode.expired` | Déverrouille l'attribution définitive |
| `ia.events` | `ia.gre_a_gre.scored` | Stocke le score IA + recommandation dans `demande_gre_a_gre` |

---

### 3.5 Sécurité Spécifique

#### Contrôle d'Accès RBAC

| Rôle | Permissions sur ce Service |
|------|---------------------------|
| `ADMIN` | Toutes les opérations, audit, supervision |
| `SERVICE_CONTRACTANT` | Créer/modifier/publier AO, gérer lots/critères/CDC, prononcer attributions |
| `OPERATEUR_ECONOMIQUE` | Consulter AO publiés, télécharger CDC (traçabilité) |
| `CONTROLEUR` | Valider/rejeter demandes gré-à-gré |
| `PUBLIC` | Consulter AO publiés (lecture seule, sans inscription) |

> Le contrôle RBAC est délégué à l'**API Gateway**, qui valide la session Redis avant chaque requête. Le service AO reçoit les informations utilisateur dans les headers (injections API Gateway). Aucun appel direct à auth_db.

#### Sécurité des Données

- **Cache Redis** : liste AO publiés (TTL 5 min, invalidation à chaque publication)
- **URLs présignées MinIO** : téléchargement CDC (TTL 30 min, fichier immutable)
- **Machine à états stricte** : transitions irréversibles, chaque changement est journalisé
- **Horodatage certifié** de toutes les publications (Art. 42, 43)
- **Pagination par curseur** pour les listes d'AO (résistance aux pics de charge)

---

## 4. Stack Technologique (Cible)

| Couche               | Technologie                                   | Commentaire                                          |
| -------------------- | --------------------------------------------- | ---------------------------------------------------- |
| **Backend**          | NestJS 10 (TypeScript)                        | API Modulaire                                        |
| **Bases de données** | PostgreSQL 15 + **Prisma ORM**                | Instance isolée `ao_db` via Prisma Client            |
| **Cache**            | Redis 7 + CacheManager                        | Performances et rate limiting                        |
| **Fichiers**         | MinIO (Client S3)                             | Stockage AWS-S3 compatible                           |
| **Messaging**        | RabbitMQ                                      | Async events                                         |
| **Document API**     | Swagger                                       | `/api/docs` auto-généré                              |
| **CI/CD**            | Jenkins / GitHub Actions / Docker Multi-stage | Pipelines de build et test configurés, prêt pour K8s |

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

| Rôle                   | Permissions sur ce Service                                        |
| ---------------------- | ----------------------------------------------------------------- |
| `ADMIN`                | Toutes les opérations, audit                                      |
| `SERVICE_CONTRACTANT`  | Créer/modifier/publier AO, gérer critères, prononcer attributions |
| `OPERATEUR_ECONOMIQUE` | Consulter AO, retirer CDC (traçabilité)                           |
| `CONTROLEUR`           | Valider/rejeter demandes gré-à-gré                                |
| `PUBLIC`               | Consulter AO publiés (lecture seule)                              |

---

## 7. Matrice de Conformité Réglementaire

#### Conformité Réglementaire Automatique

| Règle | Référence Légale | Implémentation |
|-------|------------------|----------------|
| Délai minimum 30 jours AO ouvert | Art. 43 Loi 23-12 | Validation automatique avant publication + alerte |
| Délai minimum 15 jours (urgence) | Art. 43 Loi 23-12 | Mode urgence configurable avec validation |
| Contenu obligatoire de l'avis | Art. 44 Loi 23-12 | Formulaire structuré — champs requis validés |
| Publication BOMOP + 2 quotidiens | Art. 42 Loi 23-12 | Génération PDF BOMOP + flags `publie_bomop`, `publie_presse` |
| Timer recours 10 jours | Art. 83 Loi 23-12 | Calcul automatique `date_fin_recours = date_attribution + 10 jours` |

---

## 8. 🚀 État d'Avancement Actuel

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

7. **Gestion des Documents via MinIO (Phase 4 VALIDÉE)** :
   - Mise en place du module `StorageModule` encapsulant l'instance `S3Client` pour interagir avec le stockage local MinIO.
   - Endpoint d'upload multipart du Cahier des Charges (CDC) incluant le calcul en mémoire du hachage SHA-256 du PDF.
   - Stockage décentralisé des fichiers lourds pour optimiser la charge sur la base de données (seule l'URL générée, le prix et le *hash* sont dans PostgreSQL).
   - Génération dynamique de `Presigned URLs` pour le téléchargement direct.
   - Traçabilité stricte des retraits (`retrait_cdc`) afin de conserver la trace légale de l'Opérateur accédant au document.

8. **Asynchronisme avec RabbitMQ (Phase 5 VALIDÉE)** :
   - Pattern Publisher/Consumer pour déléguer les notifications et l'audit aux autres microservices.
9. **Rattrapage des Backlogs (Phase 5.5 VALIDÉE)** :
   - Implémentation complète de l'Avis réglementaire (`AvisAo`), de l'`Attribution` et de la Fiche `Marche`.
   - L'endpoint listant les Appels d'Offres permet maintenant une recherche filtrée dynamique avec pagination, de façon insensible à la casse.

10. **Renforcement de la Robustesse Métier (Phases 3–5.5 RENFORCÉES)** :
    - Ajout de méthodes utilitaires privées `findXOrFail()` dans `AvisAoService`, `AttributionService` et `MarcheService` pour renvoyer proprement des `NotFoundException` (404) au lieu d'erreurs Prisma brutes (`P2025`).
    - **Validation croisée de propriété** : `AttributionService` vérifie que le `lotId` fourni appartient à l'AO ciblé ; `MarcheService` vérifie que l'`attributionId` appartient à l'AO concerné, empêchant tout contournement inter-AO.
    - **Vérification d'unicité (409 Conflict)** : `MarcheService` empêche la création d'un Marché dont la `referenceMarche` ou l'`attributionId` est déjà utilisé par un autre Marché existant.
    - **Extraction JWT via `@Req()`** : Les endpoints nécessitant une identité utilisateur (`getCdcDownloadUrl`, `validate` gré-à-gré) lisent désormais `req.user?.sub` depuis le token JWT décodé par Passport, au lieu d'un ID simulé en dur.

11. **Workflow Dérogatoire Gré-à-Gré (Phase 6 PARTIELLE — US 11 & US 13 livrées)** :
    - **US 11 — Soumission** (`POST /appels-offres/:id/gre-a-gre/soumettre`) : Vérification que l'AO est de type `GRE_A_GRE`, prévention des doublons, création en bloc des `JustificationGreAGre` avec enum `TypeJustificationGreAGre`, et émission de l'événement `ao.gre_a_gre.submitted` vers RabbitMQ pour déclencher l'analyse IA.
    - **US 13 — Décision du Contrôleur** (`PATCH /appels-offres/gre-a-gre/:id/valider`) : Extraction sécurisée de l'identité du contrôleur depuis le payload JWT (`req.user.sub`), logique transactionnelle `$transaction` atomique créant l'audit `DecisionGreAGre` (avec corrélation IA `correspondIa`), mise à jour du statut de la demande (`ACCEPTEE`/`REJETEE`), mise à jour de l'AO parent (`EN_COURS`/`ANNULE`), et émission de l'événement `ao.gre_a_gre.validated` vers RabbitMQ.
    - **US 12 (IA) — En attente** : La réception de l'événement `ia.gre_a_gre.scored` est déclarée dans `RecoursConsumer` ; le stockage du score dans `EvaluationIaGreAGre` reste à implémenter.

### Prochaines étapes :

- **US 12 (Analyse IA)** : Compléter le handler `ia.gre_a_gre.scored` dans le consumer pour stocker le score de conformité IA et la recommandation dans la table `EvaluationIaGreAGre` (stub présent dans `RecoursConsumer`).
- **Phase 7** : Sécurité Tolérance Zéro avec le système Role-Based Access Control (`@Roles(...)` + `RolesGuard` + validation JWT hors-ligne via `JwtService`).

### 📊 Suivi du Backlog Fonctionnel (15 User Stories)

| Fait | #   | Fonctionnalité                                                                 | Acteur       | Priorité   |
| :--: | --- | ------------------------------------------------------------------------------ | ------------ | ---------- |
|  ✅  | 1   | **Créer un AO** (référence, objet, type, montant estimé, dates limites)        | SC           | 🔴 Haute   |
|  ✅  | 2   | **Gérer les lots** (découpage AO en lots, numéro, désignation, montant estimé) | SC           | 🔴 Haute   |
|  ✅  | 3   | **Publier / retirer le CDC** (upload avec prix de retrait, accès OE)           | SC           | 🔴 Haute   |
|  ✅  | 4   | **Définir les critères d'éligibilité** (CA min, expérience, certifications)    | SC           | 🔴 Haute   |
|  ✅  | 5   | **Définir les critères d'évaluation** (technique + financier, pondération%)    | SC           | 🔴 Haute   |
|  ✅  | 6   | **Publier un avis réglementaire** (AO, attribution prov./déf., annulation)     | SC           | 🔴 Haute   |
|  ✅  | 7   | **Machine à états du cycle de vie** : `BROUILLON → PUBLIE → ... → ATTRIBUE`    | SC / Système | 🔴 Haute   |
|  ✅  | 8   | **Prononcer l'attribution provisoire** (lancer période recours)                | SC           | 🔴 Haute   |
|  ✅  | 9   | **Prononcer l'attribution définitive** (après expiration recours)              | SC           | 🔴 Haute   |
|  ✅  | 10  | **Créer la fiche marché** (formalisation contractuelle)                        | SC           | 🟡 Moyenne |
|  ✅  | 11  | **Soumettre une demande gré-à-gré** (justifications + pièces obligatoires)     | SC           | 🟡 Moyenne |
|  ⬜  | 12  | **Analyse IA d'une demande gré-à-gré** (score de conformité + recommandation)  | Système / IA | 🟡 Moyenne |
|  ✅  | 13  | **Valider / rejeter une demande gré-à-gré** (comparaison recommandation IA)    | Contrôleur   | 🟡 Moyenne |
|  ✅  | 14  | **Consulter les AO publiés** (filtres : type, wilaya, secteur — pagination)    | OE           | 🔴 Haute   |
|  ✅  | 15  | **Retirer le CDC** (téléchargement avec traçabilité + URL présignée)           | OE           | 🔴 Haute   |

> **Progression : 14 / 15 User Stories livrées** (Phases 1, 2, 3, 4, 5, 5.5 complètes + Phase 6 partielle — US 11 & US 13)

### 🧪 Couverture des Tests Unitaires (Jest)

La suite de tests a été exécutée avec succès (`127 tests passed` sur `18 Test Suites`). Tous les accès externes (PostgreSQL via Prisma, MinIO via AWS SDK, RabbitMQ via ClientProxy) sont intégralement mockés.

| Composant | Fiche(s) | Méthodes Validées | Comportements Clés Testés |
| :--- | :--- | :--- | :--- |
| **Storage (S3)** | `storage.service.spec.ts` | `uploadFile`, `getPresignedDownloadUrl` | Configuration client S3, paramètres AWS `PutObjectCommand`, Exceptions. |
| **AppelOffres**  | `Controller` & `Service` | `uploadCdc`, `getCdcDownloadUrl`, endpoints CRUD | Hachage du CDC, règles métiers strictes de la machine à états, URLs présignées MinIO, extraction `operateurId` depuis JWT. |
| **Lots** | `Controller` & `Service` | Endpoints CRUD | Transferts DTO, exceptions liées au statut AO (`ConflictException`), `NotFoundException` si AO absent. |
| **Éligibilité** | `Controller` & `Service` | Endpoints CRUD | Routing des arguments liés à l'AO, types énumérés `TypeCritereEligibilite`, associations inter-tables. |
| **Évaluation** | `Controller` & `Service` | Endpoints CRUD | Validation croisée AO/critère, enum `CategorieCritereEvaluation`, `ConflictException` si AO non-BROUILLON. |
| **AvisAo** | `Controller` & `Service` | Endpoints CRUD | Vérification type `AO_OUVERT`, `findAoOrFail`, `findAvisAoOrFail`, injection module Prisma isolée. |
| **Attribution** | `Controller` & `Service` | Endpoints CRUD | Validation croisée lot/AO, `findAttributionOrFail`, `BadRequestException` si lot n'appartient pas à l'AO. |
| **Marche** | `Controller` & `Service` | Endpoints CRUD | Validation croisée attribution/AO, `ConflictException` sur doublon `referenceMarche` ou `attributionId`. |
| **Gré-à-Gré** | `Controller` & `Service` | `submit`, `validate` | Vérification type `GRE_A_GRE`, anti-doublon demande, émission événements RabbitMQ, transaction `$transaction`, extraction `controleurId` depuis JWT (`req.user.sub`), fallback `anonymous`, corrélation IA (`correspondIa`). |

---

_Base issue du Cahier des Spécifications Logicielles (CSL) Al-Mizan v1.0, équipe KLODIT._

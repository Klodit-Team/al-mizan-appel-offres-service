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

### Périmètre Fonctionnel — 6 Modules Principaux

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Module Avis    │  │ Module Soumission│  │ Module Évaluation│
│  & CDC          │→ │  (E2EE, horod.) │→ │ (Shamir, IA)    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         ↓                                        ↓
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Portail Trans-  │  │ Module Adminis- │  │ Module Attribu- │
│ parence (Public)│  │ tration & Audit │← │ tion & Recours  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

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
| IA — OCR/NLP | 8011 | — | Conformité dossiers administratifs |
| IA — Anomaly Detection | 8012 | — | Détection collusion, saucissonnage |
| IA — GenAI (CDC) | 8013 | — | Assistant rédaction Cahier des Charges |
| IA — Assistant Évaluation | 8014 | — | Notes suggérées, recommandations |
| IA — Assistant Gré à Gré | 8015 | — | Scoring conformité demandes GàG |

---

## 2. Processus Métiers Complets

Le système couvre **7 processus métiers** correspondant au cycle de vie complet d'un marché public.

---

### 🟢 Processus 1 — Expression du Besoin & Création de l'Appel d'Offres

| Étape | Acteur | Action |
|-------|--------|--------|
| 1.1 | Service Contractant (SC) | Crée un AO (référence, objet, type, montant estimé, dates limites) |
| 1.2 | SC | Découpe l'AO en **lots** (numéro, désignation, montant estimé) |
| 1.3 | SC + IA GenAI | Rédige le **Cahier des Charges (CDC)** assisté par IA (détection clauses biaisées) |
| 1.4 | SC | Définit les **critères d'éligibilité** (conditions éliminatoires) |
| 1.5 | SC | Définit les **critères d'évaluation** technique et financier (pondération, note éliminatoire) |

**Statuts AO à ce stade :** `BROUILLON`

---

### 🟡 Processus 2 — Publication & Diffusion

| Étape | Acteur | Action |
|-------|--------|--------|
| 2.1 | SC / Système | Génère l'**avis réglementaire** conforme (BOMOP + presse nationale) |
| 2.2 | Système | Publie sur le **portail public** (accès sans inscription préalable) |
| 2.3 | Système | Contrôle automatique du respect du **délai minimum** (30 jours AO ouvert, 15 jours urgence) |
| 2.4 | OE (Public) | Consulte les AO publiés (filtre par type, wilaya, secteur) |
| 2.5 | OE | Télécharge le CDC (avec prix de retrait, traçabilité) |

**Statuts AO :** `BROUILLON` → `PUBLIE` → `EN_COURS`

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
| 3.7 | Système | **Horodatage légal certifié** de chaque soumission |

> ⚠️ **Confidentialité garantie** : les offres financières ne peuvent être déchiffrées qu'à l'ouverture officielle des plis, par la Commission.

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
| 4.7 | Évaluateurs | Notent chaque critère par soumission (**évaluation en aveugle** — identité OE masquée) |
| 4.8 | IA Évaluation | Suggère des notes avec **score de confiance** et recommandation (retenir / éliminer / analyser) |
| 4.9 | Système | Calcule les **scores pondérés** et le classement final |
| 4.10 | IA Anomalie | Détecte **collusion**, ententes sur les prix, saucissonnage |
| 4.11 | Commission | Génère le **rapport d'évaluation final** (annexé au PV) |

**Statuts AO :** `EN_COURS` → `OUVERTURE_PLIS` → `EVALUATION`

---

### 🔵 Processus 5 — Attribution & Gestion des Recours

| Étape | Acteur | Action |
|-------|--------|--------|
| 5.1 | SC | Prononce l'**attribution provisoire** (soumission retenue) |
| 5.2 | Système | Notifie automatiquement **tous** les soumissionnaires |
| 5.3 | Système | Lance le **timer de recours** (10 jours légaux, Art. 83 Loi 23-12) |
| 5.4 | OE écarté | Dépose un **recours en ligne** (motif + pièces jointes) dans le délai légal |
| 5.5 | Commission des Marchés | Examine et statue sur la recevabilité du recours |
| 5.6 | Commission | Accepte ou rejette avec motif de décision |
| 5.7 | SC | Prononce l'**attribution définitive** (après expiration/clôture de recours) |
| 5.8 | SC | Crée la **fiche marché** (référence, montant, délai, date de signature) |

**Statuts AO :** `EVALUATION` → `ATTRIBUE`

---

### ⚫ Processus 6 — Marché Gré à Gré (Procédure Dérogatoire)

| Étape | Acteur | Action |
|-------|--------|--------|
| 6.1 | SC | Soumet une demande de gré-à-gré avec **justifications obligatoires** (pièces jointes, visa hiérarchique) |
| 6.2 | IA Gré à Gré | Analyse automatiquement et produit un **score de conformité + recommandation** |
| 6.3 | Contrôleur | Compare avec la recommandation IA et prend la **décision finale** |

---

### 🟣 Processus 7 — Processus Transverses (Fil Continu)

| Processus | Responsable | Description |
|-----------|-------------|-------------|
| **Audit permanent** | Service Audit | Toute action est journalisée (hash SHA-256 chaîné, append-only, table immuable) |
| **Notifications** | Service Notifications | Email, SMS, push Android à chaque événement métier |
| **Portail Transparence** | Public | Accès public en lecture seule aux attributions définitives |
| **RBAC** | API Gateway | Contrôle d'accès basé sur les rôles à chaque requête |
| **Incidents IA** | Service Audit | Détection, enregistrement et résolution des divergences IA |

---

## 3. Contenu du Microservice Appels d'Offres

> **Service Appels d'Offres** · Port `8003` · Base de données `ao_db` (MySQL)
>
> Responsabilité : Création, publication et gestion complète du cycle de vie des appels d'offres, des lots, des cahiers des charges, des critères d'évaluation et des attributions.

---

### 3.1 Backlog Fonctionnel — 15 User Stories

| # | Fonctionnalité | Acteur | Priorité |
|---|---------------|--------|----------|
| 1 | **Créer un AO** (référence, objet, type, montant estimé, dates limites) | SC | 🔴 Haute |
| 2 | **Gérer les lots** (découpage AO en lots, numéro, désignation, montant estimé) | SC | 🔴 Haute |
| 3 | **Publier / retirer le CDC** (upload avec prix de retrait, accès OE) | SC | 🔴 Haute |
| 4 | **Définir les critères d'éligibilité** (CA min, expérience, certifications — filtres éliminatoires) | SC | 🔴 Haute |
| 5 | **Définir les critères d'évaluation** (technique + financier, pondération%, note éliminatoire) | SC | 🔴 Haute |
| 6 | **Publier un avis réglementaire** (AO, attribution prov./déf., annulation, rectificatif) | SC | 🔴 Haute |
| 7 | **Machine à états du cycle de vie** : `BROUILLON → PUBLIE → EN_COURS → OUVERTURE_PLIS → EVALUATION → ATTRIBUE` | SC / Système | 🔴 Haute |
| 8 | **Prononcer l'attribution provisoire** (lancer période recours) | SC | 🔴 Haute |
| 9 | **Prononcer l'attribution définitive** (après expiration recours) | SC | 🔴 Haute |
| 10 | **Créer la fiche marché** (formalisation contractuelle) | SC | 🟡 Moyenne |
| 11 | **Soumettre une demande gré-à-gré** (justifications + pièces obligatoires) | SC | 🟡 Moyenne |
| 12 | **Analyse IA d'une demande gré-à-gré** (score de conformité + recommandation) | Système / IA | 🟡 Moyenne |
| 13 | **Valider / rejeter une demande gré-à-gré** (comparaison recommandation IA) | Contrôleur | 🟡 Moyenne |
| 14 | **Consulter les AO publiés** (filtres : type, wilaya, secteur — pagination curseur) | OE | 🔴 Haute |
| 15 | **Retirer le CDC** (téléchargement avec traçabilité + URL présignée MinIO 30 min) | OE | 🔴 Haute |

---

### 3.2 Schéma de Base de Données (`ao_db`)

#### Table `appel_offres`
```sql
CREATE TABLE appel_offres (
  id                        CHAR(36)      PRIMARY KEY,  -- UUID
  reference                 VARCHAR(50)   UNIQUE NOT NULL,
  objet                     TEXT          NOT NULL,
  type_procedure            ENUM('AO_OUVERT','AO_RESTREINT','CONCOURS','GRE_A_GRE') NOT NULL,
  montant_estime            DECIMAL(15,2),
  date_publication          DATETIME,
  date_limite_retrait_cdc   DATETIME,
  date_limite_soumission    DATETIME      NOT NULL,
  date_ouverture_plis       DATETIME,
  statut                    ENUM('BROUILLON','PUBLIE','EN_COURS','OUVERTURE_PLIS',
                                 'EVALUATION','ATTRIBUE','ANNULE','CLOTURE')
                            DEFAULT 'BROUILLON',
  service_contractant_id    CHAR(36)      NOT NULL,  -- ref user_db (cross-service)
  wilaya                    VARCHAR(50),
  secteur_activite          VARCHAR(100),
  created_at                DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME      ON UPDATE CURRENT_TIMESTAMP
);
```

#### Table `lot`
```sql
CREATE TABLE lot (
  id              CHAR(36)     PRIMARY KEY,
  ao_id           CHAR(36)     NOT NULL REFERENCES appel_offres(id),
  numero          INT          NOT NULL,
  designation     VARCHAR(255) NOT NULL,
  montant_estime  DECIMAL(15,2),
  statut          ENUM('ACTIF','ANNULE','ATTRIBUE') DEFAULT 'ACTIF'
);
```

#### Table `critere_eligibilite`
```sql
CREATE TABLE critere_eligibilite (
  id              CHAR(36)     PRIMARY KEY,
  ao_id           CHAR(36)     NOT NULL REFERENCES appel_offres(id),
  libelle         VARCHAR(255) NOT NULL,
  type            ENUM('CA_MIN','EXPERIENCE','CERTIFICATION','AUTRE') NOT NULL,
  valeur_minimale VARCHAR(100),
  eliminatoire    BOOLEAN      DEFAULT TRUE
);
```

#### Table `critere_evaluation`
```sql
CREATE TABLE critere_evaluation (
  id                CHAR(36)     PRIMARY KEY,
  ao_id             CHAR(36)     NOT NULL REFERENCES appel_offres(id),
  lot_id            CHAR(36)     REFERENCES lot(id),
  libelle           VARCHAR(255) NOT NULL,
  categorie         ENUM('TECHNIQUE','FINANCIER') NOT NULL,
  poids             DECIMAL(5,2) NOT NULL,  -- pondération en %
  note_eliminatoire DECIMAL(5,2),
  ordre_affichage   INT          DEFAULT 0
);
```

#### Table `document_cdc`
```sql
CREATE TABLE document_cdc (
  id              CHAR(36)     PRIMARY KEY,
  ao_id           CHAR(36)     NOT NULL REFERENCES appel_offres(id),
  fichier_url     VARCHAR(500) NOT NULL,  -- chemin MinIO
  hash_sha256     VARCHAR(64)  NOT NULL,
  prix_retrait    DECIMAL(10,2) DEFAULT 0,
  version         INT           DEFAULT 1,
  publie_at       DATETIME,
  retire_at       DATETIME
);
```

#### Table `avis_ao`
```sql
CREATE TABLE avis_ao (
  id                CHAR(36)     PRIMARY KEY,
  ao_id             CHAR(36)     NOT NULL REFERENCES appel_offres(id),
  type_avis         ENUM('PUBLICATION','ATTRIBUTION_PROVISOIRE','ATTRIBUTION_DEFINITIVE',
                         'ANNULATION','RECTIFICATIF') NOT NULL,
  contenu_bomop     TEXT,
  date_publication  DATETIME     NOT NULL,
  publie_bomop      BOOLEAN      DEFAULT FALSE,
  publie_presse     BOOLEAN      DEFAULT FALSE,
  publie_plateforme BOOLEAN      DEFAULT TRUE,
  created_by        CHAR(36)     NOT NULL  -- ref user_db
);
```

#### Table `attribution`
```sql
CREATE TABLE attribution (
  id                 CHAR(36)      PRIMARY KEY,
  ao_id              CHAR(36)      NOT NULL REFERENCES appel_offres(id),
  lot_id             CHAR(36)      REFERENCES lot(id),
  soumission_id      CHAR(36)      NOT NULL,  -- ref soumission_db (cross-service)
  operateur_id       CHAR(36)      NOT NULL,  -- ref user_db (cross-service)
  type               ENUM('PROVISOIRE','DEFINITIVE') NOT NULL,
  montant_attribue   DECIMAL(15,2),
  date_attribution   DATETIME      NOT NULL,
  date_fin_recours   DATETIME,               -- date_attribution + 10 jours
  motif              TEXT
);
```

#### Table `marche`
```sql
CREATE TABLE marche (
  id                 CHAR(36)      PRIMARY KEY,
  ao_id              CHAR(36)      NOT NULL REFERENCES appel_offres(id),
  attribution_id     CHAR(36)      NOT NULL REFERENCES attribution(id),
  reference_marche   VARCHAR(100)  UNIQUE NOT NULL,
  montant_signe      DECIMAL(15,2) NOT NULL,
  date_signature     DATE          NOT NULL,
  delai_execution    INT,           -- en jours
  created_at         DATETIME      DEFAULT CURRENT_TIMESTAMP
);
```

#### Table `demande_gre_a_gre`
```sql
CREATE TABLE demande_gre_a_gre (
  id                    CHAR(36)     PRIMARY KEY,
  ao_id                 CHAR(36)     NOT NULL REFERENCES appel_offres(id),
  justification         TEXT         NOT NULL,
  pieces_jointes_urls   JSON,                      -- tableau de chemins MinIO
  score_conformite_ia   DECIMAL(5,2),
  recommandation_ia     ENUM('CONFORME','NON_CONFORME','ANALYSE_REQUISE'),
  confiance_ia          DECIMAL(5,2),
  decision_controleur   ENUM('ACCEPTE','REJETE'),
  motif_decision        TEXT,
  statut                ENUM('EN_ATTENTE_IA','ANALYSE_IA','EN_ATTENTE_CONTROLEUR',
                             'ACCEPTE','REJETE') DEFAULT 'EN_ATTENTE_IA',
  soumis_at             DATETIME     DEFAULT CURRENT_TIMESTAMP,
  decide_at             DATETIME
);
```

#### Table `retrait_cdc` (traçabilité)
```sql
CREATE TABLE retrait_cdc (
  id              CHAR(36)     PRIMARY KEY,
  cdc_id          CHAR(36)     NOT NULL REFERENCES document_cdc(id),
  operateur_id    CHAR(36)     NOT NULL,  -- ref user_db
  retire_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
  ip_address      VARCHAR(45),
  montant_paye    DECIMAL(10,2)
);
```

---

### 3.3 Endpoints API REST

```
Base URL : /api/v1

── Appels d'Offres ──────────────────────────────────────────────────
POST    /appels-offres                       Créer un AO (SC)
GET     /appels-offres                       Lister AO publiés (public, filtres + cursor)
GET     /appels-offres/:id                   Détail d'un AO
PATCH   /appels-offres/:id                   Modifier un AO en brouillon (SC)
PATCH   /appels-offres/:id/statut            Changer le statut (machine à états, SC)
DELETE  /appels-offres/:id                   Annuler un AO (SC)
GET     /appels-offres/:id/timeline          Historique du cycle de vie

── Lots ─────────────────────────────────────────────────────────────
POST    /appels-offres/:id/lots              Créer un lot
GET     /appels-offres/:id/lots             Lister les lots
GET     /appels-offres/:id/lots/:lotId      Détail d'un lot
PATCH   /appels-offres/:id/lots/:lotId      Modifier un lot

── Cahier des Charges ────────────────────────────────────────────────
POST    /appels-offres/:id/cdc              Uploader le CDC (multipart/form-data → MinIO)
GET     /appels-offres/:id/cdc             Obtenir URL présignée MinIO (30 min)
DELETE  /appels-offres/:id/cdc             Retirer le CDC (SC)
POST    /appels-offres/:id/cdc/retrait     Enregistrer un retrait (OE, traçabilité)

── Critères ─────────────────────────────────────────────────────────
POST    /appels-offres/:id/criteres-eligibilite
GET     /appels-offres/:id/criteres-eligibilite
DELETE  /appels-offres/:id/criteres-eligibilite/:critId

POST    /appels-offres/:id/criteres-evaluation
GET     /appels-offres/:id/criteres-evaluation
DELETE  /appels-offres/:id/criteres-evaluation/:critId

── Avis Réglementaires ───────────────────────────────────────────────
POST    /appels-offres/:id/avis             Publier un avis (SC)
GET     /appels-offres/:id/avis            Historique des avis
GET     /appels-offres/:id/avis/:avisId    Détail d'un avis

── Attribution ───────────────────────────────────────────────────────
POST    /appels-offres/:id/attribution      Prononcer attribution provisoire/définitive (SC)
GET     /appels-offres/:id/attribution     Consulter l'attribution

── Marché ────────────────────────────────────────────────────────────
POST    /appels-offres/:id/marche           Créer la fiche marché (SC)
GET     /appels-offres/:id/marche          Consulter la fiche marché

── Gré à Gré ────────────────────────────────────────────────────────
POST    /appels-offres/:id/gre-a-gre            Soumettre une demande (SC)
GET     /appels-offres/gre-a-gre               Lister les demandes (Admin/Contrôleur)
GET     /appels-offres/gre-a-gre/:gagId        Détail + recommandation IA
PATCH   /appels-offres/gre-a-gre/:gagId/decision  Décision contrôleur

── Documentation ────────────────────────────────────────────────────
GET     /api/docs                           Swagger UI (OpenAPI 3.0)
GET     /health                             Health check
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

#### Conformité Réglementaire Automatique

| Règle | Référence Légale | Implémentation |
|-------|------------------|----------------|
| Délai minimum 30 jours AO ouvert | Art. 43 Loi 23-12 | Validation automatique avant publication + alerte |
| Délai minimum 15 jours (urgence) | Art. 43 Loi 23-12 | Mode urgence configurable avec validation |
| Contenu obligatoire de l'avis | Art. 44 Loi 23-12 | Formulaire structuré — champs requis validés |
| Publication BOMOP + 2 quotidiens | Art. 42 Loi 23-12 | Génération PDF BOMOP + flags `publie_bomop`, `publie_presse` |
| Timer recours 10 jours | Art. 83 Loi 23-12 | Calcul automatique `date_fin_recours = date_attribution + 10 jours` |

#### Sécurité des Données

- **Cache Redis** : liste AO publiés (TTL 5 min, invalidation à chaque publication)
- **URLs présignées MinIO** : téléchargement CDC (TTL 30 min, fichier immutable)
- **Machine à états stricte** : transitions irréversibles, chaque changement est journalisé
- **Horodatage certifié** de toutes les publications (Art. 42, 43)
- **Pagination par curseur** pour les listes d'AO (résistance aux pics de charge)

---

## 4. Stack Technologique

### Stack prescrite par le CSL

| Couche | Technologie | Détail |
|--------|------------|--------|
| **Backend** | Django/DRF **ou** NestJS **ou** Laravel | Un framework par microservice |
| **Base de données** | MySQL 8.x | Instance isolée `ao_db` |
| **Cache** | Redis 7 | Sessions, liste AO, URLs présignées |
| **Stockage fichiers** | MinIO (S3-compatible) | CDC, avis BOMOP PDF |
| **Messaging** | RabbitMQ | Événements asynchrones inter-services |
| **Containerisation** | Docker + Kubernetes | Déploiement souverain On-Premise / Cloud Algérien |
| **Documentation API** | Swagger / OpenAPI 3.0 | `/api/docs` auto-généré |
| **CI/CD** | Jenkins + GitHub | Pipeline Blue/Green |
| **Frontend** | Next.js 14 (TypeScript) | SSR/SSG, bilingue AR/FR, RTL |
| **Mobile** | Kotlin (Jetpack Compose) | Android natif, FCM, Certificate Pinning |

### Sécurité & Chiffrement

| Mécanisme | Algorithme | Usage |
|-----------|-----------|-------|
| Chiffrement offres financières | AES-256-GCM + RSA-4096 (hybride) | E2EE côté client (WebCrypto API) |
| Signature numérique | ECDSA P-384 | Intégrité et non-répudiation des soumissions |
| Ouverture des plis | **Shamir Secret Sharing (K-of-N)** | Clé privée Commission fractionnée entre N membres |
| Transport | TLS 1.3 (obligatoire) | Toutes les communications réseau |
| Inter-services | mTLS (Mutual TLS) | Communication sécurisée dans le cluster K8s |
| Mots de passe | Argon2id | Stockage sécurisé des credentials |
| Logs audit | SHA-256 chaîné | Chaque log contient le hash du précédent |
| Données PII au repos | AES-256 via HashiCorp Vault | Conformité Loi 18-07 |
| Android | Certificate Pinning (OkHttp3) | Protection contre les attaques MITM |

---

### ✅ Recommandation pour `al-mizan-appel-offres-service` : **NestJS**

```
Framework : NestJS 10 (TypeScript 5.x) + Node.js 20 LTS

Pourquoi NestJS pour ce microservice :
  ✅ Architecture modulaire native (modules, controllers, services, repositories)
     → correspond exactement à l'architecture interne prescrite par le CSL
  ✅ Support natif RabbitMQ via @nestjs/microservices (AMQP)
  ✅ TypeORM pour MySQL → mapping ORM propre + migrations
  ✅ @nestjs/swagger → génération Swagger/OpenAPI 3.0 automatique
  ✅ Guards RBAC natifs + class-validator (DTOs validation)
  ✅ Même langage TypeScript que Next.js (cohérence d'équipe)
  ✅ Stateless by design → scalabilité horizontale (HPA Kubernetes)
  ✅ Excellent pour les machines à états complexes (cycle de vie AO)
```

#### Dépendances recommandées

```json
{
  "dependencies": {
    "@nestjs/common": "^10.x",
    "@nestjs/core": "^10.x",
    "@nestjs/platform-express": "^10.x",
    "@nestjs/typeorm": "^10.x",
    "@nestjs/microservices": "^10.x",
    "@nestjs/swagger": "^7.x",
    "@nestjs/cache-manager": "^2.x",
    "typeorm": "^0.3.x",
    "mysql2": "^3.x",
    "ioredis": "^5.x",
    "cache-manager-ioredis-yet": "^2.x",
    "amqplib": "^0.10.x",
    "class-validator": "^0.14.x",
    "class-transformer": "^0.5.x",
    "@aws-sdk/client-s3": "^3.x",
    "@aws-sdk/s3-request-presigner": "^3.x",
    "helmet": "^7.x",
    "uuid": "^9.x"
  },
  "devDependencies": {
    "@nestjs/testing": "^10.x",
    "jest": "^29.x",
    "supertest": "^6.x",
    "@types/node": "^20.x",
    "typescript": "^5.x"
  }
}
```

---

## 5. Architecture du Microservice

### Structure des Dossiers

```
al-mizan-appel-offres-service/
├── src/
│   ├── modules/
│   │   ├── appel-offres/           # Module principal AO
│   │   │   ├── controllers/
│   │   │   │   └── appel-offres.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── appel-offres.service.ts
│   │   │   │   └── ao-statut.service.ts      # Machine à états
│   │   │   ├── repositories/
│   │   │   │   └── appel-offres.repository.ts
│   │   │   ├── entities/
│   │   │   │   └── appel-offres.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-ao.dto.ts
│   │   │   │   └── update-statut.dto.ts
│   │   │   └── appel-offres.module.ts
│   │   ├── lots/                   # Module Lots
│   │   ├── cdc/                    # Module Cahier des Charges
│   │   ├── criteres/               # Module Critères
│   │   ├── avis/                   # Module Avis Réglementaires
│   │   ├── attribution/            # Module Attribution
│   │   ├── marche/                 # Module Marché
│   │   └── gre-a-gre/              # Module Gré à Gré
│   ├── common/
│   │   ├── guards/
│   │   │   └── rbac.guard.ts       # Contrôle d'accès par rôle
│   │   ├── decorators/
│   │   │   └── roles.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   └── interceptors/
│   │       └── audit-log.interceptor.ts
│   ├── messaging/
│   │   ├── publishers/
│   │   │   └── ao-event.publisher.ts  # Publication RabbitMQ
│   │   └── consumers/
│   │       └── ao-event.consumer.ts   # Consommation RabbitMQ
│   ├── storage/
│   │   └── minio.service.ts           # Client MinIO S3
│   ├── cache/
│   │   └── redis-cache.service.ts     # Client Redis
│   ├── database/
│   │   └── migrations/                # TypeORM migrations
│   ├── config/
│   │   └── configuration.ts           # Variables d'environnement
│   ├── health/
│   │   └── health.controller.ts       # /health endpoint
│   └── main.ts
├── test/
│   ├── unit/
│   └── integration/
├── docker-compose.yml                 # Dev local
├── Dockerfile                         # Multi-stage build
├── .env.example
└── README.md
```

### Architecture Interne (Flux d'une Requête)

```
Client / API Gateway
       │
       ▼
┌─────────────────────────────────────────────────┐
│              API Gateway (Port 80/443)           │
│  ① Validation session Redis                      │
│  ② Contrôle RBAC                                │
│  ③ Rate limiting                                │
│  ④ Logging                                      │
└───────────────────────┬─────────────────────────┘
                        │ HTTP + headers utilisateur
                        ▼
┌─────────────────────────────────────────────────┐
│         Microservice AO (Port 8003)             │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │ Middleware (Input Validation)            │    │
│  │ → Validation DTOs (class-validator)     │    │
│  └──────────────────┬──────────────────────┘    │
│                     │                            │
│  ┌──────────────────▼──────────────────────┐    │
│  │  Controllers (REST API — /api/v1/...)   │    │
│  │  → Délègue au Service Layer             │    │
│  │  → Expose /api/docs (Swagger)           │    │
│  └──────────────────┬──────────────────────┘    │
│                     │                            │
│  ┌──────────────────▼──────────────────────┐    │
│  │  Service Layer (Business Logic)         │    │
│  │  → Règles métier AO                     │    │
│  │  → Machine à états                      │    │
│  │  → Vérification délais légaux           │    │
│  │  → Orchestration repositories + events │    │
│  └──────┬──────────────────────────┬───────┘    │
│         │                          │             │
│  ┌──────▼──────┐          ┌────────▼────────┐   │
│  │ Repository  │          │ Event Publisher │   │
│  │ Layer       │          │ (RabbitMQ)      │   │
│  │ (TypeORM)   │          │                 │   │
│  └──────┬──────┘          └────────┬────────┘   │
│         │                          │             │
└─────────┼──────────────────────────┼─────────────┘
          │                          │
    ┌─────▼─────┐             ┌──────▼──────┐
    │ MySQL     │             │  RabbitMQ   │
    │ (ao_db)   │             │  Exchange   │
    └─────┬─────┘             └─────────────┘
          │
    ┌─────▼──────────────────┐
    │ Redis  │  MinIO         │
    │ Cache  │  (CDC files)   │
    └────────────────────────┘
```

---

## 6. Acteurs du Système

| Acteur | Rôle Technique | Permissions Clés |
|--------|---------------|-----------------|
| **Administrateur** (`ADMIN`) | Gère la plateforme, paramètres globaux, supervision IA | Toutes opérations |
| **Service Contractant** (`SERVICE_CONTRACTANT`) | Entité publique émettrice des marchés | Créer/publier AO, définir critères, prononcer attributions |
| **Opérateur Économique** (`OPERATEUR_ECONOMIQUE`) | Entreprise soumissionnaire | Consulter AO, retirer CDC, soumettre offres, déposer recours |
| **Membre Commission** (`MEMBRE_COMMISSION`) | Évaluateur désigné (président, rapporteur, membre) | Ouvrir plis (Shamir), noter offres, signer PV |
| **Contrôleur** (`CONTROLEUR`) | Organe de contrôle | Valider/rejeter gré-à-gré, comparer décisions IA |
| **Système / IA** | Composant automatisé | Analyser offres, détecter anomalies, noter conformité |
| **Public / Citoyen** (`PUBLIC`) | Lecture seule | Consulter AO publiés, télécharger CDC |

---

## 7. Matrice de Conformité Réglementaire

Articles de la **Loi n°23-12** couverts par le Service Appels d'Offres :

| Art. | Exigence Légale | Fonctionnalité Implémentée | Priorité |
|------|----------------|--------------------------|----------|
| Art. 5 | Libre accès à la commande publique | Portail public sans inscription préalable + moteur de recherche multicritère | 🔴 Haute |
| Art. 6 | Égalité de traitement des candidats | Horodatage certifié identique pour tous les OE | 🔴 Haute |
| Art. 7 | Transparence des procédures | Journalisation inaltérable + portail citoyen résultats | 🔴 Haute |
| Art. 8 | Intégrité et probité | IA détection collusion et anomalies dans les offres | 🔴 Haute |
| Art. 13 | Appel d'offres ouvert national/international | Workflow AO ouvert paramétrable (publication → réception → ouverture → évaluation → attribution) | 🔴 Haute |
| Art. 14 | AO avec exigence de capacités minimales | Formulaire critères d'éligibilité configurables (CA min, expérience, certifications) | 🔴 Haute |
| Art. 15 | Appel d'offres restreint | Workflow AO restreint avec préqualification | 🟡 Moyenne |
| Art. 16 | Concours (jury) | Workflow concours : jury, anonymat renforcé | 🟢 Basse |
| Art. 17–19 | Gré à gré et après consultation | Workflow gré-à-gré + justificatifs + visa hiérarchique | 🟡 Moyenne |
| Art. 42 | Publication obligatoire BOMOP + 2 quotidiens | Génération PDF BOMOP + intégration API presse | 🔴 Haute |
| Art. 43 | Délai minimum préparation offres | Contrôle automatique délais + alerte si non-respect | 🔴 Haute |
| Art. 44 | Contenu obligatoire de l'avis | Formulaire structuré + validation avant publication | 🔴 Haute |
| Art. 78 | Attribution provisoire avec délai recours | Notification automatique + timer recours 10 jours | 🔴 Haute |
| Art. 83 | Délai de recours (10 jours) | Blocage attribution définitive pendant le délai | 🟡 Moyenne |

---

## 🚀 Démarrage Rapide (Développement Local)

```bash
# Cloner le dépôt
git clone https://github.com/Klodit-Team/al-mizan-appel-offres-service.git
cd al-mizan-appel-offres-service

# Variables d'environnement
cp .env.example .env

# Lancer les services (Docker Compose)
docker-compose up -d

# Installer les dépendances
npm install

# Exécuter les migrations
npm run typeorm:migrate

# Lancer en mode développement
npm run start:dev

# Swagger UI disponible sur :
# http://localhost:8003/api/docs
```

### Variables d'Environnement (`.env.example`)

```env
# Application
PORT=8003
NODE_ENV=development

# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ao_db
DB_USER=ao_user
DB_PASSWORD=secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_CDC=cdc-documents
MINIO_BUCKET_AVIS=avis-ao

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE_AO=ao.events

# API Gateway
API_GATEWAY_SECRET=shared_secret_for_header_validation
```

---

## 📊 Indicateurs de Qualité Cibles

| Indicateur | Objectif |
|-----------|---------|
| Couverture tests unitaires | ≥ 80% |
| Latence P95 (soumissions) | < 2s |
| Uptime mensuel | ≥ 99.5% (SLO) |
| Erreurs HTTP 5xx | 0% lors des tests de charge |
| Scalabilité | Jusqu'à 10 replicas (HPA) pendant les pics |
| Précision IA OCR/NLP | ≥ 90% |
| Détection anomalies IA | ≥ 85% |

---

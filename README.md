# al-mizan-appel-offres-service

> **Service de Gestion des Appels d'Offres** — Création, publication, évaluation, attribution et gré-à-gré des marchés publics conformément à la loi algérienne 23-12.

---

## Table des matières

1. [Aperçu](#aperçu)
2. [Technologies](#technologies)
3. [Architecture & Réseau](#architecture--réseau)
4. [Base de données](#base-de-données)
5. [Variables d'environnement](#variables-denvironnement)
6. [API REST](#api-rest)
7. [Messagerie RabbitMQ](#messagerie-rabbitmq)
8. [Commandes utiles](#commandes-utiles)
9. [Docker](#docker)

---

## Aperçu

`al-mizan-appel-offres-service` est le cœur métier de la plateforme Al-Mizan. Il gère le cycle de vie complet d'un appel d'offres (AO), de sa création en brouillon jusqu'à la clôture, en passant par la publication, l'ouverture des plis, l'évaluation, l'attribution provisoire/définitive, et les procédures de gré-à-gré.

Fonctionnalités principales :

- **Gestion du cycle de vie AO** : transitions de statut (BROUILLON → PUBLIE → EN_COURS → OUVERTURE_PLIS → EVALUATION → ATTRIBUE → CLOTURE)
- **Lots** : découpage de l'AO en lots séparés
- **Critères d'éligibilité & d'évaluation** : configuration des règles de sélection (CA min, expérience, certification, pondération)
- **Documents CDC** (Cahier des Clauses) : gestion des retraits payants
- **Avis BOMOP/Presse** : publication des avis légaux (publication, attribution provisoire/définitive, annulation)
- **Attribution** : provisoire (10 jours de recours légaux — Art. 83 Loi 23-12) puis définitive
- **Marchés** : signature et suivi après attribution définitive
- **Gré-à-Gré** : demandes justifiées + analyse IA + décision contrôleur

Le service est bâti en **NestJS** avec **Prisma ORM** sur **MySQL**, un cache **Redis**, et un stockage de documents **MinIO** (S3-compatible).

---

## Technologies

| Technologie            | Version   | Rôle                                              |
|------------------------|-----------|---------------------------------------------------|
| Node.js                | 20 LTS    | Runtime                                           |
| TypeScript             | ^5.7      | Langage                                           |
| NestJS                 | ^11.0     | Framework (modules, DI, guards, microservices)    |
| Prisma ORM             | 6.19.2    | ORM + migrations MySQL                            |
| MySQL                  | 8.x       | Base de données principale                        |
| Redis (ioredis)        | ^5.9      | Cache applicatif                                  |
| MinIO (@aws-sdk/client-s3) | ^3.1001 | Stockage objet S3-compatible (CDC)              |
| amqplib                | ^0.10     | Client RabbitMQ (événements)                      |
| amqp-connection-manager | ^5.0    | Reconnexion automatique RabbitMQ                  |
| class-validator        | ^0.14     | Validation des DTOs                               |
| helmet                 | ^8.1      | Sécurité HTTP                                     |
| @nestjs/swagger        | ^11.2     | Documentation OpenAPI auto-générée                |
| Jest                   | ^30.0     | Tests unitaires & e2e                             |

---

## Architecture & Réseau

```
API Gateway (:3000) ──► appel-offres-service (:8003)
                                  │
                                  ├── MySQL   (mysql:3306 → ao_db)
                                  ├── Redis   (redis:6379)
                                  ├── MinIO   (minio:9000 — buckets: cdc-documents, avis-ao)
                                  └── RabbitMQ (rabbitmq:5672)
```

- **Port exposé** : `8003`
- **Réseau Docker** : `al-mizan-network`
- **Nom du conteneur** : `appel-offres-service`
- **Swagger UI** : `http://localhost:8003/api`

---

## Base de données

**Moteur** : MySQL 8 · **Schema** : `ao_db`

### Modèles principaux

| Modèle              | Table                    | Description                                   |
|---------------------|--------------------------|-----------------------------------------------|
| `AppelOffres`       | `appel_offres`           | L'AO principal (référence, statut, dates...)  |
| `Lot`               | `lot`                    | Lot d'un AO                                   |
| `CritereEligibilite`| `critere_eligibilite`    | Critère éliminatoire (CA min, expérience...)  |
| `CritereEvaluation` | `critere_evaluation`     | Critère de notation pondéré (%)               |
| `DocumentCdc`       | `document_cdc`           | CDC publié avec prix de retrait               |
| `RetraitCdc`        | `retrait_cdc`            | Retrait d'un CDC par un OE                    |
| `AvisAo`            | `avis_ao`                | Avis BOMOP / presse                           |
| `Attribution`       | `attribution`            | Attribution provisoire ou définitive          |
| `Marche`            | `marche`                 | Marché signé après attribution définitive     |
| `DemandeGreAGre`    | `demandes_gre_a_gre`     | Demande de procédure gré-à-gré                |
| `JustificationGreAGre`| `justifications_gre_a_gre` | Justifications (URGENCE, TECHNIQUE...)   |
| `EvaluationIaGreAGre`| `evaluations_ia_gre_a_gre` | Score IA de conformité (0-100%)           |
| `DecisionGreAGre`   | `decisions_gre_a_gre`    | Décision finale du contrôleur                 |

### Cycle de vie d'un AO

```
BROUILLON → PUBLIE → EN_COURS → OUVERTURE_PLIS → EVALUATION → ATTRIBUE ──(10j recours)──► CLOTURE
                                                                    │
                                                                    └──► ANNULE
```

---

## Variables d'environnement

```env
PORT=8003
NODE_ENV=development

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ao_db
DB_USER=root
DB_PASSWORD=password
DATABASE_URL=mysql://root:password@localhost:3306/ao_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO (S3-compatible)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_CDC=cdc-documents
MINIO_BUCKET_AVIS=avis-ao

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE_AO=al-mizan.events
RABBITMQ_QUEUE_AO=ao.queue

# Sécurité
API_GATEWAY_SECRET=shared_secret_for_header_validation
```

> ⚠️ En production (Docker), remplacer `localhost` par les noms de conteneurs : `mysql`, `redis`, `minio`, `rabbitmq`.

---

## API REST

Base URL (via Gateway) : `http://localhost:3000/ao`  
Base URL (directe) : `http://localhost:8003`  
Swagger : `http://localhost:8003/api`

### Appels d'Offres

| Méthode  | Endpoint                            | Auth | Description                              |
|----------|-------------------------------------|------|------------------------------------------|
| `POST`   | `/appel-offres`                     | Oui  | Créer un AO (statut BROUILLON)           |
| `GET`    | `/appel-offres`                     | Oui  | Lister tous les AOs (filtres disponibles)|
| `GET`    | `/appel-offres/:id`                 | Oui  | Détail d'un AO                           |
| `PATCH`  | `/appel-offres/:id`                 | Oui  | Modifier un AO en brouillon              |
| `PATCH`  | `/appel-offres/:id/statut`          | Oui  | Changer le statut d'un AO                |
| `DELETE` | `/appel-offres/:id`                 | Oui  | Supprimer un AO en brouillon             |

### Lots

| Méthode  | Endpoint                            | Auth | Description               |
|----------|-------------------------------------|------|---------------------------|
| `POST`   | `/appel-offres/:id/lots`            | Oui  | Ajouter un lot à un AO    |
| `GET`    | `/appel-offres/:id/lots`            | Oui  | Lister les lots d'un AO   |
| `PATCH`  | `/lots/:id`                         | Oui  | Modifier un lot            |
| `DELETE` | `/lots/:id`                         | Oui  | Supprimer un lot            |

### Critères & Eligibilité

| Méthode  | Endpoint                                  | Auth | Description                        |
|----------|-------------------------------------------|------|------------------------------------|
| `POST`   | `/appel-offres/:id/criteres-eligibilite`  | Oui  | Ajouter un critère d'éligibilité   |
| `GET`    | `/appel-offres/:id/criteres-eligibilite`  | Oui  | Lister les critères d'éligibilité  |
| `POST`   | `/appel-offres/:id/criteres-evaluation`   | Oui  | Ajouter un critère d'évaluation    |
| `GET`    | `/appel-offres/:id/criteres-evaluation`   | Oui  | Lister les critères d'évaluation   |

### CDC, Avis & Attribution

| Méthode  | Endpoint                          | Auth | Description                              |
|----------|-----------------------------------|------|------------------------------------------|
| `POST`   | `/appel-offres/:id/cdc`           | Oui  | Publier le CDC d'un AO                   |
| `POST`   | `/cdc/:id/retrait`                | Oui  | Enregistrer un retrait de CDC par un OE  |
| `POST`   | `/appel-offres/:id/avis`          | Oui  | Créer un avis BOMOP/presse               |
| `POST`   | `/appel-offres/:id/attribution`   | Oui  | Créer une attribution provisoire         |
| `POST`   | `/appel-offres/:id/marche`        | Oui  | Créer le marché après attribution définitive |

### Gré-à-Gré

| Méthode  | Endpoint                              | Auth | Description                               |
|----------|---------------------------------------|------|-------------------------------------------|
| `POST`   | `/appel-offres/:id/gre-a-gre`         | Oui  | Soumettre une demande gré-à-gré           |
| `GET`    | `/appel-offres/:id/gre-a-gre`         | Oui  | Détail de la demande gré-à-gré            |
| `POST`   | `/gre-a-gre/:id/decision`             | Oui  | Rendre une décision (Contrôleur)          |

---

## Messagerie RabbitMQ

**Exchange** : `al-mizan.events` (type: `topic`, durable: `true`)

### Événements publiés

| Routing Key                  | Déclencheur                             | Consommateurs                    |
|------------------------------|-----------------------------------------|----------------------------------|
| `ao.created`                 | Création d'un AO                        | audit-service                    |
| `ao.published`               | Statut → PUBLIE                         | notification-service, audit      |
| `ao.status_changed`          | Tout changement de statut               | audit-service                    |
| `ao.attribution.provisoire`  | Statut → ATTRIBUE (timer 10j Art.83)    | notification-service, recours-service |
| `ao.attribution.definitive`  | Timer recours expiré                    | notification-service, audit      |
| `ao.annule`                  | Annulation d'un AO                      | notification-service, audit      |
| `ao.gre_a_gre.submitted`     | Demande gré-à-gré soumise               | IA Service (analyse conformité)  |
| `ao.gre_a_gre.validated`     | Décision contrôleur sur gré-à-gré       | notification-service             |

### Événements consommés

| Routing Key               | Source            | Action réalisée                                                  |
|---------------------------|-------------------|------------------------------------------------------------------|
| `recours.periode.expired` | recours-service   | Passage AO : ATTRIBUE → CLOTURE + émission `ao.attribution.definitive` |
| `gre_a_gre.decision.sc`   | IA/contrôle       | Mise à jour statut demande gré-à-gré                             |

---

## Commandes utiles

### Développement local

```bash
npm install
npm run start:dev       # Hot-reload NestJS
npm run build           # Compilation TypeScript
npm run start:prod      # Production
```

### Base de données

```bash
npx prisma db push      # Appliquer le schéma
npx prisma generate     # Générer le client Prisma
npm run db:seed         # Seeder les données initiales
npx prisma studio       # Interface graphique Prisma
```

### Tests

```bash
npm test                # Tests unitaires
npm run test:e2e        # Tests end-to-end
npm run test:cov        # Couverture de code
```

---

## Docker

### Build de l'image

```bash
docker build -t al-mizan-appel-offres-service .
```

### Notes importantes sur le Dockerfile

- Image de base : `node:20-alpine`
- Au démarrage : `npx prisma db push && node dist/main`
- Buckets MinIO créés automatiquement au premier démarrage

### Déploiement via docker-compose

```bash
docker-compose up -d appel-offres-service
docker-compose logs -f appel-offres-service
```

---

*Maintenu par l'équipe Al-Mizan — voir `al-mizan-deployments` pour la configuration de déploiement complète.*

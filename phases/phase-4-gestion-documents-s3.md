# Phase 4 : Gestion des Documents via MinIO (Client S3) 📁

Maintenant que l'Appel d'Offres existe et contient ses lots/critères, le Service Contractant doit y attacher son Cahier des Charges (CDC) officiel au format PDF. Ce document sert de référence légale pour le marché public et sera par la suite retiré par les Opérateurs Économiques.

---

## 🎯 Vue d'ensemble de notre système
Dans cette phase, nous avons délégué le stockage des fichiers lourds (PDF) à **MinIO** (un stockage compatible Amazon S3) au lieu d'alourdir la base de données PostgreSQL. 
PostgreSQL ne conserve ici que les **métadonnées** (L'URL, l'empreinte numérique de sécurité, la date).

Nous avons également mis en place la **traçabilité des retraits**, qui est une notion légale obligatoire.

---

## 🛠️ Explication détaillée de l'Implémentation

### 1. Les dépendances installées
Nous avons ajouté l'écosystème AWS S3 (adaptable à MinIO) et le gestionnaire de fichiers (`multer`).
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @nestjs/platform-express
npm install --save-dev @types/multer
```

### 2. Le Module Dédié : `StorageModule`
Au lieu de coder toute la logique S3 dans notre Appel d'Offres (ce qui serait "sale" architecturalement parlant), nous avons créé un vrai module indépendant : `src/storage/storage.module.ts`.

#### Le `StorageService`
Il initialise la connexion S3 via les variables d'environnement (`ConfigService`) :
- `endpoint`: Par défaut `http://localhost:9000`
- L'astuce cruciale : `forcePathStyle: true`. Sans cela, le SDK AWS essaie de contacter le cloud Amazon (ex: aws.com) au lieu de contacter MinIO en local.

Ce service expose **deux méthodes clés** abstraites de la logique métier :
1. `uploadFile(...)` : Exécute une commande `PutObjectCommand` pour uploader un Buffer vers un bucket spécifique et retourne une **URL Interne** (ex: `s3://cdc-documents/...`).
2. `getPresignedDownloadUrl(...)` : Exécute une commande `GetObjectCommand` avec `getSignedUrl`. Cela crée un lien HTTPS public avec une "signature à durée limitée" (ex: 15 minutes). 

### 3. La Logique Métier : `AppelOffresService`
C'est ici que les règles légales du grand projet KLODIT entrent en action.

#### L'Upload : `uploadCdc`
- **Contrôle** : Un Cahier des charges ne peut être associé que si l'AO est en statut `BROUILLON` (Sinon *409 ConflictException*).
- **Hachage (SHA-256)** : Utilisation de `crypto` (natif NodeJS). On calcule l'empreinte digitale du fichier Binaire. Ça permet d'attester juridiquement que le fournisseur a bien reçu *exactement* ce fichier et qu'il n'a pas été corrompu ou falsifié par la suite.
- **Stockage et Sauvegarde** : On appelle le `StorageService` pour l'upload physique, puis Prisma pour sauvegarder les infos (URL S3 générée, Hash, Prix éventuel de retrait) dans la table `document_cdc`.

#### Le Retrait Sécurisé : `getPresignedDownloadUrl`
- **Le problème** : Envoyer un PDF de 20MB du conteneur MinIO → au processus NestJS → au navigateur de l'utilisateur est très coûteux en RAM pour le serveur.
- **La solution (Presigned URL)** : Le Backend demande au `StorageService` une URL temporaire de téléchargement et la renvoie au format JSON. Le navigateur de l'utilisateur va ensuite utiliser cette URL pour télécharger le lourd PDF *directement* depuis MinIO, libérant complètement notre Backend !
- **Obligation légale (Traçabilité)** : Avant même de lui donner le lien, on trace obligatoirement dans Prisma (table `retrait_cdc`) l'ID de l'opérateur et la date/heure de l'obtention du document.

### 4. L'Exposition au client : `AppelOffresController`
Deux routes ont été ajoutées pour le front-end.

#### `POST /appel-offres/:id/cdc` (FormData)
L'utilisation principale ici est :
- **`@UseInterceptors(FileInterceptor('fichier'))`** : C'est la syntaxe NestJS qui intercepte la requête "multipart/form-data" et stocke le fichier en mémoire sous l'étiquette `fichier`.
- **`UploadCdcDto`** : C'est le DTO qui gère la réception des propriétés "textuelles" qui accompagnent l'envoi du fichier, comme le `prixRetrait` (optionnel).

#### `GET /appel-offres/:id/cdc/download`
Une route très simple qui retourne un JSON contenant la fameuse `downloadUrl`. L'ID du demandeur (Opérateur) est pour l'instant simulé avec une variable factice (`123e4567-e89b-...`), le temps qu'on ajoute la couche de Sécurité `RBAC` / `JWT` dans le futur.

---

## ✅ Comment tester ?

1. Assure-toi que ton **Docker Compose** est allumé et que le bucket `cdc-documents` existe sur l'interface Admin de ton MinIO local (`localhost:9001`).
2. Va sur **Swagger UI** (`http://localhost:3000/api-docs`).
3. Cherche `POST /appel-offres/{id}/cdc`.
4. Remplis `aoId` avec un Appel d'Offres que tu as créé précédemment.
5. Swagger t'affiche un bouton **"Choose File"** (grâce à `@ApiConsumes('multipart/form-data')`).
6. Choisis un PDF sur ton ordinateur et clique sur Execute.
7. Ensuite, cherche la requête `GET /appel-offres/{id}/cdc/download`.
8. Copie la longue URL `downloadUrl` reçue, ouvre un onglet dans Chrome et colle-la : tu télécharges le fichier directement depuis l'object storage MinIO !

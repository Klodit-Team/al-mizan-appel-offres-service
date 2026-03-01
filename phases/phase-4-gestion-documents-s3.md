# Phase 4 : Gestion des Documents via MinIO (S3) 🗂️

L'objectif de cette phase est de stocker le lourd fichier PDF du Cahier des Charges (CDC) sans encombrer la base PostgreSQL `ao_db`. On va utiliser le protocole standard S3 vers notre serveur local MinIO. On gère aussi la traçabilité légale des téléchargements.

## 🎯 Ce que tu dois accomplir :

1.  **Génération du Module :**
    *   Exécuter : `nest g module storage`
    *   Exécuter : `nest g service storage`

2.  **Connexion au Service S3 (Client AWS-SDK) :**
    *   Le module Storage est global (`@Global()`)
    *   Dans `storage.service.ts`, instancier :
        ```typescript
        this.s3Client = new S3Client({
          region: 'us-east-1', // Valeur vide par défaut pour MinIO
          endpoint: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
          forcePathStyle: true, // Obligatoire pour MinIO
          credentials: {
            accessKeyId: process.env.MINIO_ACCESS_KEY,
            secretAccessKey: process.env.MINIO_SECRET_KEY,
          },
        });
        ```

3.  **Uploading du Document CDC :**
    *   Fournir une méthode `uploadDocument(fileBuffer, fileName, contentType)`
    *   Utiliser la commande `@aws-sdk/client-s3#PutObjectCommand`
    *   Sauvegarder l'URI MinIO renvoyé (ex: `s3://cdc-documents/...`) dans l'entité PostgreSQL `DocumentCDC`.

4.  **Téléchargement Sécurisé (Retrait du CDC) :**
    *   Le cahier des charges ne peut être téléchargé que par le rôle `OPERATEUR_ECONOMIQUE` sur un statut `PUBLIE`.
    *   Fournir une méthode `getPresignedUrl(objectKey: string)` dans `StorageService`
    *   Générer avec `getSignedUrl(this.s3Client, new GetObjectCommand(...), { expiresIn: 3600 })`. (Lien temporaire d'une heure).
    *   L'endpoint `/appels-offres/:id/cdc/download` retournera simplement l'URL S3 signée (redirection HTTP 302).

5.  **Audit Traçabilité :**
    *   Chaque fois que l'endpoint `/appels-offres/:id/cdc/download` est appelé par un utilisateur identifié (JWT récupéré par l'API Gateway - Mocké ici), on doit créer une entrée dans l'entité/table PostgreSQL `RetraitCDC` avec la `date_retrait`, l'`op_id`, et l'`ao_id`. C'est l'US 15 !

## 🛠️ Outils NestJS à utiliser :
*   Le client libre `@aws-sdk/client-s3` (déjà installé) et `@aws-sdk/s3-request-presigner`.
*   Le décorateur `FileInterceptor()` (multer) pour accepter le form-data `multipart/form-data` en POST.
*   L'entité persistante `RetraitCDC` pour la légalité.

## ✅ Critère de validation :
Depuis Swagger, tu dois uploader un fichier PDF dans un Appel d'Offres. Vérifier l'interface MinIO (http://localhost:9001, minioadmin/minioadmin) que le fichier est présent. Puis, faire une requête GET `/appels-offres/{id}/cdc` et recevoir l'URL présignée qui affiche le document en cours de validité. Vérifier que ta table `retrait_cdc` a bien été peuplée.

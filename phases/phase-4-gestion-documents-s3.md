# Phase 4 : Gestion des Documents via MinIO (Client S3) 📁

Maintenant que l'Appel d'Offres existe et contient ses lots/critères, le Service Contractant doit y attacher son Cahier des Charges (CDC) officiel au format PDF. Ce document servira de référence légale pour le marché public et sera par la suite retiré par les Opérateurs Économiques.

---

## 🎯 Ce que tu dois accomplir :

### 1. Configuration du Client AWS S3 (@aws-sdk/client-s3)
Installe le client S3 officiel :
```bash
npm install @aws-sdk/client-s3
npm install @aws-sdk/s3-request-presigner
```

Crée un `MinioService` dans ton application (ou utilise le dossier `src/common/services/`) qui configurera l'instance `S3Client`.
Les paramètres sont déjà dans `.env` :
*   `endpoint`: `http://localhost:9000` (MINIO_ENDPOINT : MINIO_PORT)
*   `credentials`:
    *   `accessKeyId`: `minioadmin` (MINIO_ACCESS_KEY)
    *   `secretAccessKey`: `minioadmin` (MINIO_SECRET_KEY)
*   `s3ForcePathStyle`: `true`

### 2. Téléchargement du CDC (Le Service Contractant upload)
Crée l'endpoint : `POST /api/appels-offres/:aoId/cdc`.
Ce endpoint doit utiliser le module `Multer` de Node.js via `@UseInterceptors(FileInterceptor('fichier'))`.

**Logique du Service :**
1.  **Vérification Métier :** L'AO doit être au statut `BROUILLON` pour modifier le CDC.
2.  **Upload MinIO :**
    - `Bucket` : `cdc-documents`
    - `Key` : `AO-${aoId}-${Date.now()}.pdf`
    - Envoie le Buffer `file.buffer`.
3.  **Hachage SHA-256 :** Calcule le hash cryptographique du fichier PDF en mémoire avant de l'ajouter dans la base de données.
4.  **Enregistrement Prisma :** Crée une entrée dans ta table `DocumentCdc` en sauvegardant l'URL S3 générée, le nom, le `hashSha256` calculé et le `prixRetrait` éventuel.

### 3. Le Retrait Sécurisé (L'Opérateur Économique télécharge)
Crée l'endpoint : `GET /api/appels-offres/:aoId/cdc/download`.

**L'objectif n'est pas de renvoyer le fichier binaire directement !**
Ton endpoint doit :
1. Chercher l'URL interne du fichier dans la BDD Prisma.
2. Utiliser `getSignedUrl` de l'AWS SDK.
3. Renvoyer cette URL signée (valide pour 15 minutes) dans la réponse JSON. L'Opérateur cliquera sur ce lien pour télécharger le fichier directement depuis MinIO.
4. **Traçabilité :** Dès que le lien est envoyé, insérer une ligne dans la table `RetraitCdc` (Prisma) pour garder la trace légale que cet OE a retiré le CDC (obligatoire selon la Loi 23-12).

---

## 🛠️ Outils NestJS & AWS à utiliser :
*   `@nestjs/platform-express` pour gérer les uploads Multipart/form-data.
*   `@aws-sdk/s3-request-presigner` pour créer des accès temporaires sécurisés au bucket.
*   `crypto` natif de Node.js pour faire le `createHash('sha256).update(buffer).digest('hex')`.

## ✅ Critère de validation :
Depuis Swagger, tu dois pouvoir uploader un petit document texte (`.txt` ou `.pdf`) sur ton endpoint. L'URL MinIO doit apparaître dans ta table PostgreSQL `document_cdc`. Par la suite, quand tu appelles le `/download`, tu dois obtenir une longue URL que tu pourras coller dans ton navigateur pour voir le fichier téléchargé.

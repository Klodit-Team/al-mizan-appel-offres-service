import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private s3Client: S3Client;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      endpoint: this.configService.get<string>(
        'MINIO_ENDPOINT',
        'http://localhost:9000',
      ),
      region: 'us-east-1', // MinIO requiert une region, même bidon (us-east-1 est commun)
      credentials: {
        accessKeyId: this.configService.get<string>(
          'MINIO_ACCESS_KEY',
          'minioadmin',
        ),
        secretAccessKey: this.configService.get<string>(
          'MINIO_SECRET_KEY',
          'minioadmin',
        ),
      },
      forcePathStyle: true, // Très important pour MinIO
    });
  }

  /**
   * Upload un Buffer vers MinIO.
   *
   * @param bucketName Nom du bucket (ex: cdc-documents)
   * @param key Nom du fichier dans S3 (AO-...)
   * @param fileBuffer Buffer du fichier
   * @param mimetype Type MIME du fichier (ex: application/pdf)
   * @returns L'URL S3 "interne" où est stocké le fichier
   */
  async uploadFile(
    bucketName: string,
    key: string,
    fileBuffer: Buffer,
    mimetype: string,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimetype,
      });

      await this.s3Client.send(command);

      // On retourne un chemin formaté, qui pourra être manipulé par la suite
      return `s3://${bucketName}/${key}`;
    } catch (error) {
      console.error('Erreur MinIO upload:', error);
      throw new InternalServerErrorException(
        "Erreur lors de l'upload du fichier vers le stockage S3.",
      );
    }
  }

  /**
   * Génère une URL temporaire signée pour télécharger un petit fichier en direct.
   * L'URL expirera généralement dans 15 minutes.
   *
   * @param bucketName Nom du bucket
   * @param key Nom du fichier (clef)
   * @param expiresIn Expiration en secondes (ex: 900 = 15 minutes)
   * @returns URL publique (http://...) pour le TÉLÉCHARGEMENT.
   */
  async getPresignedDownloadUrl(
    bucketName: string,
    key: string,
    expiresIn = 900,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      // Crée l'URL signée asynchrone pour la commande GET
      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('Erreur Presigned URL MinIO:', error);
      throw new InternalServerErrorException(
        'Impossible de générer le lien de téléchargement sécurisé.',
      );
    }
  }
}

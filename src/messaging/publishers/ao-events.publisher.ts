import {
  Injectable,
  Inject,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { StatutAO } from '@prisma/client';
import * as amqp from 'amqplib';

// ─── Interfaces des payloads ───────────────────────────────────────────────────
// Typer les payloads élimine les erreurs silencieuses et documente le contrat.

export interface AoCreatedPayload {
  aoId: string;
  typeProcedure: string;
  objet: string;
  createdAt: Date;
}

export interface AoPublishedPayload {
  aoId: string;
  reference: string;
  objet: string;
  datePublication: Date;
}

export interface AoStatusChangedPayload {
  aoId: string;
  ancienStatut: StatutAO;
  nouveauStatut: StatutAO;
  changedAt: Date;
}

export interface AoAttributionProvisoirePayload {
  aoId: string;
  dateFinRecours: Date; // date_attribution + 10 jours légaux (Art. 83 Loi 23-12)
}

export interface AoAttributionDefinitivePayload {
  aoId: string;
  clotureAt: Date;
}

export interface AoAnnulePayload {
  aoId: string;
  annuleAt: Date;
}

export interface AoGreAGreSubmittedPayload {
  gagId: string;
  aoId: string;
  userId: string;
  justification: string;
  submittedAt: Date;
}

export interface AoGreAGreValidatedPayload {
  gagId: string;
  aoId: string;
  decision: string;
  motif: string;
  validatedAt: Date;
}

export interface AoClarificationReponduePayload {
  aoId: string;
  clarificationId: string;
  question: string;
  reponse: string;
  reponduAt: Date;
}

// ─── Publisher ────────────────────────────────────────────────────────────────

@Injectable()
export class AoEventsPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AoEventsPublisher.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private readonly exchange = 'al-mizan.events';

  constructor(
    @Inject('RABBITMQ_EVENT_BUS') private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    try {
      const url =
        process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchange, 'topic', {
        durable: true,
      });
      this.logger.log(
        `Raw AMQP publisher connected to exchange ${this.exchange}`,
      );
    } catch (err) {
      this.logger.error(
        'Failed to initialize raw AMQP publisher',
        (err as Error).message,
      );
    }
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      this.logger.warn('Error while closing raw AMQP publisher connection');
    }
  }

  private publishRaw(routingKey: string, payload: any) {
    if (this.channel) {
      try {
        const buffer = Buffer.from(JSON.stringify(payload));
        this.channel.publish(this.exchange, routingKey, buffer, {
          persistent: true,
          contentType: 'application/json',
        });
        this.logger.debug(
          `Raw published [${routingKey}] to exchange [${this.exchange}]`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to raw publish [${routingKey}]`,
          (err as Error).message,
        );
      }
    }
  }

  /**
   * Émis quand un nouvel Appel d'Offres est créé.
   * Consommateurs : Audit
   */
  publishAoCreated(payload: AoCreatedPayload): void {
    this.logger.log(`📢 EMIT ao.created — AO: ${payload.aoId}`);
    this.client.emit('ao.created', payload);
    this.publishRaw('ao.created', payload);
  }

  /**
   * Émis quand un AO passe au statut PUBLIE.
   * Consommateurs : Notifications (tous les OE), Audit
   */
  publishAoPublished(payload: AoPublishedPayload): void {
    this.logger.log(`📢 EMIT ao.published — AO: ${payload.aoId}`);
    this.client.emit('ao.published', payload);
    this.publishRaw('ao.published', payload);
  }

  /**
   * Émis à chaque changement de statut (toujours, quel que soit le nouveau statut).
   * Consommateurs : Audit
   */
  publishAoStatusChanged(payload: AoStatusChangedPayload): void {
    this.logger.log(
      `📢 EMIT ao.status_changed — AO: ${payload.aoId} | ${payload.ancienStatut} → ${payload.nouveauStatut}`,
    );
    this.client.emit('ao.status_changed', payload);
    this.publishRaw('ao.status_changed', payload);
  }

  /**
   * Émis quand l'AO passe au statut ATTRIBUE (attribution provisoire).
   * Lance le timer légal de 10 jours (Art. 83 Loi 23-12).
   * Consommateurs : Notifications (tous les soumissionnaires), Recours Service
   */
  publishAttributionProvisoire(payload: AoAttributionProvisoirePayload): void {
    this.logger.log(
      `📢 EMIT ao.attribution.provisoire — AO: ${payload.aoId} | Fin recours: ${payload.dateFinRecours.toISOString()}`,
    );
    this.client.emit('ao.attribution.provisoire', payload);
    this.publishRaw('ao.attribution.provisoire', payload);
  }

  /**
   * Émis quand le timer de recours expire (AO → CLOTURE = attribution définitive).
   * Consommateurs : Notifications, Audit
   */
  publishAttributionDefinitive(payload: AoAttributionDefinitivePayload): void {
    this.logger.log(`📢 EMIT ao.attribution.definitive — AO: ${payload.aoId}`);
    this.client.emit('ao.attribution.definitive', payload);
    this.publishRaw('ao.attribution.definitive', payload);
  }

  /**
   * Émis quand un AO est annulé.
   * Consommateurs : Notifications, Audit
   */
  publishAoAnnule(payload: AoAnnulePayload): void {
    this.logger.log(`📢 EMIT ao.annule — AO: ${payload.aoId}`);
    this.client.emit('ao.annule', payload);
    this.publishRaw('ao.annule', payload);
  }

  /**
   * Émis quand une demande de gré-à-gré est soumise (Phase 6).
   * Consommateurs : IA Service (analyse de conformité)
   */
  publishGreAGreSubmitted(payload: AoGreAGreSubmittedPayload): void {
    this.logger.log(
      `📢 EMIT ao.gre_a_gre.submitted — GAG: ${payload.gagId} | AO: ${payload.aoId}`,
    );
    this.client.emit('ao.gre_a_gre.submitted', payload);
    this.publishRaw('ao.gre_a_gre.submitted', payload);
  }
  /**
   * Émis quand une demande de gré-à-gré est validée (Approuvée / Rejetée) par le contrôleur (Phase 6).
   * Consommateurs : Notifications (Service Contractant)
   */
  publishGreAGreValidated(payload: AoGreAGreValidatedPayload): void {
    this.logger.log(
      `📢 EMIT ao.gre_a_gre.validated — GAG: ${payload.gagId} | AO: ${payload.aoId} | DECISION: ${payload.decision}`,
    );
    this.client.emit('ao.gre_a_gre.validated', payload);
    this.publishRaw('ao.gre_a_gre.validated', payload);
  }

  /**
   * Émis quand une réponse est apportée à une demande de clarification (Phase 5).
   * Consommateurs : Notifications
   */
  publishClarificationRepondue(payload: AoClarificationReponduePayload): void {
    this.logger.log(
      `📢 EMIT ao.clarification.repondue — AO: ${payload.aoId} | Clarification: ${payload.clarificationId}`,
    );
    this.client.emit('ao.clarification.repondue', payload);
    this.publishRaw('ao.clarification.repondue', payload);
  }
}

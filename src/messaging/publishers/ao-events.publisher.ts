import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { StatutAO } from '@prisma/client';

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

// ─── Publisher ────────────────────────────────────────────────────────────────

@Injectable()
export class AoEventsPublisher {
  private readonly logger = new Logger(AoEventsPublisher.name);

  constructor(
    @Inject('RABBITMQ_EVENT_BUS') private readonly client: ClientProxy,
  ) {}

  /**
   * Émis quand un nouvel Appel d'Offres est créé.
   * Consommateurs : Audit
   */
  publishAoCreated(payload: AoCreatedPayload): void {
    this.logger.log(`📢 EMIT ao.created — AO: ${payload.aoId}`);
    this.client.emit('ao.created', payload);
  }

  /**
   * Émis quand un AO passe au statut PUBLIE.
   * Consommateurs : Notifications (tous les OE), Audit
   */
  publishAoPublished(payload: AoPublishedPayload): void {
    this.logger.log(`📢 EMIT ao.published — AO: ${payload.aoId}`);
    this.client.emit('ao.published', payload);
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
  }

  /**
   * Émis quand le timer de recours expire (AO → CLOTURE = attribution définitive).
   * Consommateurs : Notifications, Audit
   */
  publishAttributionDefinitive(payload: AoAttributionDefinitivePayload): void {
    this.logger.log(`📢 EMIT ao.attribution.definitive — AO: ${payload.aoId}`);
    this.client.emit('ao.attribution.definitive', payload);
  }

  /**
   * Émis quand un AO est annulé.
   * Consommateurs : Notifications, Audit
   */
  publishAoAnnule(payload: AoAnnulePayload): void {
    this.logger.log(`📢 EMIT ao.annule — AO: ${payload.aoId}`);
    this.client.emit('ao.annule', payload);
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
  }
}

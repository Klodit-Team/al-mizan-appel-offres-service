# Phase 5 : Messagerie Asynchrone (RabbitMQ) 🐇

L'objectif de cette phase est de décoder le système de messagerie asynchrone pour la communication inter-services. Le CSL spécifie que les services (Notification, Audit, Recours) écoutent / publient des évènements pour agir de manière non bloquante.

## 🎯 Ce que tu dois accomplir :

1.  **Génération du Module :**
    *   Exécuter : `nest g module messaging`
    *   Exécuter : `nest g service messaging/publishers/ao-events.publisher`
    *   Exécuter : `nest g controller messaging/consumers/recours.consumer` (NestJS écoute via les contrôleurs).

2.  **Configuration des Émissions (Publisher) :**
    *   Il faut l'injecter le `RABBITMQ_EVENT_BUS` (Microservice ClientProxy configuré dans `app.module.ts`).
    *   Méthode `publishAoCreated(aoId, ref)` : Emet `{ pattern: 'ao.created', data: {id, ref, date} }`.
    *   Méthode `publishAoPublished(aoId, ref, timeout)` : Informe _Notif_ et _Audit_.
    *   Méthode `publishAttributionProvisoire(aoId, winnerId)` : Emet vers `ao.attribution.provisoire` pour lancer le timer légal des recours.

3.  **Liaison des Publishers au Cœur Métier (AppelOffresService) :**
    *   Dans ton API, lorsqu'on bascule un statut de `BROUILLON` à `PUBLIE`, appeler `this.aoEventsPublisher.publishAoPublished(...)`.
    *   Si le Publish échoue, la transaction locale ne doit pas planter (C'est l'essence du RabbitMQ Fire & Forget dans une approche non critique).

4.  **Écoute d'un Événement Externe (Consumer) :**
    *   Ouvrir `recours.consumer.ts`.
    *   Annoter la route avec `@MessagePattern('recours.periode.expired')` (RabbitMQ Topic / Routing Key).
    *   Ce message est (théoriquement) émis par un timer du Service Recours.
    *   Action : Extraire l'`ao_id` de la Payload RabbitMQ, aller chercher l'Appel d'Offres PostgreSQL, et auto-valider l'attribution (Status: `ATTRIBUTION_DEFINITIVE`).

## 🛠️ Outils NestJS à utiliser :
*   Le client `ClientProxy` typique `@nestjs/microservices`.
*   Le mapping `@MessagePattern()` ou `@EventPattern()` avec `@Payload()`.
*   Le pattern architectural "Saga" basique (on débloque un processus uniquement si on reçoit l'événement).

## ✅ Critère de validation :
Depuis l'interface d'administration de ton RabbitMQ (http://localhost:15672 - admin/guest), tu dois brancher ta queue `ao.events`. Lorsque tu fais l'API POST sur Swagger pour publier un AO, tu dois voir la création de la payload RabbitMQ JSON propre. A l'inverse, si tu assembles manuellement un JSON `{ "aoId": "..." }` sur l'Exchange "Recours" depuis RabbitMQ, ton serveur NestJs doit logguer qu'il débloque l'Attribution Définitive et met à jour PostgreSQL.

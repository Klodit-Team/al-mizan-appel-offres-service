# Phase 5 : Messagerie Asynchrone avec RabbitMQ 🐇

La dernière étape d'un composant majeur est de prévenir le reste du Système d'Information que quelque chose vient de se passer.

Le microservice `Appel d'Offres` est le chef d'orchestre de la Phase 1 et 2 du processus métier. Quand il publie un marché ou prononce une attribution, les autres microservices (comme `Notification`, `Audit`, ou `Soumission`) doivent réagir. Mais il **ne doit pas** les attendre de manière synchrone, sinon c'est toute la plateforme qui sera lente.

---

## 🎯 Ce que tu dois accomplir :

### 1. Configuration du Client RabbitMQ

Tu as déjà injecté `RABBITMQ_EVENT_BUS` dans `app.module.ts`.
On l'utilisera dans le `AppelOffresService`.
**L'Exchange cible :**

- `RABBITMQ_EXCHANGE_AO=ao.events`
- Mais au lieu d'utiliser RabbitMQ nativement, NestJS fournit un wrapper extrêmement puissant avec le module `@nestjs/microservices`.

### 2. Émettre l'Event `ao.published` 📢

Le Service Contractant vient de cliquer sur "Publier" (en Phase 2). La base de données Prisma a été mise à jour avec `statut: PUBLIE`.

1. Injecte via Constructeur le `@Inject('RABBITMQ_EVENT_BUS') client: ClientProxy`.
2. Appelle `this.client.emit('ao.published', { aoId: "UUID-HERE", ref: "A-2025-01", date: new Date() })`.
3. Cette action envoie silencieusement un JSON dans RabbitMQ à destination du Microservice `NotificationService` qui va spammer la boite mail de tous les OE d'Algérie !

### 3. Cycle de Vie Asynchrone Complet : Attributions

Tu dois aussi émettre deux autres événements :

- `ao.attribution.provisoire` : Lors de la modification de l'AO. Cet événement informe le module _Recours_ de lancer son timer légal de 10 jours.
- `ao.attribution.definitive` : Le contrat finalisé, prêt à être instancié dans sa table `Marche` (Prisma) !

### 4. Réception Asynchrone (Consumer) 🎧

Le Microservice Recours (qui n'est pas le nôtre) va lancer un timer de 10 jours. Quand ce timer se termine, il renvoie un évènement à tout le système : `recours.periode.expired`.

1. Dans ton `AppelOffresController`, ajoute la méthode décorée :
   ```typescript
   @EventPattern('recours.periode.expired')
   async handleRecoursExpired(data: { aoId: string }) { ... }
   ```
2. Lorsqu'il reçoit ce message, le service AO doit automatiquement mettre à jour sa base Prisma pour déverrouiller le marché et autoriser l'Attribution Définitive, selon le cycle légal de la BDD.

---

## 🛠️ Outils NestJS & RabbitMQ à utiliser :

- `ClientProxy` de `@nestjs/microservices` pour envoyer l'Event asynchrone sans attendre de réponse de TCP HTTP (`.emit`).
- `@EventPattern('topic.name')` sur les Contrôleurs pour écouter.

## ✅ Critère de validation :

Une fois le `AppelOffresService` mis à jour :

1. Ouvre l'interface native de ton RabbitMQ local : `http://localhost:15672/` (guest/guest).
2. Lance Swagger, publie un Appel d'Offres (Passe de `BROUILLON` à `PUBLIE` via ton point de chute PATCH `/statut`).
3. Rafraîchis RabbitMQ. Dans la section "Queues" de RabbitMQ, tu devrais voir arriver 1 message `{"pattern":"ao.published","data":...}` prêt à être consommé par la grappe applicative.

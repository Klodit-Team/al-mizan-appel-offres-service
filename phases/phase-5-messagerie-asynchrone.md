# Phase 5 : Messagerie Asynchrone avec RabbitMQ 🐇

Le microservice `Appel d'Offres` est le chef d'orchestre du processus métier Al-Mizan. Quand il publie un marché, prononce une attribution ou annule un AO, les autres microservices (`Notification`, `Audit`, `Recours`, `IA`) doivent réagir — de manière **asynchrone**, sans bloquer la requête HTTP.

---

## 📁 Architecture choisie : Pattern Publisher / Consumer

Au lieu de mettre les `client.emit()` directement dans `AppelOffresService`, la logique de messagerie est **isolée** dans le dossier `src/messaging/` :

```
src/
  messaging/
    publishers/
      ao-events.publisher.ts     ← Classes qui émettent les événements (7 méthodes typées)
    consumers/
      recours.consumer.ts        ← Handlers qui reçoivent les événements entrants (2 handlers)
    messaging.module.ts          ← Module NestJS qui exporte le Publisher
```

**Avantages :**
- `AppelOffresService` ne connaît aucun détail RabbitMQ — il appelle juste `publisher.publishAoPublished(...)`.
- Le publisher est **mockable** dans les tests unitaires.
- Les consumers sont regroupés dans un seul fichier, facile à maintenir.

---

## 📡 Vision complète : Tous les événements de ce microservice

### Événements **publiés** (ce service → les autres)

| Méthode Publisher | Routing Key | Déclencheur dans le code | Consommateurs |
|---|---|---|---|
| `publishAoCreated` | `ao.created` | `AppelOffresService.create()` | Audit |
| `publishAoPublished` | `ao.published` | `updateStatut()` → `PUBLIE` | Notifications, Audit |
| `publishAoStatusChanged` | `ao.status_changed` | `updateStatut()` (tout changement) | Audit |
| `publishAttributionProvisoire` | `ao.attribution.provisoire` | `updateStatut()` → `ATTRIBUE` | Notifications, Recours |
| `publishAttributionDefinitive` | `ao.attribution.definitive` | Consumer `recours.periode.expired` | Notifications, Audit |
| `publishAoAnnule` | `ao.annule` | `updateStatut()` → `ANNULE` | Notifications, Audit |
| `publishGreAGreSubmitted` | `ao.gre_a_gre.submitted` | Phase 6 — Gré-à-Gré | IA Service |

### Événements **consommés** (autres → ce service)

| Handler (`@EventPattern`) | Routing Key | Source | Action déclenchée |
|---|---|---|---|
| `handleRecoursExpired` | `recours.periode.expired` | Recours Service | AO : ATTRIBUE → CLOTURE + émet `ao.attribution.definitive` |
| `handleIaGreAGreScored` | `ia.gre_a_gre.scored` | IA Service | Stocke score IA (Phase 6) |

---

## 🛠️ Étape 1 : Le Publisher (`ao-events.publisher.ts`)

Chaque événement est une **méthode typée** — pas de string magiques dispersées dans le code.

```typescript
// src/messaging/publishers/ao-events.publisher.ts
@Injectable()
export class AoEventsPublisher {
  constructor(
    @Inject('RABBITMQ_EVENT_BUS') private readonly client: ClientProxy,
  ) {}

  publishAoCreated(payload: AoCreatedPayload): void {
    this.client.emit('ao.created', payload);
  }

  publishAoPublished(payload: AoPublishedPayload): void {
    this.client.emit('ao.published', payload);
  }

  publishAoStatusChanged(payload: AoStatusChangedPayload): void {
    this.client.emit('ao.status_changed', payload);
  }

  publishAttributionProvisoire(payload: AoAttributionProvisoirePayload): void {
    this.client.emit('ao.attribution.provisoire', payload);
  }

  publishAttributionDefinitive(payload: AoAttributionDefinitivePayload): void {
    this.client.emit('ao.attribution.definitive', payload);
  }

  publishAoAnnule(payload: AoAnnulePayload): void {
    this.client.emit('ao.annule', payload);
  }

  publishGreAGreSubmitted(payload: AoGreAGreSubmittedPayload): void {
    this.client.emit('ao.gre_a_gre.submitted', payload);
  }
}
```

---

## 🛠️ Étape 2 : L'AppelOffresService utilise le Publisher

Le service **ne connaît plus** `ClientProxy` — il injecte seulement `AoEventsPublisher`.

```typescript
// src/modules/appel-offres/appel-offres.service.ts
@Injectable()
export class AppelOffresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly publisher: AoEventsPublisher,  // ← plus de ClientProxy ici
  ) {}

  async create(dto: CreateAppelOffreDto) {
    const ao = await this.prisma.appelOffres.create({ data: dto });

    // 📢 Événement ao.created
    this.publisher.publishAoCreated({
      aoId: ao.id,
      typeProcedure: ao.typeProcedure,
      objet: ao.objet,
      createdAt: ao.createdAt,
    });
    return ao;
  }

  async updateStatut(id: string, nouveauStatut: StatutAO) {
    const ao = await this.findOne(id);
    // ... (validation machine à états)

    const updated = await this.prisma.appelOffres.update({
      where: { id },
      data: { statut: nouveauStatut },
    });

    // 📢 Toujours émis : changement de statut pour l'Audit
    this.publisher.publishAoStatusChanged({
      aoId: id,
      ancienStatut: ao.statut,
      nouveauStatut,
      changedAt: new Date(),
    });

    // 📢 Événements métier selon le nouveau statut
    if (nouveauStatut === StatutAO.PUBLIE) {
      this.publisher.publishAoPublished({
        aoId: id, reference: ao.reference, objet: ao.objet, datePublication: new Date(),
      });
    }
    if (nouveauStatut === StatutAO.ATTRIBUE) {
      const dateFinRecours = new Date();
      dateFinRecours.setDate(dateFinRecours.getDate() + 10); // Art. 83 Loi 23-12
      this.publisher.publishAttributionProvisoire({ aoId: id, dateFinRecours });
    }
    if (nouveauStatut === StatutAO.ANNULE) {
      this.publisher.publishAoAnnule({ aoId: id, annuleAt: new Date() });
    }

    return updated;
  }
}
```

---

## 🛠️ Étape 3 : Les Consumers (`recours.consumer.ts`)

Les consumers utilisent le décorateur `@EventPattern` de NestJS Microservices.

```typescript
// src/messaging/consumers/recours.consumer.ts
@Controller()
export class RecoursConsumer {
  constructor(
    private readonly appelOffresService: AppelOffresService,
    private readonly publisher: AoEventsPublisher,
  ) {}

  @EventPattern('recours.periode.expired')
  async handleRecoursExpired(@Payload() data: { aoId: string }): Promise<void> {
    const ao = await this.appelOffresService.findOne(data.aoId);

    // Ne traiter que les AO en attente d'attribution définitive
    if (ao.statut !== StatutAO.ATTRIBUE) return;

    // ATTRIBUE → CLOTURE (Attribution Définitive légale)
    await this.appelOffresService.updateStatut(data.aoId, StatutAO.CLOTURE);

    // 📢 Notifier le SI
    this.publisher.publishAttributionDefinitive({
      aoId: data.aoId,
      clotureAt: new Date(),
    });
  }

  @EventPattern('ia.gre_a_gre.scored')
  async handleIaGreAGreScored(@Payload() data: {
    gagId: string;
    scoreConformite: number;
    recommandation: 'APPROUVER' | 'REJETER';
  }): Promise<void> {
    // TODO Phase 6 : Stocker le score IA dans demande_gre_a_gre
    console.log('Score IA reçu :', data);
  }
}
```

---

## 🛠️ Étape 4 : Enregistrement dans les Modules

### `messaging.module.ts` — Exporte le Publisher
```typescript
@Module({
  imports: [ClientsModule.registerAsync([{ name: 'RABBITMQ_EVENT_BUS', ... }])],
  providers: [AoEventsPublisher],
  exports: [AoEventsPublisher],  // ← clé : exporté pour être injecté ailleurs
})
export class MessagingModule {}
```

### `appel-offres.module.ts` — Importe MessagingModule + enregistre le Consumer
```typescript
@Module({
  imports: [PrismaModule, StorageModule, MessagingModule],
  controllers: [
    AppelOffresController,
    RecoursConsumer, // ← Consumer comme controller (car il a besoin d'AppelOffresService)
  ],
  providers: [AppelOffresService],
  exports: [AppelOffresService],
})
export class AppelOffresModule {}
```

> **Pourquoi `RecoursConsumer` est dans `AppelOffresModule` et pas dans `MessagingModule` ?**
> Pour éviter une **dépendance circulaire** : si `MessagingModule` importait `AppelOffresModule` et `AppelOffresModule` importait `MessagingModule`, NestJS tournerait en boucle. En plaçant le consumer dans `AppelOffresModule`, il a accès à `AppelOffresService` sans créer de cycle.

---

## 🛠️ Étape 5 : Mode Hybride dans `main.ts`

Pour que `@EventPattern` soit actif, l'app doit écouter **à la fois** HTTP et RabbitMQ.

```typescript
// src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Connecter le consumer RabbitMQ
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672'],
      queue: process.env.RABBITMQ_QUEUE_AO ?? 'ao.queue',
      queueOptions: { durable: true },
      noAck: false, // Accusé de réception manuel
    },
  });

  // ... (helmet, ValidationPipe, Swagger, etc.)

  await app.startAllMicroservices(); // ← démarre le consumer RabbitMQ
  await app.listen(8003);            // ← démarre le serveur HTTP
}
```

---

## ✅ Critères de validation

### Test 1 : Vérifier l'émission d'événements en local

1. Lance Docker : `docker compose up -d rabbitmq`
2. Ouvre l'UI RabbitMQ : [http://localhost:15672](http://localhost:15672) (guest / guest)
3. Va dans **Queues** → clique sur `ao.queue`
4. Via Swagger (`http://localhost:8003/api/docs`), crée un AO
5. Dans RabbitMQ → **Get Messages**, tu dois voir :
   - `{"pattern":"ao.created","data":{...}}`
6. Passe le statut à `PUBLIE` via `PATCH /appel-offres/:id/statut`
7. Tu dois voir 2 nouveaux messages :
   - `{"pattern":"ao.status_changed","data":{...}}`
   - `{"pattern":"ao.published","data":{...}}`

### Test 2 : Vérifier la réception (Consumer actif)

Depuis l'UI RabbitMQ → **Queues** → `ao.queue` → **Publish Message** :
```json
{
  "pattern": "recours.periode.expired",
  "data": { "aoId": "UUID-DE-TON-AO-EN-STATUT-ATTRIBUE" }
}
```
Vérifie dans les logs NestJS que le handler est déclenché et que le statut passe à `CLOTURE`.

---

## 📋 Récapitulatif des fichiers modifiés

| Fichier | Rôle |
|---|---|
| `src/messaging/publishers/ao-events.publisher.ts` | **NOUVEAU** — Publisher avec 7 méthodes typées |
| `src/messaging/consumers/recours.consumer.ts` | **NOUVEAU** — 2 handlers `@EventPattern` |
| `src/messaging/messaging.module.ts` | **NOUVEAU** — Module qui exporte le Publisher |
| `src/modules/appel-offres/appel-offres.service.ts` | **MODIFIÉ** — Injecte `AoEventsPublisher`, émet tous les événements |
| `src/modules/appel-offres/appel-offres.module.ts` | **MODIFIÉ** — Importe `MessagingModule`, déclare `RecoursConsumer` |
| `src/app.module.ts` | **MODIFIÉ** — Importe `MessagingModule` au niveau global |
| `src/main.ts` | **MODIFIÉ** — Mode hybride (HTTP + RabbitMQ consumer) |

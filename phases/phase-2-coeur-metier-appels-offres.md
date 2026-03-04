# Phase 2 : Cœur Métier des Appels d'Offres (CRUD & Machine à États) 🏢

Maintenant que notre base de données est solide et gérée par Prisma (Phase 1), nous allons construire le moteur principal du microservice : la gestion du cycle de vie d'un **Appel d'Offres**.

Ce module sera responsable de la création, de la lecture, de la mise à jour (notamment les statuts) et de la suppression logique d'un Appel d'Offres.

---

## 🎯 Ce que tu dois accomplir :

### 1. Génération du Module de base

Utilise le CLI NestJS pour générer tout le squelette (Module, Controller, Service, DTOs). Dans ton terminal, tape :

```bash
npx nest g res modules/appel-offres
```

- _Transport layer ?_ -> Choisis **REST API**.
- _Generate CRUD entry points ?_ -> Choisis **Yes** (Y).

NestJS va créer un dossier `src/modules/appel-offres/` avec tous les fichiers nécessaires.

### 2. Validation des Entrées (Les DTOs)

Dans le dossier `src/modules/appel-offres/dto/`, modifie le fichier `create-appel-offre.dto.ts`.
C'est ici que tu vas bloquer les mauvaises requêtes envoyées par le frontend.
Utilise `class-validator` pour t'assurer que les données sont conformes à la BDD Prisma.

**Exemple de ce que tu dois coder pour `CreateAppelOffreDto` :**

- `reference`: `@IsString()`, `@IsNotEmpty()`
- `objet`: `@IsString()`, `@IsNotEmpty()`
- `typeProcedure`: `@IsEnum(TypeProcedure)` _(Importe l'enum depuis `@prisma/client` !)_
- `montantEstime`: `@IsNumber()`, `@IsPositive()`
- `dateLimiteSoumission`: `@IsDateString()`
- `wilaya`: `@IsString()`
- `secteurActivite`: `@IsString()`

_Rappel : N'oublie pas d'ajouter les décorateurs Swagger (`@ApiProperty()`) sur chaque propriété pour que la doc se génère !_

### 3. Le Service Principal (`appel-offres.service.ts`)

C'est le cerveau de cette phase.

1. **Importe le PrismaService** : Injecte `PrismaService` dans le constructeur de ton `AppelOffresService`.
2. **Implémente les méthodes CRUD** :
   - `create()` : Fais un `this.prisma.appelOffres.create({ data: createDto })`.
   - `findAll()` : Fais un `this.prisma.appelOffres.findMany()`. Tu pourras ajouter de la pagination plus tard.
   - `findOne(id)` : Fais un `this.prisma.appelOffres.findUnique()`. S'il n'existe pas, lance une `NotFoundException('AO non trouvé')`.
3. **Implémente la Machine à États (`updateStatut`)** :
   - Crée une fonction spécifique `changerStatut(id: string, nouveauStatut: StatutAO)`.
   - **Règle métier vitale :** Un statut ne peut changer que dans un ordre précis.
     _Exemple : On ne peut passer à `OUVERTURE_PLIS` que si on était en `EN_COURS` ou `PUBLIE`._
   - Fais un `this.prisma.appelOffres.update({ data: { statut: nouveauStatut } })` uniquement si la règle est respectée.

### 4. Le Contrôleur (`appel-offres.controller.ts`)

Vérifie que le contrôleur généré par NestJS appelle bien les bonnes méthodes de ton Service.
Ajoute un Endpoint personnalisé (ex: `@Patch(':id/statut')`) pour appeler ta fonction `changerStatut`.

---

## 🛠️ Outils NestJS/Prisma à utiliser :

- L'import Prisma : `import { PrismaService } from 'src/prisma/prisma.service';`
- Les Enums Prisma : `import { StatutAO, TypeProcedure } from '@prisma/client';`
- La Gestion d'erreurs NestJS : `throw new BadRequestException("Transition de statut interdite");`

## ✅ Critère de validation :

1. Lance `npm run start:dev`.
2. Ouvre Swagger (`http://localhost:8003/api/docs`).
3. Ouvre l'accordéon **Appel-offres**.
4. Teste l'endpoint `POST /appel-offres` en envoyant un JSON valide. Tu dois recevoir un code HTTP `201 Created` avec l'ID généré par PostgreSQL !
5. Essaie d'envoyer un `montantEstime` négatif, le serveur doit te rejeter avec une erreur `400 Bad Request`.

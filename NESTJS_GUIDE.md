# 📘 Guide Complet : Apprendre et Coder avec NestJS (Edition Prisma)

NestJS est un framework Node.js (TypeScript) conçu pour créer des applications backend **scalables, testables et maintenables**. Il s'inspire très fortement de l'architecture d'Angular.

Si vous venez d'Express.js, Laravel ou Spring Boot, vous retrouverez très vite vos marques grâce à son approche basée sur les **Classes**, les **Décorateurs** (`@quelqueChoise`) et l'**Injection de Dépendances**.

---

## 1. 🧱 Les Concepts Fondamentaux (Les 3 Piliers)

Dans NestJS, l'application est un **arbre de Modules**. Chaque fonctionnalité (ex: les appels d'offres, les utilisateurs) possède son propre Module.

Un Module classique est toujours composé de 3 fichiers principaux :

### A. Le Contrôleur (`.controller.ts`) 🚦

**Rôle :** C'est la porte d'entrée. Il intercepte les requêtes HTTP (`GET`, `POST`), extrait les paramètres (l'URL, le corps de la requête) et **délègue** le travail au Service. Il ne doit **jamais** contenir de logique métier.

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users') // Définit que toutes les routes ici commencent par /users
export class UsersController {
  // Le constructeur reçoit le Service automatiquement (Injection)
  constructor(private readonly usersService: UsersService) {}

  @Get() // GET /users
  findAll() {
    return this.usersService.recupererToutLeMonde();
  }

  @Get(':id') // GET /users/123
  findOne(@Param('id') id: string) {
    // @Param extrait l'ID de l'URL
    return this.usersService.trouverUnSeul(id);
  }

  @Post() // POST /users
  create(@Body() userData: CreateUserDto) {
    // @Body extrait le JSON envoyé
    return this.usersService.creerQuelquun(userData);
  }
}
```

### B. Le Service (`.service.ts` ou Provider) 🧠

**Rôle :** C'est le cerveau de l'application (la logique métier). C'est ici que l'on vérifie si un utilisateur a le droit de faire une action, qu'on fait des calculs, et qu'on interroge la base de données via Prisma. Il est annoté avec `@Injectable()`.

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async recupererToutLeMonde() {
    return this.prisma.user.findMany();
  }

  async trouverUnSeul(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur ${id} n'existe pas`);
    }
    return user;
  }
}
```

### C. Le Module (`.module.ts`) 📦

**Rôle :** C'est la boîte qui regroupe le Contrôleur et le Service, pour les déclarer ensemble et pouvoir les lier au reste de l'application.

```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

---

## 2. 🪄 Le CLI : Générer le code sans effort

Vous ne devez **jamais** créer les dossiers et les fichiers à la main. NestJS possède un CLI puissant.

Pour créer une fonctionnalité complète (le Module + Service + Controller + Fichiers de test), tapez dans votre terminal :

```bash
nest generate resource nom-du-module
# ou pour aller plus vite :
nest g res nom-du-module
```

_Le CLI vous demandera si c'est une API REST (répondez Oui) et s'il faut générer les opérations CRUD de base (répondez Oui)._

---

## 3. 🗄️ Base de données (Moderne avec Prisma)

Fini les fichiers `.entity.ts` et les décorateurs `@Column` sur chaque champ TypeScript ! Prisma centralise tout dans `prisma/schema.prisma`.

### Étape 1 : Le Schéma

Vous décrivez vos tables dans le fichier `prisma/schema.prisma`.

```prisma
model User {
  id    String @id @default(uuid())
  nom   String
  email String @unique
}
```

### Étape 2 : Envoyer à la BDD

Tapez cette commande pour créer les tables SQL :

```bash
npx prisma db push
```

### Étape 3 : Utiliser Prisma

Dans vos services NestJS, vous injectez simplement le `PrismaService` pour faire toute votre logique de lecture/écriture. Pas besoin de Repository !

```typescript
// Exemple : Récupérer les 10 derniers utilisateurs actifs
const actifs = await this.prisma.user.findMany({
  where: { estActif: true },
  take: 10,
  orderBy: { createdAt: 'desc' },
});
```

---

## 4. 🛡️ La Validation des Données (DTOs)

Ne faites jamais confiance aux données envoyées par l'utilisateur. Dans NestJS, on utilise des **DTOs** (Data Transfer Objects) couplés à `class-validator`.

```typescript
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsEmail()
  email: string;
}
```

## 5. 📚 Documentation Automatique (Swagger)

Avec `@nestjs/swagger` (déjà installé), votre API (sur `/api/docs`) se documente toute seule avec des décorateurs comme `@ApiProperty()` sur les DTOs ou `@ApiTags()` sur les contrôleurs.

## 🚦 Rappels :

- **Controllers** : Routes HTTP (GET, POST).
- **Services** : Logique métier (calculs, BDD).
- **Prisma** : Connexion à la base PostgreSQL. Pas de fichiers entities.
- **DTOs** : Validation des entrées.
- **Guards** : Authentification et Services sécurisés.

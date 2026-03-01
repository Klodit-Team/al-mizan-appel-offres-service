# Phase 2 : Le Cœur Métier — Gestion de l'Appel d'Offres 🏗️

L'objectif de cette phase est de créer la logique CRUD basique pour un Appel d'Offres et de valider les données entrantes. On va utiliser le module central `appel-offres`.

## 🎯 Ce que tu dois accomplir :

1.  **Génération de l'échafaudage NestJS :**
    *   Exécuter : `nest g module modules/appel-offres`
    *   Exécuter : `nest g service modules/appel-offres`
    *   Exécuter : `nest g controller modules/appel-offres`

2.  **Création des Data Transfer Objects (DTOs) :**
    *   Définir dans `src/modules/appel-offres/dto/create-appel-offre.dto.ts` ce qu'un Service Contractant (SC) doit envoyer lors de la création d'un AO.
    *   Utiliser la librairie `class-validator` : `@IsNotEmpty()`, `@IsString()`, `@IsUUID()`, `@IsPositive()` (pour le montant), `@IsDateString()`, etc.
    *   Utiliser la librairie `@nestjs/swagger` : `@ApiProperty()` pour documenter chaque champ pour Swagger.

3.  **Implémentation du Service Métier (`appel-offres.service.ts`) :**
    *   Injecter le Repository `AppelOffres` (`@InjectRepository(AppelOffres)`).
    *   Créer une méthode `create` : Instancier l'AO, vérifier s'il existe déjà une référence identique, puis le sauvegarder.
    *   Créer une méthode `findAll` pour lister les AOs (avec filtres potentiels par date, type...).
    *   Créer une méthode `findById` : Si l'id n'existe pas, lancer une erreur `NotFoundException`.
    *   Créer une méthode `updateStatus` : Vérifier qu'on respecte la machine à états (ex: impossible de passer de BROUILLON à ATTRIBUE).

4.  **Implémentation du Contrôleur (`appel-offres.controller.ts`) :**
    *   Créer les routes HTTP : `@Post()`, `@Get()`, `@Get(':id')`, `@Patch(':id/status')`.
    *   Annoter chaque route pour Swagger : `@ApiOperation()`, `@ApiResponse()`.
    *   Relier les routes aux méthodes du Service.

## 🛠️ Outils NestJS à utiliser :
*   `class-validator` pour les DTOs
*   `@InjectRepository` de `@nestjs/typeorm`
*   Les exceptions HTTP intégrées (`NotFoundException`, `BadRequestException`)
*   Le module Swagger (`@nestjs/swagger`)

## ✅ Critère de validation :
Tu dois pouvoir envoyer une requête POST depuis Swagger (http://localhost:8003/api/docs) avec un JSON JSON valide pour créer un AO, et obtenir une réponse 201 Created. Une requête avec une référence manquante doit renvoyer une erreur 400 Bad Request automatique (grâce au ValidationPipe de ton main.ts). L'AO doit être visible dans la BDD PostgreSQL.

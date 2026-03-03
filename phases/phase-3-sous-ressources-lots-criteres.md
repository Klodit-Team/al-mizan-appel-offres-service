# Phase 3 : Les Sous-Ressources (Lots & Critères) 📝

L'objectif de cette phase est de permettre au Service Contractant d'ajouter des détails (lots, critères d'éligibilité, critères d'évaluation) à un Appel d'Offres spécifique. L'entité centrale (`AppelOffres`) sera donc parent de ces éléments métiers. 

## 🎯 Ce que tu dois accomplir :

### 1. Génération des Modules
*   `npx nest g res modules/lots` (REST API / Y)
*   `npx nest g res modules/criteres-eligibilite` (REST API / Y)
*   `npx nest g res modules/criteres-evaluation` (REST API / Y)
    
### 2. Gestion des Lots (Découpage de l'AO)
*   Créer `CreateLotDto` : `numero` (string), `designation` (string), `montantEstime` (number).
*   Créer l'endpoint `POST /api/v1/appels-offres/:aoId/lots` dans ton `LotsController`.
*   *Règle métier* : Un AO ne peut recevoir des lots que s'il est au statut `BROUILLON`. Teste l'état du parent avant création !
*   *Validation* : Si l'AO n'existe pas, renvoyer `404 Not Found`.

### 3. Gestion des Critères d'Éligibilité (Conditions éliminatoires)
*   Créer `CreateCritereEligibiliteDto` : `libelle` (string), `type` (Enum Prisma), `valeurMinimale` (string).
*   Créer l'endpoint `POST /api/v1/appels-offres/:aoId/criteres-eligibilite`.

### 4. Gestion des Critères d'Évaluation (Notation technique et financière)
*   Créer `CreateCritereEvaluationDto` : `libelle` (string), `categorie` (Enum Prisma), `poids` (nombre Float).
*   Créer l'endpoint `POST /api/v1/appels-offres/:aoId/criteres-evaluation`.
*   *Validation Métier stricte (À implémenter dans la Phase 2 lors de la publication)* : La **somme des `poids`** de tous les critères d'évaluation rattachés à un AO/Lot **doit être égale à 100**. Sinon, bloquer la publication avec `400 Bad Request`.

## 🛠️ Outils NestJS & Prisma à utiliser :
*   Les routes imbriquées : `@Controller('appels-offres/:aoId/lots')` ciblant la ressource parent.
*   Les exceptions HTTP : `BadRequestException`, `NotFoundException`.
*   La magie de Prisma : Lors du `findOne` d'un AO dans la Phase 2, on pourra faire `include: { lots: true, criteresEvaluation: true }` pour tout récupérer d'un coup grâce à la modélisation parfaite de Prisma !

## ✅ Critère de validation :
Depuis Swagger, tu dois pouvoir créer un Appel d'Offres (POST /appels-offres), copier son ID retourné, puis appeler POST `/appels-offres/{aoId}/lots` pour y ajouter des lots. Tu dois pouvoir récupérer l'AO complet (`GET /appels-offres/{aoId}`) et voir le tableau de lots intégré dans la réponse JSON.

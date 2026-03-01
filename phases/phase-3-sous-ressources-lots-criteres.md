# Phase 3 : Les Sous-Ressources (Lots & Critères) 📝

L'objectif de cette phase est de permettre au Service Contractant d'ajouter des détails (lots, critères d'éligibilité, critères d'évaluation) à un Appel d'Offres spécifique. L'entité centrale (`AppelOffres`) sera donc parent de ces éléments métiers. 

## 🎯 Ce que tu dois accomplir :

1.  **Génération des Modules :**
    *   `nest g module modules/lots` / `nest g service modules/lots` / `nest g controller modules/lots`
    *   `nest g module modules/criteres` / `nest g service modules/criteres` / `nest g controller modules/criteres`
    
2.  **Gestion des Lots (Découpage de l'AO) :**
    *   Créer `CreateLotDto` : `numero` (string), `designation` (string), `montant_estime` (number, optionnel).
    *   Créer l'endpoint POST `/api/v1/appels-offres/:id/lots`.
    *   *Règle métier* : Un AO ne peut recevoir des lots que s'il est au statut `BROUILLON`.
    *   *Validation* : Si `AppelOffres(id)` n'existe pas, renvoyer `404 Not Found`.

3.  **Gestion des Critères d'Éligibilité (Conditions éliminatoires) :**
    *   Créer `CreateCritereEligibiliteDto` : `designation` (ex: "Chiffre d'affaire > 50M DZD").
    *   Créer l'endpoint POST `/api/v1/appels-offres/:id/criteres-eligibilite`.

4.  **Gestion des Critères d'Évaluation (Notation technique et financière) :**
    *   Créer `CreateCritereEvaluationDto` : `designation` (string), `ponderation` (nombre de 1 à 100).
    *   Créer l'endpoint POST `/api/v1/appels-offres/:id/criteres-evaluation`.
    *   *Validation Métier stricte* : Lors de la publication de l'AO (Phase 2), la **somme des `ponderation`** de tous les critères d'évaluation rattachés **doit être égale à 100**. Sinon, bloquer la publication avec `400 Bad Request`.

## 🛠️ Outils NestJS à utiliser :
*   Les routes imbriquées dans les `@Controller('appels-offres/:id/lots')` pour cibler la ressource parent.
*   Les exceptions HTTP (`BadRequestException`, `NotFoundException`).
*   L'utilisation massive du `@Param('id', ParseUUIDPipe) aoId: string` pour extraire l'ID de l'URL proprement.

## ✅ Critère de validation :
Depuis Swagger, tu dois pouvoir créer un Appel d'Offres (POST /appels-offres), copier son ID retourné, puis appeler POST `/appels-offres/{id}/lots` pour y ajouter des lots. Les lots doivent s'afficher en base PostgreSQL de données liés avec `appel_offres_id`. Tu dois pouvoir récupérer l'AO complet (`GET /appels-offres/{id}`) et y voir le tableau de lots (utilisation de `relations: ['lots']` dans TypeORM).

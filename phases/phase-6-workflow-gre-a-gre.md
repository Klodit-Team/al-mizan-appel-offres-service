# Phase 6 : Tolérance de Sécurité et Gré-à-Gré (Mock IA) 🤖

L'objectif final de cette phase d'Initialisation Avancée, exigée par le CSL, est de mettre en œuvre deux aspects clés de ton projet : la sécurité des rôles RBAC (Role-Based Access Control) et une démonstration de l'outil d'Intelligence Artificielle "Scores" via un mock AI.

## 🎯 Ce que tu dois accomplir :

1.  **Tolérance et Authentification JWT & RBAC :**
    *   Créer `src/common/guards/auth.guard.ts` (vérifie que le Bearer token JWT existe dans la requête). Dans la vraie vie, l'API Gateway le ferait / ou ce module vérifierait la signature JWT. C'est juste un Mock basique.
    *   Créer le décorateur métier `src/common/decorators/roles.decorator.ts`.
    *   Créer `src/common/guards/roles.guard.ts` pour parser le Mock JWT qui contiendra `user.roles: ['SERVICE_CONTRACTANT']`.
    *   Protéger toutes les routes de création/modification de ton API (`@Post`, `@Patch`, `@Delete`) avec : `@UseGuards(AuthGuard, RolesGuard)` et `@Roles(Role.SERVICE_CONTRACTANT)`.
    *   Laisser la route de liste `GET /appels-offres` ouverte au public ou limitée en fonctionnalités.

2.  **Gestion du Cas Spécial "Gré-à-Gré" :**
    *   C'est la procédure "Dérogatoire" de marché public en urgence. US 11, 12, 13 du CSL!
    *   Générer `nest g module modules/gre-a-gre`
    *   Créer l'entité PostgreSQL `DemandeGreAGre` (`ao_id`, `justification_urgence`, `score_ia_conformite`, `statut_validation`).
    *   Créer un endpoint POST `/gre-a-gre/soumission`.

3.  **L'outil "Détection Anomalies IA" (Mock) :**
    *   Un grand pan de "Al-Mizan" est l'IA pour la lutte anti-corruption...
    *   Créer un Service `mock-ia.service.ts` qui analyse le JSON d'une "DemandeGreAGre".
    *   Ce service va créer un "Score IA Conformité" aléatoire entre `0%` et `100%`.
    *   Si le Score est > `85%`, l'IA marque la demande comme recommandée pour validation. Si Score < 85%, elle donne l'alerte. Mettre à jour la base PostgreSQL.
    *   Seul le Rôle `CONTROLEUR` a accès à Endpoint `PATCH /gre-a-gre/{id}/validation` pour ignorer l'IA et valider manuellement, ou rejeter la demande d'attribution forcée de l'entreprise visée.

## 🛠️ Outils NestJS à utiliser :
*   Les Gardiens de Routage (Guards NestJS) et la Réflexion Métadonnées (`Reflector`).
*   Des faux JSON Web Tokens (sans base SQL Secours auth) en testant "Mock Roles".
*   Les contrôleurs spécifiques "Controllers".

## ✅ Critère de validation :
Une requête en "Role" CONTROLEUR sur Création AO doit prendre un 403 Forbidden. Un "Service Contractant" soumet sa justification d'Ao Urgence. L'API retourne `{ id: X, scoreIa: "78%", status: "EN_ATTENTE_CONTROLEUR" }` (Simulant l'IA Analytique qui prend le relais du traitement). Le Contrôleur force la main en Patch `/validation` pour générer un attribution forcée sur le marché gré-à-gré. 

🚀 **Félicitations, l'intégralité du cycle de ton CSL (Analyse & Processus 1 - 6) sera développé en respectant ton Backend NestJS Clean Architecture !**

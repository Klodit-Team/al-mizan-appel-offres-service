# Phase 6 : Tolérance Zéro (Workflows Experts, IA & Sécurité RBAC) 🛡️

Le microservice `Appel d'Offres` est le coffre-fort des marchés publics. 
Dans les phases précédentes, tout était "ouvert" (sans authentification ni JWT) pour nous permettre de développer et tester rapidement avec Swagger.

Maintenant, nous allons le fermer avec un cadenas de haute sécurité (RBAC - Role-Based Access Control) et y intégrer les procédures complexes définies par KLODIT, comme le "Gré-à-Gré".

---

## 🎯 Ce que tu dois accomplir :

### 1. Sécurité RBAC (`Role-Based Access Control`)
1.  **Désactivation des endpoints publics :** Par défaut, un Microservice devrait interdire toutes ses requêtes.
2.  **Créer un Décorateur `@Roles()` personnalisé :** 
    Exemple de rôles valides : `ADMIN`, `SERVICE_CONTRACTANT`, `OPERATEUR_ECONOMIQUE`, `CONTROLEUR`, `PUBLIC`.
3.  **Implémenter le `RolesGuard` :** Ce filtre (Guard) intercepte le `headers.authorization` JWT (token) envoyé par le Microservice `Auth`. Il le décode, vérifie le rôle du propriétaire, et laisse passer **OU** rejette avec `403 Forbidden`.
4.  **Application métier :**
    - `POST /appels-offres` : Réservé au `@Roles(Role.SERVICE_CONTRACTANT)`.
    - `PATCH /appels-offres/:id/statut` : Réservé au `SERVICE_CONTRACTANT`.
    - `GET /appels-offres/:id/cdc/download` : Réservé à l'`OPERATEUR_ECONOMIQUE`.
    - `GET /appels-offres` : Ouvert au `@Roles(Role.PUBLIC, Role.OE, Role.SC, Role.ADMIN)`.

### 2. Procédure Gré-à-Gré Assistée par IA 🤖
Si la `TypeProcedure` de l'Appel d'Offre est `GRE_A_GRE` (et NON `AO_OUVERT` défini par défaut dans Prisma), le flux change complètement :
1.  **Création d'un endpoint exclusif :** `POST /api/v1/appels-offres/:id/gre-a-gre/soumettre`.
2.  **Corps de requête (Multimédia) :** Le Service Contractant upload une lettre de `'justification'` + des tableaux de `'pieces_jointes'` MinIO.
3.  **Appel à l'API OCR/NLP Intelligente (Mock) :**
    - Étant donné que tu vas simuler le Microservice NLP de l'ENS, tu vas créer une fonction factice `analyserJustificationIA(texte): { score_conformite_ia: float, recommandation_ia: string }`.
    - Elle analysera le texte (ex: si ça contient les mots "Urgence nationale", "Monopole", score = 95%. Sinon score = 40%).
4.  **Mise à jour Prisma :** Le résultat IA est envoyé et inséré dans la table mère `DemandeGreAGre` (table enfants OneToOne à l'`AppelsOffres`). Le statut passe à `EN_ATTENTE_CONTROLEUR`.
5.  **Dernier mot au Contrôleur :** 
    Endpoint `PATCH /appels-offres/gre-a-gre/:id/valider` protégé par `@Roles(Role.CONTROLEUR)`. Ce n'est pas l'IA qui approuve, c'est l'Humain du Ministère ! Si le contrôleur clique sur `Valider`, l'AO reprendra son cycle traditionnel (`ATTRIBUE`).

---

## 🛠️ Outils NestJS & Sécurité à utiliser :
*   Les **Guards** : `implements CanActivate` pour lire le contexte de la requête Express et bloquer.
*   Les **Decorators Methods** (`SetMetadata`) : Pour envoyer au Guard la liste des rôles de la route actuelle.
*   `Promise.all` et Mock IA pour analyser le dossier de justification.

## ✅ Critère de validation :
Lance ton application, ouvre Postman (ou Swagger) : 
1. Essaie de taper `POST /appels-offres` sans passer ton Token dans les Headers. **Résultat : 401 Unauthorized (`Non authentifié`) ou 403 Forbidden (`Pas le droit SC`)**.
2. Essaie avec un faux JWT inventé. **Résultat : 401 Unauthorized**.
3. Déclenche le flux complet de la Procédure Gré-à-Gré avec tes mots "Urgence" -> Le Score IA dans `ao_db` PostgreSQL va ressortir très élevé, et le statut deviendra "En attente Contrôleur".

# Phase 7 : Tolérance Zéro (Sécurité RBAC) 🛡️

Le microservice `Appel d'Offres` est le coffre-fort des marchés publics.
Dans les phases précédentes, tout était "ouvert" (sans authentification ni JWT) pour nous permettre de développer et tester rapidement avec Swagger.

Maintenant, nous allons le fermer avec un cadenas de haute sécurité (RBAC - Role-Based Access Control) imposé par la Politique de Sécurité Système d'Information (PSSI) de l'application Al-Mizan.

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

---

## 🛠️ Outils NestJS & Sécurité à utiliser :

- Les **Guards** : `implements CanActivate` pour lire le contexte de la requête Express et bloquer.
- Les **Decorators Methods** (`SetMetadata`) : Pour envoyer au Guard la liste des rôles de la route actuelle.
- Utilisation de `JwtService` pour valider hors-ligne les signatures des jetons reçus.

## ✅ Critères de validation :

Lance ton application, ouvre Postman (ou Swagger) :

1. Essaie de taper `POST /appels-offres` sans passer ton Token dans les Headers. **Résultat : 401 Unauthorized (`Non authentifié`) ou 403 Forbidden (`Pas le droit SC`)**.
2. Essaie avec un faux JWT inventé. **Résultat : 401 Unauthorized**.
3. Réitère un flux complet de création en tant que `SERVICE_CONTRACTANT` en incluant un Bearer JWT token valide. **Résultat : 201 Created**.

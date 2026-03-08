# Phase 6 : Workflow d'Exception — Procédure de Gré-à-Gré Assistée par IA 🤖

La procédure de Gré-à-Gré (Art. 41 et suivants de la Loi 23-12) est une méthode de passation exceptionnelle qui déroge à la règle générale de l'appel d'offres ouvert. En raison de son caractère exceptionnel et du risque de favoritisme (corruption ou mauvaise gestion), Al-Mizan introduit un workflow à 3 étapes intégrant une double validation : **Intelligence Artificielle (IA) + Validation Humaine (Contrôleur du Ministère)**.

Cette phase couvre la réalisation des 3 backlogs manquants :
- **US 11 : Soumettre une demande gré-à-gré (justifications + pièces obligatoires)**
- **US 12 : Analyse IA d'une demande gré-à-gré (score de conformité + recommandation)**
- **US 13 : Valider / rejeter une demande gré-à-gré (comparaison recommandation IA)**

---

## 🛠️ Modèle de Données (Rappel de `schema.prisma`)

Une relation *One-to-One* (1-1) existe entre `AppelOffres` et `DemandeGreAGre` :

```prisma
model DemandeGreAGre {
  id                      String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  aoId                    String   @unique @map("ao_id") @db.Uuid
  serviceContractantId    String   @map("service_contractant_id")
  statut                  StatutDemandeGreAGre @default(BROUILLON)

  justifications          JustificationGreAGre[]
  evaluationsIa           EvaluationIaGreAGre[]
  decisions               DecisionGreAGre[]
}
```
*Note : Les entités `JustificationGreAGre`, `EvaluationIaGreAGre` et `DecisionGreAGre` séparent l'audit des données (IA vs Humain). Le détail complet est dans le schéma Prisma.*

---

## 🚀 Étape 1 : Soumettre une demande (US 11)

**Acteur :** Service Contractant (`SC`)

Si un Appel d'Offres est créé avec le `typeProcedure` = `GRE_A_GRE`, le SC ne peut pas le publier par lui-même directement. Il doit soumettre au préalable un dossier de justification au contrôleur.

### Plan d'Implémentation (`GreAGre` Module) :
1.  **Générer un module** : `nest g resource modules/gre-a-gre`
2.  **DTO (`SubmitGreAGreDto`) :**
    - `justifications` (Array d'objets) : Liste comprenant pour chaque pièce le `type_justification` (URGENCE, TECHNIQUE, etc.), la `description`, et le lien `fichierUrl` (MinIO).
3.  **Logique Métier (`GreAGreService.submit()`) :**
    - Vérifier l'existence et la compatibilité de l'Appel d'Offres (`ao.typeProcedure === TypeProcedure.GRE_A_GRE`).
    - Empêcher les doublons si une demande existe déjà.
    - Créer la tête de demande `DemandeGreAGre` (statut `SOUMISE`).
    - Créer en boucle/bulk les `JustificationGreAGre` rattachées.
    - 📢 **RabbitMQ :** Émettre l'événement `ao.gre_a_gre.submitted` avec l'ID de la demande pour ordonner au microservice NLP de faire son travail.

---

## 🧠 Étape 2 : Analyse IA de la demande (US 12)

**Acteur :** Microservice IA (Consommation Asynchrone)

Le système intercepte la réponse du microservice d'Intelligence Artificielle de l'ENS qui a scanné le dossier. Son but est d'alerter le contrôleur s'il y a un décalage flagrant avec la loi.

### Plan d'Implémentation :
1.  **Consumer (`gre-a-gre.consumer.ts`) :**
    - Implémenter un nouveau handler `@EventPattern('ia.gre_a_gre.scored')` sous le décorateur de ton Controller `GreAGreConsumer` (comme fait en Phase 5.5 pour le recours).
2.  **Mock de la Magie IA (Dans ou avant la base) :**
    - Pour la base de la démonstration sans microservice NLP déployé, tu recevras/créeras du payload contenant une `recommandationIa` ("APPROUVER" ou "REJETER") et son degré de certitude en pourcentage (`scoreConformiteIa`).
    - Si le texte de justification contient des termes valides selon l'Article 41 ("urgence", "monopole", "exclusivité"), le score sera de +85%. Sinon, il chutera.
3.  **Mise à jour Prisma (`GreAGreService.updateScore()`) :**
    - Créer une nouvelle entrée dans la table `EvaluationIaGreAGre` (audit trail).
    - Le `statut` de la `DemandeGreAGre` parente devient automatiquement `EN_ANALYSE_IA` ou `SOUMISE` (En attente contrôleur).

---

## ⚖️ Étape 3 : Décision du Contrôleur (US 13)

**Acteur :** Contrôleur du Ministère Supérieur (`CONTROLEUR`)

L'IA n'abrite pas le sceau de l’État. C'est l'Humain qui détient le pouvoir législatif décisionnel final. L'IA ne sert que de phare d'alerte pour le contrôleur.

### Plan d'Implémentation :
1.  **Endpoint :** `PATCH /appels-offres/gre-a-gre/:id/valider` (Réservé plus tard par RBAC au Rôle `CONTROLEUR`).
2.  **DTO (`ValidateGreAGreDto`) :**
    - `decision` (Boolean) : `true` pour valider le gré-à-gré, `false` pour refuser cette méthode de passation.
81.  **Logique Métier (`GreAGreService.validate()`) :**
    - Créer l'entrée d'audit dans `DecisionGreAGre` (id du contrôleur, motif justifié, et corrélation ou non avec l'IA).
    - Mettre à jour la `DemandeGreAGre` au statut `ACCEPTEE` ou `REJETEE`.
    - Si `decision` == `ACCEPTER` :
        - 💡 **Règle Métier Principale :** Propulser l'`AppelOffres` depuis le statut `BROUILLON` (ou En attente) pour signifier qu'il est prêt pour l'attribution directe.
    - Si `decision` == `REJETER` :
        - L'Appel d'Offres originel reste bloqué ou passe du statut `BROUILLON` vers `ANNULE`. Une raison sera toujours consignée et tracée dans la table Décision.
    - **Notifications :** Penser à émettre un événement de retour au Service Contractant pour lui indiquer la conclusion du Ministère.

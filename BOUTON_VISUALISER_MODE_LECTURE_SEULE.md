# Modification Bouton Visualiser en Mode Lecture Seule

## Objectif
Transformer le bouton "Détails" dans la section "Demandes de Devis Récentes" du dashboard admin en un bouton "Visualiser" qui ouvre un modal en mode lecture seule, sans possibilité de modification.

## Problème Initial
Le bouton "Détails" dans la vue d'ensemble admin permettait de visualiser ET modifier les informations des demandes de devis. Les admins pouvaient modifier directement depuis ce modal.

## Solution Implémentée

### 1. Modification du Modal QuoteRequestDetailModal

#### Ajout du Mode Lecture Seule
Ajout d'un prop `readOnly` au composant `QuoteRequestDetailModal` :

```typescript
interface QuoteRequestDetailModalProps {
  quoteRequestId: string;
  onClose: () => void;
  onSave?: () => void;
  readOnly?: boolean;  // Nouveau prop
}
```

#### Modifications des Champs de Formulaire

Tous les champs sont maintenant désactivés quand `readOnly={true}` :

**Inputs et Select**
```typescript
<input
  ...
  disabled={readOnly}
  className="... disabled:bg-gray-100 disabled:cursor-not-allowed"
/>

<select
  ...
  disabled={readOnly}
  className="... disabled:bg-gray-100 disabled:cursor-not-allowed"
/>
```

**Checkboxes**
```typescript
<input
  type="checkbox"
  ...
  disabled={readOnly}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
/>
```

**Textarea**
```typescript
<textarea
  ...
  disabled={readOnly}
  className="... disabled:bg-gray-100 disabled:cursor-not-allowed"
/>
```

**AddressAutocomplete**
Remplacé par un champ texte en lecture seule :
```typescript
{readOnly ? (
  <div>
    <label>Adresse complète</label>
    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
      {adresseComplete}
    </div>
  </div>
) : (
  <AddressAutocomplete ... />
)}
```

#### Modification des Boutons

En mode `readOnly` :
- **Masquer** le bouton "Enregistrer"
- **Changer** "Annuler" en "Fermer"

```typescript
{readOnly ? (
  <button onClick={onClose} className="...">
    Fermer
  </button>
) : (
  <>
    <button onClick={onClose}>Annuler</button>
    <button onClick={handleSave}>Enregistrer</button>
  </>
)}
```

#### Masquage du Message d'Information

Le message "Vous pouvez corriger les informations..." est masqué en mode lecture seule :

```typescript
{!readOnly && (
  <div className="bg-blue-50 ...">
    <p>Vous pouvez corriger les informations saisies par le client...</p>
  </div>
)}
```

### 2. Modification du Dashboard Admin (AdminOverview)

#### Changement du Texte du Bouton

```typescript
<button onClick={() => setSelectedQuoteId(request.id)} className="...">
  <Eye className="w-4 h-4" />
  Visualiser  {/* Avant : "Détails" */}
</button>
```

#### Passage du Prop readOnly

```typescript
<QuoteRequestDetailModal
  quoteRequestId={selectedQuoteId}
  onClose={() => setSelectedQuoteId(null)}
  onSave={() => { ... }}
  readOnly={true}  {/* Nouveau */}
/>
```

## Flux de Modification Conservé

Les admins peuvent toujours modifier les demandes de devis via le chemin complet :

**Utilisateurs → Clients → Voir Détails → Modifier**

Ce chemin ouvre le même modal `QuoteRequestDetailModal` mais **sans** le prop `readOnly`, permettant l'édition complète.

## Comportement Final

### Vue d'Ensemble Admin - Bouton "Visualiser"
- Ouvre le modal en mode lecture seule
- Tous les champs sont grisés et non modifiables
- Un seul bouton "Fermer" en bas
- Pas de message d'information sur la modification
- Permet une consultation rapide sans risque de modification accidentelle

### Utilisateurs → Modifier - Bouton "Modifier"
- Ouvre le modal en mode édition complète
- Tous les champs sont modifiables
- Boutons "Annuler" et "Enregistrer"
- Message d'information visible
- Permet la modification contrôlée des informations

## Avantages

1. **Séparation claire** : Visualisation vs Modification
2. **Prévention d'erreurs** : Pas de modification accidentelle depuis la vue d'ensemble
3. **UX améliorée** : Intention claire avec les boutons "Visualiser" et "Fermer"
4. **Flux organisé** : Modification uniquement via le chemin dédié
5. **Code réutilisable** : Un seul composant pour deux modes d'utilisation

## Fichiers Modifiés

1. `/src/components/admin/QuoteRequestDetailModal.tsx`
   - Ajout du prop `readOnly`
   - Désactivation de tous les champs en mode lecture seule
   - Modification des boutons selon le mode
   - Masquage du message d'information en mode lecture seule

2. `/src/components/admin/AdminOverview.tsx`
   - Changement du texte "Détails" → "Visualiser"
   - Passage du prop `readOnly={true}` au modal

## Build

✅ Le projet compile sans erreurs
✅ Tous les types TypeScript sont corrects
✅ Aucune régression fonctionnelle

## Test

Pour tester :
1. Se connecter en tant qu'admin
2. Aller dans "Vue d'ensemble"
3. Cliquer sur "Visualiser" dans "Demandes de Devis Récentes"
4. Vérifier que tous les champs sont grisés et non modifiables
5. Vérifier qu'il n'y a qu'un bouton "Fermer"
6. Aller dans "Utilisateurs" → "Clients" → Cliquer sur un client
7. Cliquer sur "Modifier" sur une demande de déménagement
8. Vérifier que tous les champs sont modifiables
9. Vérifier qu'il y a les boutons "Annuler" et "Enregistrer"

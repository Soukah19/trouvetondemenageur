# Système d'Upload de Documents - JPG/PNG uniquement

## Modifications Effectuées

### Nouveau Composant: DocumentUploadInput

Un nouveau composant réutilisable a été créé pour gérer l'upload de documents avec les fonctionnalités suivantes :

#### Fonctionnalités

1. **Formats Acceptés**: JPG, JPEG, PNG uniquement
   - Les fichiers PDF ne sont plus acceptés
   - Message d'avertissement clair affiché à l'utilisateur

2. **Double Option d'Upload**:
   - **Prendre une photo**: Bouton qui déclenche l'appareil photo du device (mobile/ordinateur)
   - **Télécharger un fichier**: Option classique pour sélectionner une image depuis la galerie/dossier

3. **Capture Photo en Direct**:
   - Accès à la caméra du device
   - Prévisualisation en temps réel
   - Bouton "Capturer" pour prendre la photo
   - Bouton "Annuler" pour fermer la caméra
   - Conversion automatique en JPG

4. **Interface Utilisateur**:
   - Message d'information sur les formats acceptés
   - Aperçu du fichier sélectionné avec miniature
   - Affichage du nom et de la taille du fichier
   - Bouton pour supprimer et choisir un autre fichier
   - Indicateurs visuels clairs (icônes, couleurs)

### Documents Concernés

Le nouveau composant est utilisé pour tous les documents lors de l'inscription du déménageur :

1. **Pièce d'identité du gérant**:
   - Recto (face avant)
   - Verso (face arrière)

2. **Documents d'entreprise**:
   - Extrait KBIS
   - Attestation d'assurance RC PRO
   - Licence de transport (optionnel)

## Avantages

1. **Compatibilité IA**: Les images JPG/PNG peuvent être analysées directement par l'IA (GPT-4 Vision)
2. **Facilité d'utilisation**: Possibilité de prendre une photo directement plutôt que de scanner un document
3. **Taille de fichiers réduite**: Les images sont généralement plus légères que les PDF
4. **Meilleure qualité d'analyse**: L'IA peut analyser les images plus efficacement

## Utilisation Mobile

Sur mobile, le composant utilise automatiquement la caméra arrière (environnement) pour une meilleure qualité de capture des documents.

## Permissions Requises

Le navigateur demandera l'autorisation d'accès à la caméra lors de la première utilisation. L'utilisateur doit accepter cette permission pour utiliser la fonction "Prendre une photo".

## Fallback

Si l'accès à la caméra est refusé ou indisponible, l'utilisateur peut toujours utiliser l'option "Télécharger" pour sélectionner une image existante.

## Validation

- Le système vérifie que seuls des fichiers images sont sélectionnés
- Un message d'alerte s'affiche si un autre type de fichier est choisi
- Les champs obligatoires sont clairement indiqués avec un astérisque (*)

## Impact sur l'Analyse IA

Avec ce changement, les documents DROP IT (et tous les futurs déménageurs) pourront être analysés automatiquement par l'IA lors de la vérification, détectant:
- Les informations du KBIS (nom, SIRET, gérant, adresse)
- Les dates d'expiration des assurances et licences
- La cohérence des informations avec la pièce d'identité
- Les anomalies potentielles

## Fichiers Modifiés

1. `/src/components/DocumentUploadInput.tsx` (nouveau)
2. `/src/pages/MoverSignupPage.tsx` (mise à jour des inputs de fichiers)

## Build

✅ Le projet compile sans erreurs
✅ Tous les types TypeScript sont corrects
✅ Aucune régression fonctionnelle

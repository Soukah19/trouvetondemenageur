# Guide Test Email Immédiat - Resend

## ✅ Statut : Resend est configuré et prêt à être testé

---

## Option 1 : Test via Interface Web (RECOMMANDÉ)

### Étape 1 : Ouvrir la page de test
```bash
# Ouvrir le fichier test-email.html dans votre navigateur
open test-email.html
```

Ou double-cliquez sur le fichier `test-email.html` dans le projet.

### Étape 2 : Remplir le formulaire
1. **Adresse email** : Entrez votre adresse email
2. **Type d'utilisateur** :
   - Choisir "Client" pour recevoir l'email de bienvenue client
   - Choisir "Déménageur" pour recevoir l'email de bienvenue déménageur
3. **Nom/Entreprise** : Optionnel, pour personnaliser l'email
4. Cliquer sur **"Envoyer l'email de test"**

### Étape 3 : Vérifier la réception
- Vérifiez votre boîte de réception (inbox)
- **IMPORTANT** : Vérifiez aussi les spams/courrier indésirable
- L'email devrait arriver en quelques secondes

---

## Option 2 : Test via inscription réelle

### Test email CLIENT
1. Aller sur la page d'inscription client
2. S'inscrire avec un nouvel email
3. Un email de bienvenue sera envoyé automatiquement
4. Vérifier la réception (inbox + spam)

### Test email DÉMÉNAGEUR
1. Aller sur la page d'inscription déménageur
2. S'inscrire avec un nouvel email
3. Un email de bienvenue sera envoyé automatiquement
4. Vérifier la réception (inbox + spam)

---

## Option 3 : Test via cURL (Technique)

```bash
# Test email CLIENT
curl -X POST 'https://uwgscuyujtmglxjuzcun.supabase.co/functions/v1/send-welcome-email' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3Z3NjdXl1anRtZ2x4anV6Y3VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTE3ODAsImV4cCI6MjA4MzEyNzc4MH0.YXr2fzJFK1K9dY8pwzXKz0Ja2L-ULGxH1FN6gep5g_s' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "VOTRE_EMAIL@example.com",
    "userType": "client",
    "record": {
      "first_name": "Jean"
    }
  }'

# Test email DÉMÉNAGEUR
curl -X POST 'https://uwgscuyujtmglxjuzcun.supabase.co/functions/v1/send-welcome-email' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3Z3NjdXl1anRtZ2x4anV6Y3VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTE3ODAsImV4cCI6MjA4MzEyNzc4MH0.YXr2fzJFK1K9dY8pwzXKz0Ja2L-ULGxH1FN6gep5g_s' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "VOTRE_EMAIL@example.com",
    "userType": "mover",
    "companyName": "Ma Société de Déménagement"
  }'
```

---

## Vérification des secrets Supabase (IMPORTANT)

### Problème possible
Si les emails ne sont pas envoyés, c'est probablement parce que le secret `RESEND_API_KEY` n'est pas configuré dans Supabase.

### Solution
1. Aller sur https://supabase.com/dashboard
2. Sélectionner le projet `uwgscuyujtmglxjuzcun`
3. Aller dans **Project Settings > Edge Functions > Secrets**
4. Ajouter le secret :
   ```
   RESEND_API_KEY = re_91BGZheM_2qXGtFUGWEr5kJp9zR99wWas
   ```
5. Sauvegarder

**Note** : Les secrets dans `.env` sont uniquement pour le développement local. En production (Supabase hosted), les edge functions utilisent les secrets configurés dans le dashboard Supabase.

---

## Contenu des emails de test

### Email CLIENT (Bienvenue)
- ✅ Message de bienvenue personnalisé
- ✅ Explication du processus de demande de devis
- ✅ Guide d'utilisation de la plateforme
- ✅ Lien vers l'espace client
- ✅ Design professionnel avec gradient bleu-vert

### Email DÉMÉNAGEUR (Bienvenue)
- ✅ Message de bienvenue professionnel
- ✅ Explication du processus de vérification
- ✅ Étapes de validation du compte
- ✅ Quand ils recevront les demandes de devis
- ✅ Lien vers l'espace professionnel
- ✅ Design professionnel avec gradient vert-bleu

---

## Troubleshooting

### ❌ Email non reçu après 5 minutes

**Vérifications** :
1. Vérifier les spams/courrier indésirable
2. Vérifier l'orthographe de l'email
3. Consulter les logs Supabase :
   ```
   # Via Dashboard Supabase
   # Edge Functions > send-welcome-email > Logs
   ```
4. Vérifier que `RESEND_API_KEY` est dans les secrets Supabase

### ❌ Erreur "Email service not configured"
→ Le secret `RESEND_API_KEY` n'est pas configuré dans Supabase
→ Suivre la section "Vérification des secrets Supabase" ci-dessus

### ❌ Erreur "Email sending failed"
→ Problème avec l'API Resend (quota dépassé, clé invalide, etc.)
→ Vérifier le compte Resend : https://resend.com/overview

### ❌ Erreur 401 Unauthorized
→ La clé API Resend est invalide ou expirée
→ Générer une nouvelle clé sur https://resend.com/api-keys

---

## Configuration Resend

### Vérifier le domaine d'envoi
L'email est envoyé depuis : `noreply@trouveton-demenageur.fr`

**Important** : Ce domaine doit être vérifié dans Resend pour que les emails soient envoyés.

### Étapes de vérification du domaine :
1. Aller sur https://resend.com/domains
2. Ajouter le domaine `trouveton-demenageur.fr`
3. Configurer les enregistrements DNS (SPF, DKIM, DMARC)
4. Attendre la vérification (quelques heures)

**Alternative temporaire** : Utiliser le domaine de test Resend :
- Dans l'edge function, changer `from: 'TrouveTonDemenageur <noreply@trouveton-demenageur.fr>'`
- Par `from: 'TrouveTonDemenageur <onboarding@resend.dev>'`

---

## Résumé des clés API

| Service | Statut | Localisation |
|---------|--------|--------------|
| Resend API | ✅ Configuré | `.env` + À ajouter dans secrets Supabase |
| Google Maps | ✅ Configuré | `.env` + À ajouter dans secrets Supabase |
| OpenAI | ✅ Configuré | `.env` + À ajouter dans secrets Supabase |
| Stripe | ❌ Non configuré | Vide |

---

## Test final recommandé

### Scénario complet :
1. **Ouvrir test-email.html**
2. **Envoyer un email CLIENT** → Vérifier réception
3. **Envoyer un email DÉMÉNAGEUR** → Vérifier réception
4. **S'inscrire en tant que client réel** → Vérifier email automatique
5. **S'inscrire en tant que déménageur réel** → Vérifier email automatique

Si tous ces tests fonctionnent, le système d'envoi d'emails est **100% opérationnel**.

---

## Support

En cas de problème persistant :
1. Consulter les logs Supabase Edge Functions
2. Vérifier les quotas Resend : https://resend.com/overview
3. Vérifier la documentation : https://resend.com/docs/send-with-nodejs

**Note** : Resend gratuit permet 100 emails/jour. Pour plus, passer à un plan payant.

# Systeme de Notifications Complete

## Corrections Effectuees

### 1. Edge Function send-notification Mise a Jour
**Fichier**: `supabase/functions/send-notification/index.ts`

Ajout du type `quote_update` pour envoyer des emails lors de modifications de demandes :
- Email automatique avec details de la demande modifiee
- Indique si modification faite par client ou admin
- Contient tous les details mis a jour (adresses, date, volume, services, etc.)

### 2. Notifications et Emails pour Demenageurs - Modification Client
**Fichier**: `src/pages/ClientQuotePage.tsx`

Quand un client modifie sa demande :
- ✅ Creation notification dans la base de donnees pour chaque demenageur ayant soumis un devis
- ✅ Envoi email automatique via edge function send-notification
- ✅ Email contient tous les details mis a jour de la demande
- ✅ Notification specifie que c'est le client qui a modifie (`modifiedBy: 'client'`)

**Code ajoute** (lignes 362-427) :
```typescript
// Recuperation des demenageurs avec leurs emails
const { data: quotesWithMovers } = await supabase
  .from('quotes')
  .select('movers!inner(user_id, email, company_name)')
  .eq('quote_request_id', editingQuoteRequestId);

// Creation notifications dans la base
const notifications = quotesWithMovers.map(q => ({
  user_id: (q.movers as any).user_id,
  title: 'Demande de déménagement modifiée',
  message: 'Le client a modifié sa demande...',
  type: 'quote_update',
  read: false,
  created_at: new Date().toISOString()
}));
await supabase.from('notifications').insert(notifications);

// Envoi emails
for (const quote of quotesWithMovers) {
  await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
    body: JSON.stringify({
      type: 'quote_update',
      recipientEmail: mover.email,
      data: { ...tous les details de la demande }
    })
  });
}
```

### 3. Notifications pour Admins - Modification Client
**Fichier**: `src/pages/ClientQuotePage.tsx`

Quand un client modifie sa demande :
- ✅ Creation notification pour TOUS les admins
- ✅ Message : "Client a modifie sa demande"
- ✅ Details : ville depart, ville arrivee, date

**Code ajoute** (lignes 412-427) :
```typescript
const { data: admins } = await supabase
  .from('admins')
  .select('user_id, email');

if (admins && admins.length > 0) {
  const adminNotifications = admins.map(admin => ({
    user_id: admin.user_id,
    title: 'Client a modifié sa demande',
    message: `Le client a modifié sa demande...`,
    type: 'quote_update',
    read: false,
    created_at: new Date().toISOString()
  }));

  await supabase.from('notifications').insert(adminNotifications);
}
```

### 4. Notifications et Emails pour Demenageurs - Modification Admin
**Fichier**: `src/components/admin/QuoteRequestDetailModal.tsx`

Quand un admin modifie une demande :
- ✅ Creation notification pour chaque demenageur ayant soumis un devis
- ✅ Envoi email automatique via edge function
- ✅ Notification specifie que c'est un admin qui a modifie (`modifiedBy: 'admin'`)

**Code ajoute** (lignes 101-148) :
Meme systeme que pour le client mais avec `modifiedBy: 'admin'`

### 5. Cloche de Notification Admin Corrigee
**Fichier**: `src/pages/AdminDashboard.tsx`

Avant :
```typescript
<button className="relative p-2 hover:bg-gray-100 rounded-lg">
  <Bell className="w-5 h-5" />
  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
</button>
```

Apres :
```typescript
<NotificationBell />
```

Le composant NotificationBell :
- ✅ Affiche le nombre de notifications non lues
- ✅ Dropdown avec liste des notifications
- ✅ Bouton "Tout marquer lu"
- ✅ Temps relatif (Il y a 5min, Il y a 2h, etc.)
- ✅ Abonnement temps reel via Supabase Realtime
- ✅ Icone specifique pour chaque type (🔄 pour quote_update)

### 6. Icone pour Notifications quote_update
**Fichier**: `src/components/NotificationBell.tsx`

Ajout de l'icone 🔄 pour le type `quote_update`

## Comment Tester

### Test 1: Modification par le Client

1. **Se connecter en tant que client** qui a deja une demande avec des devis recus

2. **Modifier la demande** :
   - Cliquer sur bouton "Modifier" dans le dashboard client
   - Modifier par exemple :
     - Le volume (via calculateur de cubage)
     - La date de demenagement
     - Les services demandes
     - Les informations sur les logements
   - Cliquer sur "Enregistrer"

3. **Verifier les notifications demenageur** :
   - Se deconnecter
   - Se connecter avec le compte demenageur qui a soumis un devis
   - Verifier la cloche de notification (doit afficher 1 ou +)
   - Cliquer sur la cloche
   - Doit voir : "Demande de demenagement modifiee"
   - Message : "Le client a modifie sa demande..."

4. **Verifier l'email demenageur** :
   - Verifier l'email du demenageur
   - Doit recevoir : "🔄 Demande de demenagement modifiee"
   - Email contient tous les details mis a jour

5. **Verifier les notifications admin** :
   - Se deconnecter
   - Se connecter avec un compte admin
   - Verifier la cloche de notification (doit afficher 1 ou +)
   - Cliquer sur la cloche
   - Doit voir : "Client a modifie sa demande"

### Test 2: Modification par l'Admin

1. **Se connecter en tant qu'admin**

2. **Modifier une demande avec devis** :
   - Aller dans "Utilisateurs" > "Clients"
   - Cliquer sur "Voir" pour un client ayant une demande avec devis
   - Cliquer sur "Voir" sur la demande
   - Modifier les informations
   - Cliquer sur "Enregistrer"

3. **Verifier les notifications demenageur** :
   - Se connecter avec le compte demenageur
   - Verifier la cloche de notification
   - Doit voir : "Demande de demenagement modifiee"
   - Message : "Un administrateur a modifie la demande..."

4. **Verifier l'email demenageur** :
   - Email recu avec mention "Un administrateur a modifie..."

## Points Importants

### Notifications en Base de Donnees
- Table : `notifications`
- Champs : `user_id`, `title`, `message`, `type`, `read`, `created_at`
- Type : `quote_update`
- Abonnement temps reel actif

### Emails
- Fonction : `send-notification` edge function
- Type : `quote_update`
- Distinction client/admin via `data.modifiedBy`
- Contenu : Tous les details de la demande mise a jour

### Destinataires
**Modification par client** :
- Tous les demenageurs ayant soumis un devis → notification + email
- Tous les admins → notification (pas d'email pour les admins)

**Modification par admin** :
- Tous les demenageurs ayant soumis un devis → notification + email

## Verification Rapide

### SQL pour verifier les notifications creees
```sql
-- Voir les dernieres notifications quote_update
SELECT
  n.*,
  u.email as user_email,
  CASE
    WHEN EXISTS (SELECT 1 FROM movers WHERE user_id = n.user_id) THEN 'mover'
    WHEN EXISTS (SELECT 1 FROM admins WHERE user_id = n.user_id) THEN 'admin'
    ELSE 'unknown'
  END as user_type
FROM notifications n
LEFT JOIN auth.users u ON u.id = n.user_id
WHERE n.type = 'quote_update'
ORDER BY n.created_at DESC
LIMIT 10;
```

### Verifier si l'edge function est deployee
```bash
# Dans le terminal Supabase
supabase functions list

# Doit afficher send-notification
```

## Problemes Potentiels et Solutions

### 1. Pas d'email recu
- Verifier que RESEND_API_KEY est configure dans Supabase
- Verifier les logs de l'edge function : aller sur Supabase Dashboard > Edge Functions > send-notification > Logs
- En mode dev sans API key, les emails sont loggues dans la console

### 2. Pas de notification dans la cloche
- Verifier que le user_id est correct dans la table notifications
- Verifier que le composant NotificationBell est bien monte
- Ouvrir la console navigateur pour voir les erreurs

### 3. Cloche admin ne s'affiche pas
- Le composant NotificationBell a ete ajoute dans AdminDashboard
- Verifier que l'admin est bien authentifie (user existe)

## Fichiers Modifies

1. `supabase/functions/send-notification/index.ts` - Ajout type quote_update
2. `src/pages/ClientQuotePage.tsx` - Notifications + emails demenageurs et admins
3. `src/components/admin/QuoteRequestDetailModal.tsx` - Notifications + emails demenageurs
4. `src/pages/AdminDashboard.tsx` - Ajout composant NotificationBell
5. `src/components/NotificationBell.tsx` - Ajout icone quote_update

## Compilation
✅ Build reussi sans erreurs
✅ Tous les types TypeScript valides
✅ Aucune dependance manquante

Le systeme est maintenant complet et pret pour les tests !

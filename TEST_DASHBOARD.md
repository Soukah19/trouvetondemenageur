# Test de diagnostic du dashboard déménageur

## Instructions pour tester

1. Ouvrez la console du navigateur (F12)
2. Connectez-vous en tant que déménageur : demenageur@test.fr
3. Allez sur "Voir les demandes de devis"
4. Regardez les logs dans la console

## Ce que vous devriez voir dans les logs:

```
Fetching quote requests...
Query result: {data: Array(1), error: null}
Processed requests: [{...}]
```

## Si vous voyez "Query result: {data: null, error: {...}}"

Cela signifie que les politiques RLS bloquent l'accès. Dans ce cas :

1. Vérifiez que le déménageur est bien vérifié :
```sql
SELECT id, user_id, verification_status, is_active
FROM movers
WHERE user_id = 'aaf2556e-8a38-4296-a99e-02559f7febe2';
```

2. Testez la politique RLS manuellement :
```sql
-- Se connecter en tant que déménageur
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "aaf2556e-8a38-4296-a99e-02559f7febe2"}';

-- Essayer de lire les demandes
SELECT * FROM quote_requests WHERE status IN ('new', 'quoted');
```

## Si vous voyez "Query result: {data: [], error: null}"

Cela signifie qu'il n'y a pas de demandes avec le statut 'new' ou 'quoted'.

Vérifiez :
```sql
SELECT id, from_city, to_city, status, created_at
FROM quote_requests
ORDER BY created_at DESC;
```

## Solution temporaire si rien ne fonctionne

Désactivez temporairement le RLS pour tester :
```sql
ALTER TABLE quote_requests DISABLE ROW LEVEL SECURITY;
```

Puis rechargez la page. Si ça fonctionne, le problème vient bien des politiques RLS.

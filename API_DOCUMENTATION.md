# 🔌 TrouveTonDemenageur - API Documentation

Complete API reference for all backend Edge Functions.

---

## 🌐 Base URL

```
https://[your-project-ref].supabase.co/functions/v1/
```

## 🔑 Authentication

All function calls require the following headers:

```javascript
{
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json'
}
```

---

## 📋 Edge Functions List

### 1. Calculate Distance

**Endpoint**: `POST /calculate-distance`

Calculates driving distance between two addresses using Google Maps API.

**Request Body**:
```json
{
  "origin": "123 Rue de la Paix, 75001 Paris",
  "destination": "456 Avenue des Champs, 69001 Lyon"
}
```

**Response**:
```json
{
  "distance": 462.3,
  "duration": "4h 30min",
  "route": { /* Google Maps route data */ }
}
```

**Used For**:
- Quote request price estimation
- Route planning
- Mover service area validation

---

### 2. Analyze Furniture Photo

**Endpoint**: `POST /analyze-furniture-photo`

Uses AI to identify furniture items from photos.

**Request Body**:
```json
{
  "imageUrl": "https://storage.supabase.co/...",
  "quoteRequestId": "uuid"
}
```

**Response**:
```json
{
  "items": [
    {
      "name": "Canapé 3 places",
      "category": "living_room",
      "volume": 2.5,
      "confidence": 0.95
    },
    {
      "name": "Table basse",
      "category": "living_room",
      "volume": 0.8,
      "confidence": 0.87
    }
  ],
  "totalVolume": 3.3
}
```

**Used For**:
- Automatic inventory generation
- Volume calculation
- Price estimation improvement

---

### 3. Analyze Damage Photo

**Endpoint**: `POST /analyze-damage-photo`

Analyzes photos of damage for insurance claims.

**Request Body**:
```json
{
  "imageUrl": "https://storage.supabase.co/...",
  "damageReportId": "uuid"
}
```

**Response**:
```json
{
  "damageType": "scratch",
  "severity": "minor",
  "estimatedCost": 150,
  "description": "Surface scratch on wooden furniture, approximately 10cm long",
  "recommendations": [
    "Professional wood repair",
    "Touch-up staining"
  ]
}
```

**Used For**:
- Damage report assessment
- Insurance claim validation
- Cost estimation

---

### 4. Verify Identity Document

**Endpoint**: `POST /verify-identity-document`

Verifies identity documents using OCR and validation.

**Request Body**:
```json
{
  "documentUrl": "https://storage.supabase.co/...",
  "documentType": "identity_card",
  "moverId": "uuid"
}
```

**Response**:
```json
{
  "isValid": true,
  "extractedData": {
    "firstName": "Jean",
    "lastName": "Dupont",
    "birthDate": "1985-03-15",
    "documentNumber": "123456789",
    "expirationDate": "2027-03-15"
  },
  "verificationScore": 0.94,
  "warnings": []
}
```

**Used For**:
- Mover verification process
- Identity validation
- KYC compliance

---

### 5. Verify Document

**Endpoint**: `POST /verify-document`

General document verification for business documents.

**Request Body**:
```json
{
  "documentUrl": "https://storage.supabase.co/...",
  "documentType": "insurance",
  "moverId": "uuid"
}
```

**Response**:
```json
{
  "isValid": true,
  "extractedData": {
    "companyName": "Assurances XYZ",
    "policyNumber": "POL-2024-12345",
    "coverage": 2000000,
    "expirationDate": "2025-12-31"
  },
  "verificationScore": 0.91
}
```

**Used For**:
- Insurance certificate validation
- Business document verification
- Compliance checks

---

### 6. Comprehensive Mover Verification

**Endpoint**: `POST /comprehensive-mover-verification`

Complete verification check for mover accounts.

**Request Body**:
```json
{
  "moverId": "uuid"
}
```

**Response**:
```json
{
  "isVerified": true,
  "checks": {
    "identity": { "status": "passed", "score": 0.95 },
    "businessRegistration": { "status": "passed", "score": 0.92 },
    "insurance": { "status": "passed", "score": 0.89 },
    "vehicles": { "status": "passed", "score": 0.88 }
  },
  "overallScore": 0.91,
  "recommendations": []
}
```

**Used For**:
- Final mover approval
- Admin verification dashboard
- Automated verification workflow

---

### 7. Send Welcome Email

**Endpoint**: `POST /send-welcome-email`

Sends welcome email to new users.

**Request Body**:
```json
{
  "email": "user@example.com",
  "firstName": "Jean",
  "userType": "client"
}
```

**Response**:
```json
{
  "success": true,
  "messageId": "msg_123456"
}
```

**Used For**:
- User onboarding
- Account activation
- First impression

---

### 8. Send Notification

**Endpoint**: `POST /send-notification`

Sends email/SMS notifications to users.

**Request Body**:
```json
{
  "userId": "uuid",
  "type": "new_quote",
  "title": "Nouveau devis reçu",
  "message": "Vous avez reçu un nouveau devis pour votre déménagement",
  "channel": "email"
}
```

**Response**:
```json
{
  "success": true,
  "notificationId": "notif_123456"
}
```

**Used For**:
- Real-time notifications
- Email alerts
- SMS notifications

---

### 9. Process Notification Queue

**Endpoint**: `POST /process-notification-queue`

Batch processes pending notifications (scheduled job).

**Request Body**:
```json
{
  "batchSize": 100
}
```

**Response**:
```json
{
  "processed": 47,
  "failed": 2,
  "errors": [...]
}
```

**Used For**:
- Scheduled notification delivery
- Batch email sending
- Queue management

---

### 10. Validate Payment Card

**Endpoint**: `POST /validate-payment-card`

Validates credit card information with Stripe.

**Request Body**:
```json
{
  "cardNumber": "4242424242424242",
  "expMonth": 12,
  "expYear": 2025,
  "cvc": "123"
}
```

**Response**:
```json
{
  "isValid": true,
  "cardType": "visa",
  "last4": "4242",
  "expirationDate": "12/2025"
}
```

**Used For**:
- Payment validation
- Card verification before charge
- Fraud prevention

---

### 11. Export Damage Report PDF

**Endpoint**: `POST /export-damage-report-pdf`

Generates PDF report for damage claims.

**Request Body**:
```json
{
  "damageReportId": "uuid"
}
```

**Response**:
```json
{
  "pdfUrl": "https://storage.supabase.co/.../damage-report.pdf",
  "expiresAt": "2024-01-15T10:00:00Z"
}
```

**Used For**:
- Insurance documentation
- Legal records
- Client records

---

### 12. Check Document Expiration

**Endpoint**: `POST /check-document-expiration`

Checks and flags expired documents (scheduled job).

**Request Body**:
```json
{
  "checkType": "all"
}
```

**Response**:
```json
{
  "checked": 150,
  "expired": 5,
  "expiringSoon": 12,
  "expiredDocuments": [...]
}
```

**Used For**:
- Automated compliance checks
- Expiration alerts
- Admin notifications

---

### 13. Analyze Mission Letter

**Endpoint**: `POST /analyze-mission-letter`

OCR analysis of mission/assignment letters.

**Request Body**:
```json
{
  "documentUrl": "https://storage.supabase.co/...",
  "quoteRequestId": "uuid"
}
```

**Response**:
```json
{
  "extractedData": {
    "movingDate": "2024-05-15",
    "origin": "Paris",
    "destination": "Lyon",
    "items": [...]
  },
  "confidence": 0.88
}
```

**Used For**:
- Corporate move processing
- Bulk data entry
- Document digitization

---

### 14. Create Admin Accounts

**Endpoint**: `POST /create-admin-accounts`

Creates admin user accounts (super admin only).

**Request Body**:
```json
{
  "email": "admin@trouveton.fr",
  "username": "admin_jean",
  "role": "admin",
  "permissions": ["users", "quotes", "payments"]
}
```

**Response**:
```json
{
  "success": true,
  "adminId": "uuid",
  "temporaryPassword": "temp_pass_123"
}
```

**Used For**:
- Admin team management
- Role assignment
- Access control

---

### 15. Reset Admin Passwords

**Endpoint**: `POST /reset-admin-passwords`

Resets admin account passwords (super admin only).

**Request Body**:
```json
{
  "adminId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "temporaryPassword": "temp_pass_456",
  "expiresAt": "2024-01-15T10:00:00Z"
}
```

**Used For**:
- Password recovery
- Security resets
- Access restoration

---

### 16. Delete Auth User

**Endpoint**: `POST /delete-auth-user`

Permanently deletes a user account (admin only).

**Request Body**:
```json
{
  "userId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "deletedAt": "2024-01-15T10:00:00Z"
}
```

**Used For**:
- Account deletion
- GDPR compliance
- Data cleanup

---

### 17. Verify Dropit Documents

**Endpoint**: `POST /verify-dropit-documents`

Specific verification for DropIt partner integration.

**Request Body**:
```json
{
  "moverId": "uuid",
  "documents": [...]
}
```

**Response**:
```json
{
  "verified": true,
  "checks": [...]
}
```

**Used For**:
- Partner integration
- Bulk verification
- API integration

---

## 🔐 Security

### Rate Limiting
- **Default**: 100 requests/minute per user
- **Authenticated**: 1000 requests/minute
- **Admin**: Unlimited

### Error Responses

**401 Unauthorized**:
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

**403 Forbidden**:
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

**400 Bad Request**:
```json
{
  "error": "Bad Request",
  "message": "Invalid request parameters",
  "details": { ... }
}
```

**500 Internal Server Error**:
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## 📊 Usage Example

### JavaScript/TypeScript

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function calculateDistance(origin: string, destination: string) {
  const response = await fetch(
    `${supabaseUrl}/functions/v1/calculate-distance`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ origin, destination })
    }
  );

  const data = await response.json();
  return data;
}
```

### React Hook

```typescript
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useEdgeFunction(functionName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const invoke = async (params: any) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        functionName,
        { body: params }
      );

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { invoke, loading, error };
}
```

---

## 🧪 Testing

### Testing with cURL

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/calculate-distance \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Paris",
    "destination": "Lyon"
  }'
```

### Testing with Postman

1. Create new request
2. Set method to POST
3. Add URL: `{{baseUrl}}/functions/v1/{{functionName}}`
4. Add headers:
   - `Authorization: Bearer {{anonKey}}`
   - `Content-Type: application/json`
5. Add request body (JSON)

---

## 📈 Monitoring

All Edge Functions are automatically monitored for:
- Execution time
- Error rate
- Invocation count
- Memory usage

View metrics in: **Supabase Dashboard → Edge Functions → Metrics**

---

## 🚀 Deployment

Deploy all functions:
```bash
supabase functions deploy
```

Deploy specific function:
```bash
supabase functions deploy function-name
```

View logs:
```bash
supabase functions logs function-name
```

---

## 📝 Notes

- All functions return JSON responses
- CORS is enabled for all functions
- Functions timeout after 60 seconds
- Maximum payload size: 6MB
- All functions run in isolated Deno runtime
- Environment variables are automatically injected

---

## 🔗 Related Documentation

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Runtime](https://deno.land)
- [API Authentication](https://supabase.com/docs/guides/auth)

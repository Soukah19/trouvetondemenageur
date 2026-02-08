# 🗄️ TrouveTonDemenageur - Complete Database Schema

Complete database schema documentation with all tables, relationships, and RLS policies.

## 📊 Database Overview

- **Total Migrations**: 89 migration files
- **Database Type**: PostgreSQL 15+ (via Supabase)
- **Security**: Row Level Security (RLS) enabled on all tables
- **Storage Buckets**: 3 (moving-photos, identity-documents, truck-photos)

---

## 🔐 Authentication Tables

### `admins`
Administrator accounts with different role levels.

```sql
CREATE TABLE admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'agent')),
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Roles**:
- `super_admin` - Full system access
- `admin` - Management access
- `agent` - Customer support access

### `clients`
Client/customer accounts.

```sql
CREATE TABLE clients (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  phone text,
  first_name text,
  last_name text,
  address text,
  city text,
  postal_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### `movers`
Moving company profiles.

```sql
CREATE TABLE movers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  siret text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,

  -- Business info
  description text,
  services text[] DEFAULT ARRAY[]::text[],
  specialties text[] DEFAULT ARRAY[]::text[],
  coverage_area jsonb DEFAULT '[]'::jsonb,

  -- Verification
  is_verified boolean DEFAULT false,
  verification_status text DEFAULT 'pending',
  verification_date timestamptz,
  account_status text DEFAULT 'pending',

  -- Insurance
  insurance_company text,
  insurance_policy_number text,
  insurance_amount numeric(15,2),

  -- Business details
  years_experience integer,
  num_employees integer,
  num_trucks integer,

  -- Ratings
  average_rating numeric(3,2) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  completed_moves integer DEFAULT 0,

  -- Features
  offers_packing boolean DEFAULT false,
  offers_storage boolean DEFAULT false,
  offers_furniture_lift boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## 📝 Quote & Booking System

### `quote_requests`
Moving requests from clients.

```sql
CREATE TABLE quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,

  -- Origin
  origin_address text NOT NULL,
  origin_city text NOT NULL,
  origin_postal_code text NOT NULL,
  origin_floor integer,
  origin_elevator boolean DEFAULT false,
  origin_home_type text,
  origin_surface_area numeric(10,2),

  -- Destination
  destination_address text NOT NULL,
  destination_city text NOT NULL,
  destination_postal_code text NOT NULL,
  destination_floor integer,
  destination_elevator boolean DEFAULT false,
  destination_home_type text,
  destination_surface_area numeric(10,2),

  -- Moving details
  moving_date date,
  is_date_flexible boolean DEFAULT false,
  estimated_volume numeric(10,2),
  num_rooms integer,

  -- Services
  needs_packing boolean DEFAULT false,
  needs_storage boolean DEFAULT false,
  needs_furniture_lift boolean DEFAULT false,
  has_heavy_items boolean DEFAULT false,
  has_fragile_items boolean DEFAULT false,

  -- Additional info
  additional_info text,
  furniture_inventory jsonb DEFAULT '[]'::jsonb,

  -- Pricing
  estimated_distance numeric(10,2),
  price_indicator numeric(10,2),

  -- Status
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Status Values**:
- `pending` - Awaiting quotes
- `quoted` - Has received quotes
- `accepted` - Quote accepted
- `completed` - Move completed
- `cancelled` - Cancelled

### `quotes`
Bids from movers on quote requests.

```sql
CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE CASCADE,
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE,

  -- Pricing
  price numeric(15,2) NOT NULL,
  price_breakdown jsonb DEFAULT '{}'::jsonb,

  -- Details
  proposed_moving_date date,
  estimated_duration text,
  included_services text[] DEFAULT ARRAY[]::text[],

  -- Status
  status text DEFAULT 'pending',
  valid_until timestamptz,

  -- Additional
  message text,
  terms_conditions text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Status Values**:
- `pending` - Awaiting client review
- `accepted` - Client accepted
- `rejected` - Client rejected
- `expired` - Past valid_until date
- `withdrawn` - Mover withdrew

---

## 💳 Payment System

### `payments`
Payment transactions.

```sql
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE,

  -- Payment details
  amount numeric(15,2) NOT NULL,
  commission_amount numeric(15,2) NOT NULL,
  mover_payout_amount numeric(15,2) NOT NULL,

  -- Status
  status text DEFAULT 'pending',
  payment_method text,

  -- External references
  stripe_payment_intent_id text,
  stripe_transfer_id text,

  -- Dates
  paid_at timestamptz,
  released_at timestamptz,

  created_at timestamptz DEFAULT now()
);
```

**Status Values**:
- `pending` - Payment initiated
- `held` - In escrow
- `released` - Paid to mover
- `refunded` - Refunded to client
- `failed` - Payment failed

### `refunds`
Refund records.

```sql
CREATE TABLE refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES payments(id) ON DELETE CASCADE,

  -- Refund details
  amount numeric(15,2) NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending',

  -- External reference
  stripe_refund_id text,

  -- Dates
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,

  created_at timestamptz DEFAULT now()
);
```

---

## 📄 Document Management

### `mover_documents`
Document uploads for verification.

```sql
CREATE TABLE mover_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE,

  -- Document info
  document_type text NOT NULL,
  file_url text NOT NULL,
  file_name text,
  file_size integer,

  -- Verification
  verification_status text DEFAULT 'pending',
  verified_at timestamptz,
  verified_by uuid REFERENCES admins(id),
  rejection_reason text,

  -- Expiration
  expiration_date date,
  is_expired boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Document Types**:
- `kbis` - Company registration
- `insurance` - Insurance certificate
- `rcp` - Professional liability
- `identity_card` - ID card
- `drivers_license` - Driver's license
- `truck_registration` - Vehicle registration

### `mover_trucks`
Vehicle information.

```sql
CREATE TABLE mover_trucks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE,

  -- Truck details
  brand text NOT NULL,
  model text NOT NULL,
  year integer,
  license_plate text NOT NULL,
  volume_capacity numeric(10,2),
  max_weight_capacity numeric(10,2),

  -- Features
  has_lift_gate boolean DEFAULT false,
  has_climate_control boolean DEFAULT false,

  -- Photos
  photo_urls text[] DEFAULT ARRAY[]::text[],

  -- Status
  is_active boolean DEFAULT true,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## 📸 Photo & Media

### `moving_photos`
Photos uploaded during moves.

```sql
CREATE TABLE moving_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id),

  -- Photo details
  photo_url text NOT NULL,
  photo_type text NOT NULL,
  caption text,

  -- AI Analysis (if applicable)
  ai_analysis jsonb,

  created_at timestamptz DEFAULT now()
);
```

**Photo Types**:
- `before` - Before move
- `after` - After move
- `damage` - Damage documentation
- `inventory` - Item inventory

### `damage_reports`
Damage claim reports.

```sql
CREATE TABLE damage_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE CASCADE,
  reported_by uuid REFERENCES auth.users(id),

  -- Report details
  description text NOT NULL,
  severity text NOT NULL,
  estimated_cost numeric(15,2),

  -- Photos
  photo_urls text[] DEFAULT ARRAY[]::text[],

  -- Status
  status text DEFAULT 'reported',
  resolution text,

  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);
```

---

## ⭐ Reviews & Ratings

### `reviews`
Customer reviews of movers.

```sql
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE CASCADE,
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,

  -- Review content
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,

  -- Categories
  punctuality_rating integer,
  professionalism_rating integer,
  care_rating integer,
  value_rating integer,

  -- Status
  is_verified boolean DEFAULT false,
  is_published boolean DEFAULT true,

  created_at timestamptz DEFAULT now()
);
```

---

## 💬 Communication

### `messages`
In-app messaging system.

```sql
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Message content
  content text NOT NULL,
  attachments text[] DEFAULT ARRAY[]::text[],

  -- Status
  is_read boolean DEFAULT false,
  read_at timestamptz,

  created_at timestamptz DEFAULT now()
);
```

### `notifications`
User notifications.

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type text NOT NULL,

  -- Notification content
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,

  -- Related data
  related_id uuid,
  changes jsonb,

  -- Status
  is_read boolean DEFAULT false,
  read_at timestamptz,

  created_at timestamptz DEFAULT now()
);
```

**Notification Types**:
- `new_quote_request` - New request available
- `new_quote` - New quote received
- `quote_accepted` - Quote accepted
- `quote_rejected` - Quote rejected
- `payment_received` - Payment processed
- `mission_completed` - Move completed
- `new_review` - New review received
- `document_verified` - Document approved
- `document_rejected` - Document rejected

---

## 📅 Scheduling & Availability

### `mover_availability`
Mover calendar availability.

```sql
CREATE TABLE mover_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE,

  -- Date range
  date date NOT NULL,
  is_available boolean DEFAULT true,

  -- Time slots
  slots jsonb DEFAULT '[]'::jsonb,

  created_at timestamptz DEFAULT now(),

  UNIQUE(mover_id, date)
);
```

---

## 📋 Contracts & Signatures

### `contracts`
Electronic contracts.

```sql
CREATE TABLE contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE CASCADE,

  -- Contract content
  content text NOT NULL,
  terms jsonb DEFAULT '{}'::jsonb,

  -- Status
  status text DEFAULT 'draft',

  created_at timestamptz DEFAULT now(),
  finalized_at timestamptz
);
```

### `electronic_signatures`
Digital signatures on contracts.

```sql
CREATE TABLE electronic_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Signature data
  signature_data text NOT NULL,
  ip_address text,
  user_agent text,

  created_at timestamptz DEFAULT now()
);
```

---

## 🔖 User Preferences

### `favorites`
Saved/favorited movers.

```sql
CREATE TABLE favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE,

  created_at timestamptz DEFAULT now(),

  UNIQUE(client_id, mover_id)
);
```

---

## 📊 Analytics & Logging

### `activity_logs`
Audit trail of system actions.

```sql
CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),

  -- Action details
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,

  -- Request info
  ip_address text,
  user_agent text,

  created_at timestamptz DEFAULT now()
);
```

### `fraud_alerts`
Security alerts and fraud detection.

```sql
CREATE TABLE fraud_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),

  -- Alert details
  alert_type text NOT NULL,
  severity text NOT NULL,
  description text NOT NULL,
  data jsonb,

  -- Status
  status text DEFAULT 'open',
  resolved_by uuid REFERENCES admins(id),
  resolution text,

  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);
```

---

## 🗺️ Geographic Data

### `activity_zones`
Mover service coverage areas.

```sql
CREATE TABLE activity_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE,

  -- Zone details
  zone_name text NOT NULL,
  departments text[] DEFAULT ARRAY[]::text[],
  cities text[] DEFAULT ARRAY[]::text[],
  postal_codes text[] DEFAULT ARRAY[]::text[],

  -- Pricing
  base_rate numeric(10,2),
  per_km_rate numeric(10,2),

  created_at timestamptz DEFAULT now()
);
```

---

## 📦 Storage Buckets

### `moving-photos`
Stores photos from moves.

**RLS Policies**:
- Movers can upload to their own moves
- Clients can upload to their own moves
- Admins can view all

### `identity-documents`
Stores identity and business documents.

**RLS Policies**:
- Movers can upload their own documents
- Admins can view all documents
- Clients cannot access

### `truck-photos`
Stores vehicle photos.

**RLS Policies**:
- Movers can upload their own truck photos
- Public can view verified movers' truck photos
- Admins can view all

---

## 🔐 Row Level Security (RLS)

All tables have RLS enabled with specific policies for:
- **Clients**: Can only access their own data
- **Movers**: Can only access their own profile and related quotes
- **Admins**: Can access all data with role-based restrictions
- **Public**: Limited read access to verified movers only

### Example RLS Policy:

```sql
-- Clients can view their own quote requests
CREATE POLICY "Clients can view own quote requests"
  ON quote_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

-- Movers can view quote requests in their area
CREATE POLICY "Movers can view available quote requests"
  ON quote_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = auth.uid()
      AND movers.is_verified = true
    )
  );
```

---

## 🚀 Database Functions

### Key Functions:

1. **`delete_mover_account(mover_id uuid)`**
   - Safely deletes mover account and all related data

2. **`release_payment(payment_id uuid)`**
   - Releases escrowed payment to mover

3. **`calculate_commission(amount numeric)`**
   - Calculates 30% platform commission

4. **`update_mover_rating(mover_id uuid)`**
   - Recalculates average rating from reviews

5. **`check_document_expiration()`**
   - Scheduled function to mark expired documents

---

## 📈 Database Indexes

Key indexes for performance:

```sql
-- Quote requests
CREATE INDEX idx_quote_requests_client_id ON quote_requests(client_id);
CREATE INDEX idx_quote_requests_status ON quote_requests(status);
CREATE INDEX idx_quote_requests_date ON quote_requests(moving_date);

-- Quotes
CREATE INDEX idx_quotes_request_id ON quotes(quote_request_id);
CREATE INDEX idx_quotes_mover_id ON quotes(mover_id);
CREATE INDEX idx_quotes_status ON quotes(status);

-- Movers
CREATE INDEX idx_movers_verified ON movers(is_verified);
CREATE INDEX idx_movers_city ON movers(city);
CREATE INDEX idx_movers_rating ON movers(average_rating);

-- Notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
```

---

## 💾 Total Database Size

Estimated production size:
- **Tables**: ~25 core tables
- **Indexes**: ~40 indexes
- **Functions**: ~15 stored procedures
- **Triggers**: ~20 automated triggers
- **RLS Policies**: ~100+ security policies

---

## 🔄 Data Flow

```
1. Client creates quote_request
   ↓
2. System calculates price_indicator
   ↓
3. Movers receive notification
   ↓
4. Movers submit quotes
   ↓
5. Client receives quotes
   ↓
6. Client accepts quote
   ↓
7. Payment is held in escrow
   ↓
8. Move is completed
   ↓
9. Payment is released to mover
   ↓
10. Client leaves review
```

---

This schema provides a complete, production-ready moving platform with:
- ✅ Secure authentication
- ✅ Quote management
- ✅ Escrow payments
- ✅ Document verification
- ✅ Reviews & ratings
- ✅ Messaging
- ✅ Notifications
- ✅ Admin controls
- ✅ Fraud detection
- ✅ Audit logging

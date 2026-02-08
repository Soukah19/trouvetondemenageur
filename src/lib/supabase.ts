import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

export type Mover = {
  id: string;
  user_id: string;
  company_name: string;
  siret: string;
  manager_firstname: string;
  manager_lastname: string;
  manager_phone: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  description: string;
  services: string[];
  coverage_area: string[];
  verification_status: 'pending' | 'verified' | 'rejected';
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MoverDocument = {
  id: string;
  mover_id: string;
  document_type: 'kbis' | 'insurance' | 'license' | 'other';
  document_name: string;
  document_url: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  verification_notes?: string;
  uploaded_at: string;
};

export type QuoteRequest = {
  id: string;
  client_user_id?: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  from_address: string;
  from_city: string;
  from_postal_code: string;
  to_address: string;
  to_city: string;
  to_postal_code: string;
  moving_date: string;
  date_flexibility_days?: number;
  home_size: string;
  home_type: string;
  floor_from: number;
  floor_to: number;
  elevator_from: boolean;
  elevator_to: boolean;
  elevator_capacity_from?: string;
  elevator_capacity_to?: string;
  volume_m3?: number;
  surface_m2?: number;
  services_needed: string[];
  additional_info?: string;
  status: 'new' | 'assigned' | 'quoted' | 'accepted' | 'completed' | 'cancelled';
  assigned_mover_id?: string;
  payment_status?: 'no_payment' | 'deposit_paid' | 'fully_paid' | 'refunded';
  accepted_quote_id?: string;
  is_data_masked?: boolean;
  created_at: string;
  updated_at: string;
};

export type Quote = {
  id: string;
  quote_request_id: string;
  mover_id: string;
  price: number;
  client_display_price: number;
  market_price_estimate: number;
  price_indicator: 'green' | 'orange' | 'red';
  proposed_moving_date?: string;
  notes?: string;
  message?: string;
  validity_date: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
};

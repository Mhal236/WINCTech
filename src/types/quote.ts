export interface Quote {
  id: string;
  quote_id?: string;
  customer_name: string;
  email: string;
  phone: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: string;
  glass_type: string;
  glass_types?: string[];
  service_type: string;
  postcode: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'unquoted';
  created_at: string;
  scheduled_date?: string;
  scheduled_time?: string;
  vehicleRegistration?: string;
  location?: string;
  technician_id?: string;
  technician_name?: string;
}


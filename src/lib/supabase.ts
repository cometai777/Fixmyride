import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Singleton pattern for the Supabase client to prevent "Multiple GoTrueClient instances" warning
let supabaseInstance: ReturnType<typeof createClient> | null = null;

if (!supabaseInstance) {
  const isValid = supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 50;
  if (!isValid) {
    console.info("Supabase credentials not configured or invalid. Initializing empty client for offline mode.");
  }
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

export const supabase = supabaseInstance;

/**
 * Mock Data for initial WOW effect and development
 */
export const mockData = {
  categories: [
    { id: 1, name: 'Engine Repair', code: 'ENG-001', description: 'Complete engine diagnostics and repair', is_active: true },
    { id: 2, name: 'Brake Service', code: 'BRK-001', description: 'Brake pad replacement and rotor resurfacing', is_active: true },
    { id: 3, name: 'Oil & Filter', code: 'OIL-001', description: 'Standard synthetic oil change', is_active: true },
    { id: 4, name: 'AC Service', code: 'AC-001', description: 'AC refrigerant recharge and leak testing', is_active: true },
    { id: 5, name: 'Body Work', code: 'BDY-001', description: 'Dent removal and paint touch-up', is_active: true },
  ],
  subcategories: {
    1: [
      { id: 101, name: 'Spark Plug Replacement', code: 'ENG-SUB-01', is_active: true },
      { id: 102, name: 'Timing Belt Change', code: 'ENG-SUB-02', is_active: true },
    ],
    2: [
      { id: 201, name: 'Front Brake Pads', code: 'BRK-SUB-01', is_active: true },
      { id: 202, name: 'Brake Fluid Flush', code: 'BRK-SUB-02', is_active: true },
    ]
  },
  bookings: [
    { id: 1001, customer_firstname: 'John', customer_lastname: 'Doe', customer_email: 'john@example.com', amount: 450, status: 'Completed', created_at: '2024-03-20T10:00:00Z', staff_name: 'Ahmed' },
    { id: 1002, customer_firstname: 'Sarah', customer_lastname: 'Smith', customer_email: 'sarah@test.com', amount: 1200, status: 'Pending', created_at: '2024-03-21T14:30:00Z', staff_name: 'Ali' },
    { id: 1003, customer_firstname: 'Robert', customer_lastname: 'Brown', customer_email: 'robert@auto.com', amount: 80, status: 'In Progress', created_at: '2024-03-22T09:15:00Z', staff_name: 'Mustafa' },
  ],
  payments: [
    { id: 1, amount: 450, payment_method: 'Credit Card', status: 'Success', customer_first_name: 'John', created_on: '10:05:00' },
    { id: 2, amount: 80, payment_method: 'Cash', status: 'Success', customer_first_name: 'Robert', created_on: '09:20:00' },
  ],
  invoices: [
    { id: 1, invoice_number: 'INV-2024-001', customer_email: 'john@example.com', total_tax: 22.5, total: 472.5, due_date: '2024-04-20' },
    { id: 2, invoice_number: 'INV-2024-002', customer_email: 'robert@auto.com', total_tax: 4, total: 84, due_date: '2024-04-22' }
  ],
  parts: [
    { id: 1, name: 'Brake Pad Set - Front', brand: 'Brembo', category_code: 'BRK-001', subcategory_code: 'BRK-SUB-01', sale_price: 350, quantity: 12, is_active: true },
    { id: 2, name: 'Engine Oil Filter', brand: 'Bosch', category_code: 'OIL-001', subcategory_code: 'OIL-SUB-01', sale_price: 45, quantity: 45, is_active: true },
    { id: 3, name: 'Spark Plug Platinum', brand: 'NGK', category_code: 'ENG-001', subcategory_code: 'ENG-SUB-01', sale_price: 25, quantity: 3, is_active: true }
  ]
};

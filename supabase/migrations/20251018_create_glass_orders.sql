-- Create glass_orders table to track all glass purchases
CREATE TABLE IF NOT EXISTS public.glass_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES app_users(id),
  technician_id TEXT REFERENCES technicians(id),
  
  -- Order Items
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Vehicle Information
  vrn TEXT,
  make TEXT,
  model TEXT,
  year TEXT,
  
  -- Pricing
  subtotal NUMERIC(10,2) NOT NULL,
  vat NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  
  -- Delivery Information
  delivery_option TEXT CHECK (delivery_option IN ('delivery', 'collection')),
  delivery_address TEXT,
  collection_address TEXT,
  
  -- Payment Information
  stripe_payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Order Status
  order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  
  -- Supplier Information
  supplier TEXT,
  depot_code TEXT,
  depot_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_glass_orders_user_id ON public.glass_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_glass_orders_technician_id ON public.glass_orders(technician_id);
CREATE INDEX IF NOT EXISTS idx_glass_orders_order_number ON public.glass_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_glass_orders_created_at ON public.glass_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_glass_orders_payment_status ON public.glass_orders(payment_status);

-- Enable Row Level Security
ALTER TABLE public.glass_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own glass orders"
  ON public.glass_orders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own glass orders"
  ON public.glass_orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own glass orders"
  ON public.glass_orders
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add comment to table
COMMENT ON TABLE public.glass_orders IS 'Stores all glass purchase orders made through the system';
COMMENT ON COLUMN public.glass_orders.order_number IS 'Unique order number (e.g., WC-2024-001234)';
COMMENT ON COLUMN public.glass_orders.items IS 'JSON array of ordered items with part numbers, descriptions, quantities, and prices';


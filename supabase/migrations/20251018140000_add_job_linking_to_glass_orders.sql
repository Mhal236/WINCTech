-- Add job linking columns to glass_orders table
ALTER TABLE public.glass_orders 
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public."MasterCustomer"(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Add index for faster job_id lookups
CREATE INDEX IF NOT EXISTS idx_glass_orders_job_id ON public.glass_orders(job_id);

-- Add comment for documentation
COMMENT ON COLUMN public.glass_orders.job_id IS 'Links glass order to an active job (MasterCustomer)';
COMMENT ON COLUMN public.glass_orders.customer_name IS 'Cached customer name from linked job for display purposes';


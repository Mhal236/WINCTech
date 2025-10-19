-- Add job_progress field to MasterCustomer table for detailed job tracking
ALTER TABLE public."MasterCustomer" 
ADD COLUMN IF NOT EXISTS job_progress TEXT DEFAULT 'assigned';

-- Add comment for documentation
COMMENT ON COLUMN public."MasterCustomer".job_progress IS 'Tracks detailed job progress: assigned, glass_ordered, glass_received, in_progress, completed';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_master_customer_job_progress ON public."MasterCustomer"(job_progress);


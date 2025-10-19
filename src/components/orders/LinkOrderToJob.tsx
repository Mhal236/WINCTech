import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ActiveJob {
  id: string;
  customer_name: string;
  vehicle_reg?: string;
  brand?: string;
  model?: string;
  year?: string;
  appointment_date?: string;
  vehicle_info: string;
}

interface LinkOrderToJobProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentJobId?: string | null;
  onSuccess?: () => void;
}

export const LinkOrderToJob: React.FC<LinkOrderToJobProps> = ({
  open,
  onOpenChange,
  orderId,
  currentJobId,
  onSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<ActiveJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(currentJobId || "");
  const [selectedJob, setSelectedJob] = useState<ActiveJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch active jobs
  useEffect(() => {
    if (open && user?.id) {
      fetchActiveJobs();
    }
  }, [open, user?.id]);

  // Filter jobs based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredJobs(activeJobs);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = activeJobs.filter(
        (job) =>
          job.customer_name.toLowerCase().includes(term) ||
          job.vehicle_reg?.toLowerCase().includes(term) ||
          job.vehicle_info.toLowerCase().includes(term)
      );
      setFilteredJobs(filtered);
    }
  }, [searchTerm, activeJobs]);

  // Update selected job when selection changes
  useEffect(() => {
    if (selectedJobId) {
      const job = activeJobs.find((j) => j.id === selectedJobId);
      setSelectedJob(job || null);
    } else {
      setSelectedJob(null);
    }
  }, [selectedJobId, activeJobs]);

  const fetchActiveJobs = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get technician ID
      let technicianId = null;
      const { data: techData1 } = await supabase
        .from("technicians")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (techData1) {
        technicianId = techData1.id;
      } else {
        const { data: techData2 } = await supabase
          .from("technicians")
          .select("id")
          .eq("contact_email", user.email)
          .single();

        if (techData2) {
          technicianId = techData2.id;
        }
      }

      if (!technicianId) {
        toast({
          title: "Error",
          description: "Technician profile not found",
          variant: "destructive",
        });
        return;
      }

      // Fetch ONLY active jobs (in_progress status)
      // Leads have status 'assigned', active jobs have 'in_progress'
      const response = await fetch("/api/technician/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const jobs = result.data
          .filter(
            (assignment: any) =>
              // Only include ACTIVE jobs (in_progress status)
              // This excludes:
              // - Leads (status: 'assigned')
              // - Completed jobs (status: 'completed')
              // - Cancelled jobs (status: 'cancelled')
              assignment.status === "in_progress" &&
              assignment.MasterCustomer &&
              assignment.MasterCustomer.id
          )
          .map((assignment: any) => ({
            id: assignment.MasterCustomer.id,
            customer_name: assignment.MasterCustomer.full_name,
            vehicle_reg: assignment.MasterCustomer.vehicle_reg,
            brand: assignment.MasterCustomer.brand,
            model: assignment.MasterCustomer.model,
            year: assignment.MasterCustomer.year,
            appointment_date: assignment.MasterCustomer.appointment_date,
            vehicle_info: `${assignment.MasterCustomer.year || ""} ${
              assignment.MasterCustomer.brand || ""
            } ${assignment.MasterCustomer.model || ""}`.trim(),
          }));

        setActiveJobs(jobs);
        setFilteredJobs(jobs);
      }
    } catch (error) {
      console.error("Error fetching active jobs:", error);
      toast({
        title: "Error",
        description: "Failed to load active jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkOrder = async () => {
    if (!selectedJobId || !selectedJob) {
      toast({
        title: "No Job Selected",
        description: "Please select a job to link this order to",
        variant: "destructive",
      });
      return;
    }

    try {
      setLinking(true);

      // Update glass order with job_id and customer_name
      const { error } = await supabase
        .from("glass_orders")
        .update({
          job_id: selectedJobId,
          customer_name: selectedJob.customer_name,
        })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Order Linked Successfully",
        description: `This order has been linked to ${selectedJob.customer_name}'s job`,
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error linking order:", error);
      toast({
        title: "Error",
        description: "Failed to link order to job",
        variant: "destructive",
      });
    } finally {
      setLinking(false);
    }
  };

  const handleContinueWithout = () => {
    onOpenChange(false);
  };

  const handleCreateNew = () => {
    navigate("/instant-leads");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Link this order</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Search Customer */}
          <div>
            <Label htmlFor="search-customer" className="text-base font-medium mb-2 block">
              Search customer
            </Label>
            <div className="relative">
              <Input
                id="search-customer"
                type="text"
                placeholder="Start typing to search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 pl-4 pr-10 border-2 border-[#0FB8C1] focus:border-[#0FB8C1] focus:ring-[#0FB8C1]"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Select Job Dropdown */}
          <div>
            <Label htmlFor="select-job" className="text-base font-medium mb-2 block">
              Select active job
            </Label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId} disabled={loading}>
              <SelectTrigger id="select-job" className="h-12 border-gray-300 bg-white">
                <SelectValue placeholder="Select an active job" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] bg-white">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Loading jobs...</div>
                ) : filteredJobs.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? "No matching jobs found" : "No active jobs available"}
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{job.customer_name}</span>
                        <span className="text-xs text-gray-500">
                          {job.vehicle_info} {job.vehicle_reg ? `— VRN: ${job.vehicle_reg}` : ""}
                          {job.appointment_date
                            ? ` — ${new Date(job.appointment_date).toLocaleDateString()}`
                            : ""}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Create New Link */}
          <div>
            <button
              onClick={handleCreateNew}
              className="text-[#0FB8C1] hover:text-[#0d9da5] font-medium text-sm"
            >
              Create new customer/job
            </button>
          </div>

          {/* Selected Job Preview */}
          {selectedJob && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-center gap-3">
              <div className="bg-[#0FB8C1] rounded-full p-2">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{selectedJob.customer_name}</p>
                <p className="text-sm text-gray-600">
                  {selectedJob.vehicle_info} {selectedJob.vehicle_reg ? `— VRN: ${selectedJob.vehicle_reg}` : ""}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleContinueWithout}
              className="flex-1 h-12 border-gray-300 hover:bg-gray-50"
              disabled={linking}
            >
              Continue without linking
            </Button>
            <Button
              onClick={handleLinkOrder}
              disabled={!selectedJobId || linking}
              className="flex-1 h-12 bg-[#0FB8C1] hover:bg-[#0d9da5] text-white"
            >
              {linking ? "Linking..." : "Link & Continue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, ChevronRight, Package, Wrench, MapPin, Receipt } from "lucide-react";

interface PriceBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  glassCost: number | null;
  glassDescription: string;
  labourCost: number;
  travelCost: number;
  distance: number;
  totalEstimate: number;
  onCreateJob: () => void;
  onEditDetails: () => void;
  creatingJob: boolean;
}

export function PriceBreakdownModal({
  open,
  onOpenChange,
  loading,
  glassCost,
  glassDescription,
  labourCost,
  travelCost,
  distance,
  totalEstimate,
  onCreateJob,
  onEditDetails,
  creatingJob,
}: PriceBreakdownModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Receipt className="h-6 w-6 text-[#145484]" />
            Price Estimate
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of estimated costs
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-[#145484] mb-4" />
            <p className="text-gray-600">Calculating price estimate...</p>
            <p className="text-sm text-gray-500 mt-2">
              Fetching glass prices and calculating travel costs
            </p>
          </div>
        ) : (
          <>
            {/* Price Breakdown */}
            <div className="space-y-4 py-4">
              {/* Glass Cost */}
              <div className="flex items-start justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Glass Part</p>
                    <p className="text-sm text-gray-600 mt-1">{glassDescription}</p>
                  </div>
                </div>
                <div className="text-right">
                  {glassCost !== null ? (
                    <p className="text-lg font-bold text-gray-900">
                      £{glassCost.toFixed(2)}
                    </p>
                  ) : (
                    <p className="text-sm text-amber-600">Price unavailable</p>
                  )}
                </div>
              </div>

              {/* Labour Cost */}
              <div className="flex items-start justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Wrench className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Labour</p>
                    <p className="text-sm text-gray-600 mt-1">
                      £{labourCost.toFixed(2)} per piece × 1 piece
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    £{labourCost.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Travel Cost */}
              <div className="flex items-start justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Travel</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {distance.toFixed(1)} miles @ £0.45/mile
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    £{travelCost.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Total */}
              <div className="border-t-2 border-gray-300 pt-4 mt-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#145484] to-[#23b7c0] rounded-lg">
                  <div>
                    <p className="text-white text-sm font-medium opacity-90">Total Estimate</p>
                    <p className="text-white text-3xl font-bold mt-1">
                      £{totalEstimate.toFixed(2)}
                    </p>
                  </div>
                  <CheckCircle2 className="h-12 w-12 text-white opacity-80" />
                </div>
              </div>

              {/* Info Alert */}
              <Alert className="border-amber-200 bg-amber-50">
                <AlertDescription className="text-amber-800 text-sm">
                  This is an estimate based on current glass prices and travel distance. 
                  Final price may vary based on actual installation requirements.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={onEditDetails}
                disabled={creatingJob}
                className="w-full sm:w-auto"
              >
                Edit Details
              </Button>
              <Button
                onClick={onCreateJob}
                disabled={creatingJob}
                className="w-full sm:w-auto bg-[#FFC107] hover:bg-[#e6ad06] text-black font-bold"
              >
                {creatingJob ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Job...
                  </>
                ) : (
                  <>
                    Create Job
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}


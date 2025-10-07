import { Quote } from "@/types/quote";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Phone,
  Mail,
  MapPin,
  Car,
  Calendar,
  Hash
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteTableProps {
  quotes: Quote[];
  onStatusChange?: (quoteId: string, newStatus: Quote['status']) => void;
  isSelectMode?: boolean;
  selectedQuoteIds?: Set<string>;
  onSelectQuote?: (quoteId: string) => void;
  onSelectAll?: () => void;
  sortField?: keyof Quote;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: keyof Quote) => void;
}

const getStatusColor = (status: Quote['status']) => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    unquoted: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colors[status] || colors.pending;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export function QuoteTable({
  quotes,
  onStatusChange,
  isSelectMode = false,
  selectedQuoteIds = new Set(),
  onSelectQuote,
  onSelectAll,
  sortField,
  sortDirection = 'desc',
  onSort,
}: QuoteTableProps) {
  const renderSortIcon = (field: keyof Quote) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4 text-blue-600" />
      : <ArrowDown className="ml-2 h-4 w-4 text-blue-600" />;
  };

  const handleSort = (field: keyof Quote) => {
    if (onSort) {
      onSort(field);
    }
  };

  return (
    <div className="w-full">
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {isSelectMode && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedQuoteIds.size === quotes.length && quotes.length > 0}
                    onCheckedChange={onSelectAll}
                  />
                </TableHead>
              )}
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('quote_id')}
              >
                <div className="flex items-center">
                  Quote ID
                  {renderSortIcon('quote_id')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('customer_name')}
              >
                <div className="flex items-center">
                  Customer
                  {renderSortIcon('customer_name')}
                </div>
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Glass Type</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('total_amount')}
              >
                <div className="flex items-center">
                  Amount
                  {renderSortIcon('total_amount')}
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center">
                  Created
                  {renderSortIcon('created_at')}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={isSelectMode ? 9 : 8} 
                  className="text-center py-8 text-gray-500"
                >
                  No quotes found
                </TableCell>
              </TableRow>
            ) : (
              quotes.map((quote) => (
                <TableRow 
                  key={quote.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {isSelectMode && (
                    <TableCell>
                      <Checkbox
                        checked={selectedQuoteIds.has(quote.id)}
                        onCheckedChange={() => onSelectQuote?.(quote.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-400" />
                      <span className="text-blue-600">{quote.quote_id || quote.id.slice(0, 8)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{quote.customer_name}</p>
                      {quote.postcode && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {quote.postcode}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {quote.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          <a 
                            href={`tel:${quote.phone}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {quote.phone}
                          </a>
                        </div>
                      )}
                      {quote.email && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          <a 
                            href={`mailto:${quote.email}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {quote.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {quote.vehicle_make} {quote.vehicle_model}
                        </p>
                        <p className="text-xs text-gray-500">
                          {quote.vehicle_year}
                          {quote.vehicleRegistration && ` • ${quote.vehicleRegistration}`}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{quote.glass_type}</p>
                      {quote.service_type && (
                        <p className="text-xs text-gray-500 capitalize">{quote.service_type}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-lg font-bold text-green-600">
                      £{quote.total_amount.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={cn("capitalize", getStatusColor(quote.status))}
                    >
                      {quote.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <div>
                        <p>{formatDate(quote.created_at)}</p>
                        <p className="text-xs text-gray-500">{formatTime(quote.created_at)}</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden space-y-4">
        {quotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No quotes found
          </div>
        ) : (
          quotes.map((quote) => (
            <div
              key={quote.id}
              className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow"
            >
              {isSelectMode && (
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Checkbox
                    checked={selectedQuoteIds.has(quote.id)}
                    onCheckedChange={() => onSelectQuote?.(quote.id)}
                  />
                  <span className="text-sm text-gray-600">Select this quote</span>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{quote.customer_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Hash className="h-3 w-3 text-gray-400" />
                    <span className="text-sm text-blue-600">{quote.quote_id || quote.id.slice(0, 8)}</span>
                  </div>
                </div>
                <Badge 
                  variant="outline"
                  className={cn("capitalize", getStatusColor(quote.status))}
                >
                  {quote.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Car className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {quote.vehicle_make} {quote.vehicle_model} ({quote.vehicle_year})
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <a 
                    href={`tel:${quote.phone}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {quote.phone}
                  </a>
                </div>

                {quote.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <a 
                      href={`mailto:${quote.email}`}
                      className="hover:text-blue-600 transition-colors truncate"
                    >
                      {quote.email}
                    </a>
                  </div>
                )}

                {quote.postcode && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{quote.postcode}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div>
                  <p className="text-xs text-gray-500">Glass Type</p>
                  <p className="text-sm font-medium text-gray-900">{quote.glass_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-xl font-bold text-green-600">£{quote.total_amount.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                <Calendar className="h-3 w-3" />
                <span>Created: {formatDate(quote.created_at)} at {formatTime(quote.created_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


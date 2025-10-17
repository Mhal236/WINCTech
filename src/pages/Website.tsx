import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, 
  Copy, 
  Upload, 
  Palette, 
  Settings, 
  Eye, 
  Code,
  CheckCircle,
  ExternalLink,
  Image as ImageIcon,
  Sparkles,
  Users,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { QuoteTable } from "@/components/quotes/QuoteTable";
import { Quote } from "@/types/quote";

export default function Website() {
  const { user } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState("https://api.windscreencompare.com/embed/technician");
  const [primaryColor, setPrimaryColor] = useState("#23b7c0");
  const [secondaryColor, setSecondaryColor] = useState("#145484");
  const [accentColor, setAccentColor] = useState("#FFC107");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Website Leads state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  // Helper function to transform MasterCustomer data to Quote format
  const transformMasterCustomerToQuote = (masterCustomer: any): Quote => {
    let glassTypes: string[] = [];
    let primaryGlassType = 'Windscreen';
    
    if (masterCustomer.selected_windows && Array.isArray(masterCustomer.selected_windows) && masterCustomer.selected_windows.length > 0) {
      masterCustomer.selected_windows.forEach((windowData: any) => {
        if (typeof windowData === 'string') {
          const glassType = parseGlassType(windowData);
          if (glassType && !glassTypes.includes(glassType)) {
            glassTypes.push(glassType);
          }
        }
      });
    }
    
    function parseGlassType(value: string): string {
      const lowerValue = value.toLowerCase();
      if (lowerValue.includes('windscreen') || lowerValue.includes('ws')) return 'Windscreen';
      if (lowerValue.includes('rear window') || lowerValue.includes('rw')) return 'Rear Window';
      if (lowerValue.includes('door')) return 'Door Glass';
      if (lowerValue.includes('side window')) return 'Side Window';
      return '';
    }
    
    if (glassTypes.length > 0) {
      primaryGlassType = glassTypes[0];
    }
    
    const displayGlassType = glassTypes.length > 1 ? glassTypes.join(' + ') : primaryGlassType;

    return {
      id: masterCustomer.id,
      quote_id: masterCustomer.quote_id,
      customer_name: masterCustomer.full_name || '',
      email: masterCustomer.email || '',
      phone: masterCustomer.mobile || '',
      vehicle_make: masterCustomer.brand || '',
      vehicle_model: masterCustomer.model || '',
      vehicle_year: masterCustomer.year || '',
      glass_type: displayGlassType,
      glass_types: glassTypes,
      service_type: masterCustomer.service_type || 'standard',
      postcode: masterCustomer.postcode || '',
      total_amount: masterCustomer.quote_price || 0,
      status: (!masterCustomer.quote_price || masterCustomer.quote_price === 0) 
        ? 'unquoted' 
        : (masterCustomer.status?.toLowerCase() as any || 'pending'),
      created_at: masterCustomer.created_at || new Date().toISOString(),
      scheduled_date: masterCustomer.appointment_date,
      vehicleRegistration: masterCustomer.vehicle_reg,
      location: masterCustomer.location,
    };
  };

  // Fetch website leads (leads that came from this technician's iframe)
  const { data: websiteLeadsData, isLoading: isLoadingLeads } = useQuery({
    queryKey: ['website-leads', user?.id, currentPage, searchQuery],
    queryFn: async () => {
      if (!user?.id) return { data: [], totalCount: 0, totalPages: 0 };

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      // Build query to get leads from iframe (source would be 'website' or 'iframe')
      let countQuery = supabase
        .from('MasterCustomer')
        .select('*', { count: 'exact', head: true })
        .not('quote_id', 'is', null)
        .or('source.eq.website,source.eq.iframe,lead_source.eq.website,lead_source.eq.iframe');

      let dataQuery = supabase
        .from('MasterCustomer')
        .select('*')
        .not('quote_id', 'is', null)
        .or('source.eq.website,source.eq.iframe,lead_source.eq.website,lead_source.eq.iframe');

      // Add search filter if search query exists
      if (searchQuery.trim()) {
        const searchTerm = searchQuery.trim();
        countQuery = countQuery.ilike('quote_id', `%${searchTerm}%`);
        dataQuery = dataQuery.ilike('quote_id', `%${searchTerm}%`);
      }

      // Get total count
      const { count: totalCount } = await countQuery;

      // Get paginated data
      const { data, error } = await dataQuery
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        toast({
          title: "Error fetching website leads",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return {
        data: data || [],
        totalCount: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / itemsPerPage)
      };
    },
    enabled: !!user?.id,
  });

  // Transform and process leads
  const websiteLeads = useMemo(() => {
    return websiteLeadsData?.data.map(masterCustomer => transformMasterCustomerToQuote(masterCustomer)) || [];
  }, [websiteLeadsData]);

  // Pagination helpers
  const totalPages = websiteLeadsData?.totalPages || 1;
  const totalItems = websiteLeadsData?.totalCount || 0;
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Generate iframe code based on current settings
  const generateIframeCode = () => {
    const params = new URLSearchParams({
      primary: primaryColor.replace('#', ''),
      secondary: secondaryColor.replace('#', ''),
      accent: accentColor.replace('#', ''),
      logo: logoPreview ? 'custom' : 'default'
    });

    return `<iframe 
  src="${webhookUrl}?${params.toString()}" 
  width="100%" 
  height="600" 
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"
  title="Windscreen Compare Booking Widget">
</iframe>`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The iframe code has been copied to your clipboard.",
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  return (
    <Sidebar>
      <PageTransition>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Globe className="h-8 w-8 text-blue-600" />
                    Website Integration
                  </h1>
                  <p className="mt-2 text-gray-600">
                    Embed our booking widget and track your website leads
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Pro Feature
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Tabs defaultValue="integration" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="integration" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Integration
                </TabsTrigger>
                <TabsTrigger value="leads" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Website Leads
                  {totalItems > 0 && (
                    <Badge variant="secondary" className="ml-1">{totalItems}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Integration Tab */}
              <TabsContent value="integration">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Configuration Panel */}
              <div className="space-y-6">
                {/* Webhook URL */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Embed Code
                    </CardTitle>
                    <CardDescription>
                      Copy this iframe code and paste it into your website where you want the booking widget to appear.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="webhook-url">Webhook URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="webhook-url"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          className="font-mono text-sm"
                          readOnly
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(webhookUrl)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="iframe-code">Complete Iframe Code</Label>
                      <Textarea
                        id="iframe-code"
                        value={generateIframeCode()}
                        className="font-mono text-sm min-h-[120px]"
                        readOnly
                      />
                      <Button
                        onClick={() => copyToClipboard(generateIframeCode())}
                        className="w-full"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Iframe Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Theme Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Theme Colors
                    </CardTitle>
                    <CardDescription>
                      Customise the colours to match your brand
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary-color">Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primary-color"
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-12 h-10 p-1 border rounded cursor-pointer"
                          />
                          <Input
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="font-mono text-sm"
                            placeholder="#23b7c0"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="secondary-color">Secondary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondary-color"
                            type="color"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="w-12 h-10 p-1 border rounded cursor-pointer"
                          />
                          <Input
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="font-mono text-sm"
                            placeholder="#145484"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="accent-color">Accent Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="accent-color"
                            type="color"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="w-12 h-10 p-1 border rounded cursor-pointer"
                          />
                          <Input
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="font-mono text-sm"
                            placeholder="#FFC107"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPrimaryColor("#23b7c0");
                          setSecondaryColor("#145484");
                          setAccentColor("#FFC107");
                        }}
                      >
                        Reset to Default
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Logo Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Custom Logo
                    </CardTitle>
                    <CardDescription>
                      Upload your company logo to appear in the booking widget
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {logoPreview ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="max-h-24 max-w-full object-contain"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={resetLogo}>
                            Remove Logo
                          </Button>
                          <Label htmlFor="logo-upload" className="cursor-pointer">
                            <Button variant="outline" asChild>
                              <span>
                                <Upload className="h-4 w-4 mr-2" />
                                Change Logo
                              </span>
                            </Button>
                          </Label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Label htmlFor="logo-upload" className="cursor-pointer">
                          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <span className="text-sm font-medium text-gray-700">
                              Click to upload logo
                            </span>
                            <span className="text-xs text-gray-500">
                              PNG, JPG, SVG up to 2MB
                            </span>
                          </div>
                        </Label>
                      </div>
                    )}
                    
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Preview Panel */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Live Preview
                    </CardTitle>
                    <CardDescription>
                      See how your booking widget will look on your website
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <div 
                        className="bg-white rounded-lg shadow-lg p-6 min-h-[400px]"
                        style={{
                          borderTop: `4px solid ${primaryColor}`,
                        }}
                      >
                        {/* Mock widget header */}
                        <div className="flex items-center gap-3 mb-6">
                          {logoPreview ? (
                            <img 
                              src={logoPreview} 
                              alt="Custom logo" 
                              className="h-8 w-auto"
                            />
                          ) : (
                            <div 
                              className="w-8 h-8 rounded"
                              style={{ backgroundColor: primaryColor }}
                            />
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              Book Your Windscreen Repair
                            </h3>
                            <p className="text-sm text-gray-600">
                              Quick and professional service
                            </p>
                          </div>
                        </div>

                        {/* Mock form elements */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              Vehicle Registration
                            </label>
                            <div className="h-10 bg-gray-50 border rounded px-3 flex items-center text-sm text-gray-500">
                              Enter your reg number
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              Service Type
                            </label>
                            <div className="h-10 bg-gray-50 border rounded px-3 flex items-center text-sm text-gray-500">
                              Select service type
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                Date
                              </label>
                              <div className="h-10 bg-gray-50 border rounded px-3 flex items-center text-sm text-gray-500">
                                Select date
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                Time
                              </label>
                              <div className="h-10 bg-gray-50 border rounded px-3 flex items-center text-sm text-gray-500">
                                Select time
                              </div>
                            </div>
                          </div>

                          <button
                            className="w-full h-12 rounded font-medium text-white transition-colors"
                            style={{
                              backgroundColor: primaryColor,
                            }}
                          >
                            Book Appointment
                          </button>

                          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                            <CheckCircle className="h-3 w-3" style={{ color: accentColor }} />
                            Secure booking powered by Windscreen Compare
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Implementation Guide */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Implementation Guide
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          1
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Copy the iframe code</p>
                          <p className="text-sm text-gray-600">Use the generated iframe code above</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          2
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Paste into your website</p>
                          <p className="text-sm text-gray-600">Add the code where you want the booking widget to appear</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          3
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Test the integration</p>
                          <p className="text-sm text-gray-600">Make sure the widget loads correctly and matches your branding</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ExternalLink className="h-4 w-4" />
                      <span>Need help? Contact our support team for integration assistance</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
              </TabsContent>

              {/* Website Leads Tab */}
              <TabsContent value="leads" className="space-y-4">
                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center gap-2 p-3 sm:p-4 bg-white rounded-lg border border-gray-200 flex-1">
                    <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <Input
                      placeholder="Search Quote ID..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="flex-1 min-w-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSearchChange('')}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                {/* Results Summary */}
                {totalItems > 0 && (
                  <div className="text-sm text-gray-600">
                    {searchQuery
                      ? `Found ${totalItems} matching lead${totalItems === 1 ? '' : 's'}`
                      : `Showing ${startItem}-${endItem} of ${totalItems} website leads`}
                  </div>
                )}

                {/* Leads Table */}
                <Card>
                  <div className="overflow-x-auto">
                    {isLoadingLeads ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-600 border-t-transparent"></div>
                        <p className="mt-2 text-gray-600">Loading website leads...</p>
                      </div>
                    ) : websiteLeads.length === 0 ? (
                      <div className="text-center py-12">
                        {searchQuery ? (
                          <div className="space-y-3">
                            <Users className="h-12 w-12 mx-auto text-gray-400" />
                            <p className="text-gray-600">No leads found matching "{searchQuery}"</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleSearchChange('')}
                            >
                              Clear search
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Users className="h-12 w-12 mx-auto text-gray-400" />
                            <div>
                              <p className="text-gray-900 font-medium">No website leads yet</p>
                              <p className="text-sm text-gray-500 mt-1">
                                Leads from your website embed will appear here
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <QuoteTable 
                          quotes={websiteLeads}
                          onStatusChange={() => {}}
                          isSelectMode={false}
                          selectedQuoteIds={new Set()}
                          onSelectQuote={() => {}}
                          onSelectAll={() => {}}
                          sortField="created_at"
                          sortDirection="desc"
                          onSort={() => {}}
                        />
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 py-4 border-t">
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1}
                                className="gap-2"
                              >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                              </Button>
                              
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                  let pageNumber;
                                  if (totalPages <= 5) {
                                    pageNumber = i + 1;
                                  } else if (currentPage <= 3) {
                                    pageNumber = i + 1;
                                  } else if (currentPage >= totalPages - 2) {
                                    pageNumber = totalPages - 4 + i;
                                  } else {
                                    pageNumber = currentPage - 2 + i;
                                  }
                                  
                                  return (
                                    <Button
                                      key={pageNumber}
                                      variant={currentPage === pageNumber ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setCurrentPage(pageNumber)}
                                      className="w-8 h-8 p-0"
                                    >
                                      {pageNumber}
                                    </Button>
                                  );
                                })}
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className="gap-2"
                              >
                                Next
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="text-sm text-gray-500 text-center sm:text-right">
                              Page {currentPage} of {totalPages}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </PageTransition>
    </Sidebar>
  );
}

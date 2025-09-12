import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Sparkles
} from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { toast } from "@/hooks/use-toast";

export default function Website() {
  const [webhookUrl, setWebhookUrl] = useState("https://api.windscreencompare.com/embed/technician");
  const [primaryColor, setPrimaryColor] = useState("#23b7c0");
  const [secondaryColor, setSecondaryColor] = useState("#135084");
  const [accentColor, setAccentColor] = useState("#FFC107");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

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
                    Embed our booking widget on your website with custom branding
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
                      Customize the colors to match your brand
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
                            placeholder="#135084"
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
                          setSecondaryColor("#135084");
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
          </div>
        </div>
      </PageTransition>
    </Sidebar>
  );
}

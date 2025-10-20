import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Monitor, Smartphone, Sun, Moon, Upload, Image as ImageIcon, Type, Palette, Globe as GlobeIcon, BarChart } from "lucide-react";
import { SlidePageTransition } from "@/components/PageTransition";

// Theme data with actual car/windscreen images
const themes = [
  {
    id: "dynamic",
    name: "Dynamic",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBynuQCv3TMVBF3aLWm98KMmLtJHYHsB57FIR4f7gB13KmsDL-oDltviRxgO0LjdOddem2RGq9PX17TxkOEkemEVmoVb9nGB4FQD_MMiFTR5CiFT2Tn3h8-h_7z1CWD-ot_YW541Z5CyJN9W4esm7fo_fqz-yM0NDTrlhU0nQBGcVqNU8n6Bp25tA-5GJgoxcJmshnyZZE87LalbU7Bd1QlXqKhwThEqm7oCT_TkzONoFQNsqDTtf7WZf41wQmbHjeUAbwArrNq8sk",
  },
  {
    id: "sleek",
    name: "Sleek",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVc-yRlZJ5F-PZpHD9ZTufhq4QjkS6n-HCKR0XFNEBPE72bEEus_4HZbaHEfo6b4Wg0e7lwF8wVOMq9aQg4rdcGo2MtpvQv_B1zgwLYhHhF_qqZQ6eSDxsrYAwMNvMg9PAWB7dg5t4nGLeAUV-Tq27-Xy_LDoBOw9WhWxDSYr7wMAe8iiMFN2BVduV-mQLV_jHpL43syHW6BuG598NyxAIbPSDLTNeu8n0IJb_sE28SFH4fUbBhBbb-W9G9iNAHQaS0QyScrDo4U0",
  },
  {
    id: "professional",
    name: "Professional",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAaOPZE2cJ6rg33tggLD9q0Awy8Sdn8Wt9tenWaaiXSUfv6jzZTGRZlhL31ImV7XNTUQBhUP8hRMzr9DUBVsEyyAG9ivsjXAwZ2kPJGnGQfzaM4nuRQaklyRXn2Nlj1j7A65j569kuV19RtgLexJlW2uz-AcXQg0FnqXy5nQ_PqdyaN2phhbNkxdtGLE6os8EEgHK1hqUMOtWpy5vmSBFatgJocniTaQqp9iLj1h2M7IAtrg1DIWWUjmIL0BBqjDO4zrBhrQkeTaus",
  },
  {
    id: "trusty",
    name: "Trusty",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBMXgC9Cq9zd0PHR38tJfFtCr-hof09q5zd8CblNia0jymOSdsyuf_uYKlbpyscR8nBmsSo1fJfHx4bcYF8WvJ8we5juN7bjdIxt5DsvvfmOuG3CIntMRiZIm9XvYc-dvkEYTc0LMMwp_SBXsAV-onK98hYDCTV0DJNYap_txEcwW1uJrKqNdXuFtMZVpGSoqTYG1DCBMOawQlyzB8wmggpPXRgPQpk0XrzV8qsA8dh_p_FIjuIyu_XgHrTOZ6DiVdFerBJroFoYOU",
  },
];

export default function Templates() {
  const [selectedTheme, setSelectedTheme] = useState("dynamic");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");
  const [activeTab, setActiveTab] = useState("theme");
  
  // Content tab state
  const [businessName, setBusinessName] = useState("Your Business Name");
  const [tagline, setTagline] = useState("Professional Windscreen Replacement & Repair");
  const [heroTitle, setHeroTitle] = useState("Your Professional Website, Made Easy");
  const [heroSubtitle, setHeroSubtitle] = useState("Create a stunning website for your business in minutes.");
  const [aboutText, setAboutText] = useState("We are experts in windscreen replacement and repair with over 10 years of experience.");
  
  // Customise tab state
  const [primaryColor, setPrimaryColor] = useState("#00e5e6");
  const [fontFamily, setFontFamily] = useState("Inter");
  
  // Domain tab state
  const [customDomain, setCustomDomain] = useState("");
  
  // SEO tab state
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const tabs = ["Theme", "Content", "Customise", "Domain", "SEO & Analytics"];

  // Calculate progress based on active tab
  const getCurrentStep = () => {
    const index = tabs.findIndex(tab => tab.toLowerCase() === activeTab);
    return index !== -1 ? index + 1 : 1;
  };

  const getProgressPercentage = () => {
    const step = getCurrentStep();
    return (step / tabs.length) * 100;
  };

  return (
    <DashboardLayout>
      <SlidePageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 -left-4 w-96 h-96 bg-[#0FB8C1]/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-700" />
          </div>

          {/* Modern Header */}
          <div className="relative backdrop-blur-xl bg-white/80 border border-gray-200/50 shadow-sm rounded-3xl m-4">
            <div className="px-6 py-10">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <div className="w-1 h-10 bg-gradient-to-b from-[#0FB8C1] via-[#0FB8C1]/70 to-transparent rounded-full" />
                      <h1 className="text-4xl font-light tracking-tight text-gray-900">
                        Website Builder<span className="text-[#0FB8C1] font-normal">.</span>
                      </h1>
                    </div>
                    <p className="text-gray-600 text-base font-light ml-5 tracking-wide">
                      Create your professional website in minutes
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline">Preview</Button>
                    <Button className="bg-[#0FB8C1] hover:bg-[#0da5ad] text-white">Publish</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            {/* Step Indicator Card */}
            <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
              <div className="px-6 py-5 bg-gradient-to-r from-[#0FB8C1]/5 via-transparent to-blue-500/5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Step {getCurrentStep()} of {tabs.length}
                    </p>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {tabs[getCurrentStep() - 1]}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-1.5 h-1.5 bg-[#0FB8C1] rounded-full animate-pulse"></div>
                    <span>Customizing</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-1.5 bg-gradient-to-r from-[#0FB8C1] to-[#0da5ad] rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Enhanced Tabs */}
              <div className="border-b border-gray-100">
                <div className="px-6">
                  <nav className="flex items-center justify-center -mb-px">
                    {tabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase())}
                        className={`relative px-6 py-4 text-sm font-medium transition-all duration-200 ${
                          activeTab === tab.toLowerCase()
                            ? "text-[#0FB8C1]"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        <span>{tab}</span>
                        {activeTab === tab.toLowerCase() && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0FB8C1] to-[#0da5ad] rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 bg-white rounded-xl shadow-sm">

                {/* Theme Cards */}
                {activeTab === "theme" && (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {themes.map((theme) => (
                      <div
                        key={theme.id}
                        className="relative group cursor-pointer"
                        onClick={() => setSelectedTheme(theme.id)}
                      >
                        <div
                          className="bg-cover bg-center flex flex-col gap-3 rounded-lg justify-end p-4 aspect-[4/3]"
                          style={{
                            backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 100%), url("${theme.image}")`,
                          }}
                        >
                          <p className="text-white text-lg font-bold leading-tight">{theme.name}</p>
                        </div>
                        <div className="absolute inset-0 bg-[#00e5e6]/80 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white font-bold">Select Theme</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Content Tab */}
                {activeTab === "content" && (
                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900">Business Information</h3>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="businessName">Business Name</Label>
                          <Input
                            id="businessName"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="Your Business Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tagline">Tagline</Label>
                          <Input
                            id="tagline"
                            value={tagline}
                            onChange={(e) => setTagline(e.target.value)}
                            placeholder="Your business tagline"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Hero Section
                      </h3>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="heroTitle">Hero Title</Label>
                          <Input
                            id="heroTitle"
                            value={heroTitle}
                            onChange={(e) => setHeroTitle(e.target.value)}
                            placeholder="Main headline"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                          <Input
                            id="heroSubtitle"
                            value={heroSubtitle}
                            onChange={(e) => setHeroSubtitle(e.target.value)}
                            placeholder="Subtitle text"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Hero Image</Label>
                          <Button variant="outline" className="w-full justify-start">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Hero Image
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Type className="h-5 w-5" />
                        About Section
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="aboutText">About Your Business</Label>
                        <Textarea
                          id="aboutText"
                          value={aboutText}
                          onChange={(e) => setAboutText(e.target.value)}
                          placeholder="Tell customers about your business"
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Customise Tab */}
                {activeTab === "customise" && (
                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Colors
                      </h3>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="primaryColor">Primary Color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="primaryColor"
                              type="color"
                              value={primaryColor}
                              onChange={(e) => setPrimaryColor(e.target.value)}
                              className="w-20 h-10 cursor-pointer"
                            />
                            <Input
                              value={primaryColor}
                              onChange={(e) => setPrimaryColor(e.target.value)}
                              placeholder="#00e5e6"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Type className="h-5 w-5" />
                        Typography
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="fontFamily">Font Family</Label>
                        <select
                          id="fontFamily"
                          value={fontFamily}
                          onChange={(e) => setFontFamily(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="Inter">Inter</option>
                          <option value="Roboto">Roboto</option>
                          <option value="Open Sans">Open Sans</option>
                          <option value="Lato">Lato</option>
                          <option value="Montserrat">Montserrat</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900">Logo</h3>
                      <Button variant="outline" className="w-full justify-start">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Logo
                      </Button>
                    </div>
                  </div>
                )}

                {/* Domain Tab */}
                {activeTab === "domain" && (
                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <GlobeIcon className="h-5 w-5" />
                        Custom Domain
                      </h3>
                      <p className="text-sm text-gray-600">
                        Connect your own domain name to your website for a professional look.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="customDomain">Domain Name</Label>
                        <Input
                          id="customDomain"
                          value={customDomain}
                          onChange={(e) => setCustomDomain(e.target.value)}
                          placeholder="www.yourbusiness.com"
                        />
                      </div>
                      <Button className="bg-[#00e5e6] hover:bg-[#00d4d5] text-slate-900 font-bold">
                        Connect Domain
                      </Button>
                    </div>

                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-slate-900">Need a domain?</h4>
                      <p className="text-sm text-gray-600">
                        We can help you register a new domain name for your business.
                      </p>
                      <Button variant="outline">
                        Search Available Domains
                      </Button>
                    </div>
                  </div>
                )}

                {/* SEO & Analytics Tab */}
                {activeTab === "seo & analytics" && (
                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <BarChart className="h-5 w-5" />
                        Search Engine Optimization
                      </h3>
                      <p className="text-sm text-gray-600">
                        Optimize your website for search engines to help customers find you online.
                      </p>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="metaTitle">Page Title</Label>
                          <Input
                            id="metaTitle"
                            value={metaTitle}
                            onChange={(e) => setMetaTitle(e.target.value)}
                            placeholder="Best Windscreen Repair Services | Your Business"
                            maxLength={60}
                          />
                          <p className="text-xs text-gray-500">{metaTitle.length}/60 characters</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="metaDescription">Meta Description</Label>
                          <Textarea
                            id="metaDescription"
                            value={metaDescription}
                            onChange={(e) => setMetaDescription(e.target.value)}
                            placeholder="Professional windscreen replacement and repair services. Fast, reliable, and affordable."
                            rows={3}
                            maxLength={160}
                          />
                          <p className="text-xs text-gray-500">{metaDescription.length}/160 characters</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900">Analytics</h3>
                      <p className="text-sm text-gray-600">
                        Track your website visitors and performance with Google Analytics.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="analyticsId">Google Analytics ID</Label>
                        <Input
                          id="analyticsId"
                          placeholder="G-XXXXXXXXXX"
                        />
                      </div>
                      <Button variant="outline">
                        Learn How to Get Analytics ID
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Preview */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-900">Live Preview</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewMode("desktop")}
                      className={`p-2 rounded-lg transition-colors ${
                        previewMode === "desktop"
                          ? "bg-gray-200 text-slate-700"
                          : "hover:bg-gray-200 text-slate-700"
                      }`}
                    >
                      <Monitor className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setPreviewMode("mobile")}
                      className={`p-2 rounded-lg transition-colors ${
                        previewMode === "mobile"
                          ? "bg-gray-200 text-slate-700"
                          : "hover:bg-gray-200 text-slate-700"
                      }`}
                    >
                      <Smartphone className="h-5 w-5" />
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-2"></div>
                    <button
                      onClick={() => setColorMode("light")}
                      className={`p-2 rounded-lg transition-colors ${
                        colorMode === "light"
                          ? "bg-gray-200 text-slate-700"
                          : "hover:bg-gray-200 text-slate-700"
                      }`}
                    >
                      <Sun className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setColorMode("dark")}
                      className={`p-2 rounded-lg transition-colors ${
                        colorMode === "dark"
                          ? "bg-gray-200 text-slate-700"
                          : "hover:bg-gray-200 text-slate-700"
                      }`}
                    >
                      <Moon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                  <div className="w-full h-[800px] overflow-y-auto rounded-lg">
                    <div 
                      className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat items-center justify-center p-4 rounded-t-lg"
                      style={{
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.6) 100%), url("https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=1600&auto=format&fit=crop&q=80")`,
                      }}
                    >
                      <div className="flex flex-col gap-2 text-center max-w-3xl">
                        <h1 className="text-white text-4xl sm:text-5xl font-black leading-tight tracking-tight">
                          {heroTitle}
                        </h1>
                        <h2 className="text-white text-sm sm:text-base font-normal leading-normal">
                          {heroSubtitle}
                        </h2>
                      </div>
                      <Button 
                        className="h-10 px-4 sm:h-12 sm:px-5 font-bold text-slate-900"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Get Started
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SlidePageTransition>
    </DashboardLayout>
  );
}

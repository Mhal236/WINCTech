import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Star, Search, Filter, Package, Truck, Shield, Award } from "lucide-react";
import { SlidePageTransition } from "@/components/PageTransition";

// Professional windscreen supplies from carglasstools.com
const dummyProducts = [
  {
    id: 1,
    name: "DuPont Betaseal 1580 Adhesive Sausage Kit",
    description: "Premium polyurethane adhesive for professional windscreen installation",
    price: 0,
    originalPrice: null,
    image: "/images/glass/Dupont1580AdhesiveSausageKit1_1024x1024.webp",
    category: "Adhesives",
    rating: 4.9,
    reviews: 287,
    inStock: true,
    isPromo: true,
    promoText: "PROFESSIONAL",
    features: ["Fast curing", "Weather resistant", "OEM approved"],
    url: "https://carglasstools.com/collections/adhesive-polyurethane/products/dupont-betaseal-1580-adhesive-sausage-kit"
  },
  {
    id: 2,
    name: "WRD Orange Bat Cut Out Tool Kit",
    description: "Complete wire and fibre cut out tool kit for windscreen removal",
    price: 0,
    originalPrice: null,
    image: "/images/glass/WrdOrangeBatCut-OutTool_1024x1024.webp",
    category: "Tools",
    rating: 4.8,
    reviews: 143,
    inStock: true,
    isPromo: false,
    features: ["Ergonomic design", "Professional grade", "Complete kit"],
    url: "http://carglasstools.com/collections/wire-fibre-cut-out-tools/products/wrd-orange-bat-cut-out-tool-kit"
  },
  {
    id: 3,
    name: "SensorTack 2",
    description: "Advanced adhesive gel pad for sensor and component mounting",
    price: 0,
    originalPrice: null,
    image: "/images/glass/Sensortack2.webp",
    category: "Gels & Pads",
    rating: 4.7,
    reviews: 98,
    inStock: true,
    isPromo: false,
    features: ["Secure mounting", "Reusable", "Temperature resistant"],
    url: "https://carglasstools.com/collections/gels-pads/products/sensortack-2"
  },
  {
    id: 4,
    name: "WRD Spider Cutting Line",
    description: "Premium cutting wire for precise windscreen removal",
    price: 0,
    originalPrice: null,
    image: "/images/glass/WrdSpiderCuttingLine96m_1024x1024.webp",
    category: "Wires & Cutting",
    rating: 4.6,
    reviews: 176,
    inStock: true,
    isPromo: false,
    features: ["High strength", "Precision cutting", "Professional quality"],
    url: "https://carglasstools.com/collections/wires-cutting-lines/products/wrd-spider-cutting-line"
  },
  {
    id: 5,
    name: "Betaclean 3350 Solvent Bonding Cleaner",
    description: "Industrial-grade cleaning solvent for optimal bonding surfaces",
    price: 0,
    originalPrice: null,
    image: "/images/glass/Dupont_Betaclean_3350_Surface_Cleaner_1ltr_e719fd54-e385-41ed-8e1b-2a98267349d8_1024x1024.webp",
    category: "Cleaning",
    rating: 4.9,
    reviews: 201,
    inStock: true,
    isPromo: true,
    promoText: "BESTSELLER",
    features: ["Fast evaporation", "Professional formula", "OEM recommended"],
    url: "https://carglasstools.com/collections/cleaning-supplies/products/betaclean-3350-solvent-bonding-cleaner"
  },
  {
    id: 6,
    name: "Esprit Resin Pack",
    description: "Professional windscreen repair resin for chip and crack repairs",
    price: 0,
    originalPrice: null,
    image: "/images/glass/resin-packs_1024x1024.webp",
    category: "Repair",
    rating: 4.8,
    reviews: 134,
    inStock: true,
    isPromo: false,
    features: ["Crystal clear finish", "UV resistant", "Professional results"],
    url: "https://carglasstools.com/collections/windscreen-repair/products/esprit-resin-pack"
  }
];

const categories = ["All", "Adhesives", "Tools", "Gels & Pads", "Wires & Cutting", "Cleaning", "Repair"];

export default function ShopSupplies() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("name");

  // Filter and sort products
  const filteredProducts = dummyProducts
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(product => 
      selectedCategory === "All" || product.category === selectedCategory
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
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
                        Shop Supplies<span className="text-[#0FB8C1] font-normal">.</span>
                      </h1>
                    </div>
                    <p className="text-gray-600 text-base font-light ml-5 tracking-wide">
                      Professional tools and supplies for windscreen technicians
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-light">
                    <Truck className="h-4 w-4 text-[#0FB8C1]" />
                    <span>Free shipping on orders over £50</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Promotional Banner */}
            <div className="bg-gradient-to-r from-[#23b7c0] via-[#1a9ca5] to-[#148189] rounded-lg p-6 mb-8 text-white">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Special Offers</h2>
                  <p className="text-teal-100">Get up to 25% off on selected professional tools and supplies</p>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                  <Award className="h-6 w-6" />
                  <span className="font-semibold">Professional Grade</span>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="relative">
                    {product.isPromo && (
                      <Badge 
                        className="absolute top-4 right-4 z-10"
                        variant={product.promoText === "BESTSELLER" ? "default" : "destructive"}
                      >
                        {product.promoText}
                      </Badge>
                    )}
                    <div className="aspect-square bg-white rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-gray-100">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-contain p-4"
                      />
                    </div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {renderStars(product.rating)}
                      </div>
                      <span className="text-sm text-gray-600">
                        {product.rating} ({product.reviews} reviews)
                      </span>
                    </div>

                    {/* Features */}
                    <div className="space-y-1">
                      {product.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <Shield className="h-3 w-3 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Category */}
                    <Badge variant="outline" className="w-fit">
                      {product.category}
                    </Badge>
                  </CardContent>

                  <CardFooter className="flex items-center justify-between pt-4">
                    <div className="flex flex-col">
                      {product.price > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-900">
                            £{product.price.toFixed(2)}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              £{product.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-600 font-medium">
                          View pricing on website
                        </span>
                      )}
                      {!product.inStock && (
                        <span className="text-sm text-red-600 font-medium">Out of Stock</span>
                      )}
                    </div>
                    
                    <Button 
                      asChild
                      className="flex items-center gap-2 btn-glisten"
                    >
                      <a href={product.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        View Product
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
              </div>
            )}
          </div>
        </div>
      </SlidePageTransition>
    </DashboardLayout>
  );
}

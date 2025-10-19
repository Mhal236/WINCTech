import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Star, Search, Filter, Package, Truck, Shield, Award } from "lucide-react";
import { SlidePageTransition } from "@/components/PageTransition";

// Dummy promotional products data
const dummyProducts = [
  {
    id: 1,
    name: "Professional Glass Cleaner Kit",
    description: "Premium glass cleaning solution with microfiber cloths and squeegee",
    price: 29.99,
    originalPrice: 39.99,
    image: "/placeholder.svg",
    category: "Cleaning",
    rating: 4.8,
    reviews: 156,
    inStock: true,
    isPromo: true,
    promoText: "25% OFF",
    features: ["Streak-free formula", "Professional grade", "Includes 3 cloths"]
  },
  {
    id: 2,
    name: "Windscreen Protection Film",
    description: "High-quality protective film for windscreen installation",
    price: 15.50,
    originalPrice: null,
    image: "/placeholder.svg",
    category: "Protection",
    rating: 4.6,
    reviews: 89,
    inStock: true,
    isPromo: false,
    features: ["Easy application", "Bubble-free", "Removable"]
  },
  {
    id: 3,
    name: "Technician Tool Set",
    description: "Complete set of specialized tools for windscreen installation",
    price: 149.99,
    originalPrice: 199.99,
    image: "/placeholder.svg",
    category: "Tools",
    rating: 4.9,
    reviews: 234,
    inStock: true,
    isPromo: true,
    promoText: "BESTSELLER",
    features: ["12-piece set", "Professional quality", "Carrying case included"]
  },
  {
    id: 4,
    name: "Adhesive Primer Pen",
    description: "High-performance primer for optimal adhesion",
    price: 8.99,
    originalPrice: null,
    image: "/placeholder.svg",
    category: "Adhesives",
    rating: 4.7,
    reviews: 67,
    inStock: true,
    isPromo: false,
    features: ["Fast-acting", "Weather resistant", "Easy application"]
  },
  {
    id: 5,
    name: "Safety Equipment Bundle",
    description: "Complete safety kit including gloves, glasses, and protective gear",
    price: 45.00,
    originalPrice: 60.00,
    image: "/placeholder.svg",
    category: "Safety",
    rating: 4.5,
    reviews: 123,
    inStock: true,
    isPromo: true,
    promoText: "LIMITED TIME",
    features: ["CE certified", "Multiple sizes", "High visibility"]
  },
  {
    id: 6,
    name: "Mobile Workstation Mat",
    description: "Non-slip mat for organizing tools and protecting surfaces",
    price: 24.99,
    originalPrice: null,
    image: "/placeholder.svg",
    category: "Accessories",
    rating: 4.4,
    reviews: 45,
    inStock: false,
    isPromo: false,
    features: ["Water resistant", "Easy to clean", "Portable design"]
  }
];

const categories = ["All", "Cleaning", "Protection", "Tools", "Adhesives", "Safety", "Accessories"];

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
                    <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                      <Package className="h-16 w-16 text-gray-400" />
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
                      {!product.inStock && (
                        <span className="text-sm text-red-600 font-medium">Out of Stock</span>
                      )}
                    </div>
                    
                    <Button 
                      asChild
                      className="flex items-center gap-2 btn-glisten"
                    >
                      <a href="https://carglasstools.com" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Go to website
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

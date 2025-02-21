import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { jobsData } from "@/data/jobs";
import { Button } from "@/components/ui/button";
import { Clock, User, PoundSterling, Shield, Car, Info, MapPin } from "lucide-react";
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

declare const L: any; // Add this line to handle Leaflet Routing Machine typing

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Add custom marker icons
const urgentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const soonIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const laterIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const JobSwipe = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [routingControl, setRoutingControl] = useState<any>(null);
  const [acceptedJob, setAcceptedJob] = useState<any>(null);
  const currentJob = jobsData[currentIndex];
  const mapRef = React.useRef<L.Map | null>(null);
  const navigate = useNavigate();

  // Get user's location when component mounts
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      });
    }
  }, []);

  const handleMarkerClick = (index: number) => {
    if (!isAccepted) {
      setCurrentIndex(index);
    }
  };

  const handleAcceptJob = (e: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (e) e.stopPropagation();
    
    localStorage.setItem('currentJob', JSON.stringify(currentJob));
    setIsAccepted(true);
    setShowDetails(false);
    setAcceptedJob(currentJob);

    if (mapRef.current && userLocation) {
      // Clear existing route if any
      if (routingControl) {
        mapRef.current.removeControl(routingControl);
      }

      // Create new routing control
      const control = L.Routing.control({
        waypoints: [
          L.latLng(userLocation[0], userLocation[1]),
          L.latLng(currentJob.location.lat, currentJob.location.lng)
        ],
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1'
        }),
        lineOptions: {
          styles: [{ color: '#0D9488', weight: 6 }]
        },
        show: false,
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        createMarker: () => null // Prevent default markers
      });

      // Add the control to the map
      control.addTo(mapRef.current);

      // Store the control
      setRoutingControl(control);

      // Calculate route
      control.route();

      // Fit bounds to show both points with padding
      const bounds = L.latLngBounds(
        [userLocation, [currentJob.location.lat, currentJob.location.lng]]
      );
      mapRef.current.fitBounds(bounds, { 
        padding: [50, 50],
        maxZoom: 15 
      });
    }
  };

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Clean up routing control when component unmounts
      if (mapRef.current && routingControl) {
        mapRef.current.removeControl(routingControl);
      }
    };
  }, [routingControl]);

  const openGoogleMapsDirections = () => {
    console.log("User location:", userLocation);
    console.log("Current job:", currentJob);

    if (!userLocation) {
      console.log("User location not available");
      return;
    }

    // Format coordinates and address
    const origin = `${userLocation[0]},${userLocation[1]}`;
    const destination = `${currentJob.location.lat},${currentJob.location.lng}`;

    // Create Google Maps URL with coordinates
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

    console.log("Opening URL:", url);

    // Open in new window/tab
    window.open(url, '_blank');
  };

  return (
    <DashboardLayout>
      <div className="w-full h-[calc(100vh-2rem)] relative">
        <MapContainer
          center={userLocation || [51.5074, -0.1278]}
          zoom={12}
          className="w-full h-full absolute inset-0"
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Show user location marker */}
          {userLocation && (
            <Marker
              position={userLocation as LatLngExpression}
              icon={new L.Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            />
          )}

          {/* Show only accepted job marker if a job is accepted */}
          {acceptedJob ? (
            <Marker 
              key={acceptedJob.id}
              position={[acceptedJob.location.lat, acceptedJob.location.lng] as LatLngExpression}
              icon={urgentIcon}
            />
          ) : (
            jobsData.map((job, index) => (
              <Marker 
                key={job.id}
                position={[job.location.lat, job.location.lng] as LatLngExpression}
                icon={
                  job.timeline === 'Today' ? urgentIcon :
                  job.timeline === '2-3 Days' ? soonIcon :
                  laterIcon
                }
                eventHandlers={{
                  click: () => handleMarkerClick(index)
                }}
              />
            ))
          )}
        </MapContainer>

        {/* Job Details Panel */}
        <div 
          className="absolute bottom-4 left-4 right-4 max-w-md mx-auto z-[1000]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white/40 backdrop-blur-md rounded-xl shadow-lg border border-white/20 overflow-hidden">
            <div className="relative p-3">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5" />
              
              <div className="relative">
                <div className="flex gap-3">
                  {/* Damage Image */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden border border-white/20">
                    <img 
                      src={currentJob.image || "/images/windscreen-damage.jpg"} 
                      alt="Damage" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-gray-900">{currentJob.title}</h2>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{currentJob.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                        {currentJob.price}
                      </span>
                      <span className="text-xs text-gray-500">Est. Time: 1.5 hrs</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  <div className="flex items-center gap-1.5 bg-black/5 p-1.5 rounded-lg backdrop-blur-sm border border-white/10">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    <div>
                      <p className="text-[10px] text-gray-500">Customer</p>
                      <p className="text-xs font-medium">{currentJob.customer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/5 p-1.5 rounded-lg backdrop-blur-sm border border-white/10">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <div>
                      <p className="text-[10px] text-gray-500">Timeline</p>
                      <p className="text-xs font-medium">{currentJob.timeline}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/5 p-1.5 rounded-lg backdrop-blur-sm border border-white/10">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <div>
                      <p className="text-[10px] text-gray-500">Location</p>
                      <p className="text-xs font-medium line-clamp-1">{currentJob.address}</p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="bg-black/5 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Vehicle Information
                  </h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Make/Model:</span>
                      <span>{currentJob.vehicle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Damage Type:</span>
                      <span>{currentJob.damage}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Insurance:</span>
                      <span>{currentJob.insurance}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-2 flex gap-1.5">
                  <Button 
                    type="button"
                    onClick={handleAcceptJob}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium h-8 text-sm shadow-lg shadow-red-500/20 border border-white/10"
                  >
                    Accept Job
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={openGoogleMapsDirections}
                    className="px-3 h-8 border-white/20 bg-white/20 hover:bg-white/30"
                  >
                    <MapPin className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-md bg-white/95 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Job Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 p-4">
              {/* Customer Info */}
              <div className="bg-black/5 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Customer Details</h4>
                <p className="text-sm">{currentJob.customer}</p>
                <p className="text-sm text-gray-500 mt-1">{currentJob.address}</p>
              </div>

              {/* Vehicle Details */}
              <div className="bg-black/5 p-4 rounded-lg space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Vehicle Information
                </h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Make/Model:</span>
                    <span>{currentJob.vehicle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Damage Type:</span>
                    <span>{currentJob.damage}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Insurance:</span>
                    <span>{currentJob.insurance}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleAcceptJob}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                >
                  Accept Job
                </Button>
                <Button 
                  variant="outline"
                  onClick={openGoogleMapsDirections}
                  className="px-3 border-gray-200"
                >
                  <MapPin className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                  className="border-gray-200"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default JobSwipe; 
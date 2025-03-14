import React, { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet';
import { Button } from "@/components/ui/button";
import { Clock, User, PoundSterling, Shield, Car, Info, MapPin } from "lucide-react";
import { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

// Add at the top of the file, after imports
declare module 'leaflet' {
  export namespace Routing {
    function control(options: any): any;
    function osrmv1(options: any): any;
  }
}

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

// After the icon definitions (urgentIcon, soonIcon, laterIcon)
const createIcon = (color: string) => {
  const markerIcons = {
    'red': urgentIcon,
    'yellow': soonIcon,
    'green': laterIcon,
    'blue': new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  };
  return markerIcons[color] || markerIcons['blue'];
};

// Add this with your other icon definitions
const userLocationIcon = new L.DivIcon({
  html: `
    <div class="technician-marker">
      <div class="pulse-ring"></div>
      <div class="technician-dot"></div>
    </div>
  `,
  className: 'technician-icon',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Add this CSS to your styles
const pulseStyle = `
  .technician-icon {
    background: transparent;
    border: none;
  }
  .technician-marker {
    position: relative;
  }
  .technician-dot {
    width: 20px;
    height: 20px;
    background: #3b82f6;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 10px rgba(0,0,0,0.3);
  }
  .pulse-ring {
    position: absolute;
    width: 40px;
    height: 40px;
    background: rgba(59, 130, 246, 0.4);
    border-radius: 50%;
    left: -10px;
    top: -10px;
    animation: pulse-ring 2s infinite;
  }
  @keyframes pulse-ring {
    0% { transform: scale(0.5); opacity: 1; }
    50% { transform: scale(1); opacity: 0.5; }
    100% { transform: scale(0.5); opacity: 1; }
  }
`;

interface MapComponentProps {
  userLocation: [number, number] | null;
  jobsData: CustomerJob[];
  handleMarkerClick: (index: number) => void;
  isAccepted: boolean;
  acceptedJob: CustomerJob | null;
}

const getMarkerColor = (timeline?: string) => {
  if (!timeline) return 'blue';
  const timelineLower = timeline.toLowerCase();
  if (timelineLower.includes('urgent') || timelineLower.includes('asap')) return 'red';
  if (timelineLower.includes('soon') || timelineLower.includes('tomorrow')) return 'yellow';
  return 'green';
};

const MapComponent = ({ userLocation, jobsData, handleMarkerClick, isAccepted, acceptedJob }: MapComponentProps) => {
  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {userLocation && (
        <Marker 
          position={userLocation as LatLngExpression}
          icon={userLocationIcon}
        >
          <Popup>Your Location</Popup>
        </Marker>
      )}
      {!isAccepted && jobsData.map((job, index) => (
        <Marker
          key={job.quoteid}
          position={[job.location.lat, job.location.lng] as LatLngExpression}
          icon={createIcon(getMarkerColor(job.timeline))}
          eventHandlers={{
            click: () => handleMarkerClick(index)
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{job.full_name}</p>
              <p>{job.vehicle_reg} - {job.make} {job.model}</p>
              <p>{job.area}</p>
              <p className="text-blue-600">{job.timeline || 'No timeline specified'}</p>
              <p className="font-bold text-red-600">£{job.quote_price || 0}</p>
            </div>
          </Popup>
        </Marker>
      ))}
      {isAccepted && acceptedJob && (
        <Marker
          position={[acceptedJob.location.lat, acceptedJob.location.lng] as LatLngExpression}
          icon={createIcon('blue')}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{acceptedJob.full_name}</p>
              <p>{acceptedJob.area}</p>
              <p className="text-blue-600">{acceptedJob.timeline}</p>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
};

interface CustomerJob {
  quoteid: string;
  full_name: string;
  lastname: string;
  location: {
    lat: number;
    lng: number;
  };
  postcode: string;
  customerid: string;
  vehicle_reg: string;
  make: string;
  model: string;
  year: string;
  colour: string;
  type: string;
  style: string;
  covertype: string;
  coverlevel: string;
  quote_price?: number;
  damaged_windows?: string;
  image_url?: string;
  timeline?: string;
  address?: string;
  area: string;
}

const JobSwipe = () => {
  const [jobs, setJobs] = useState<CustomerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [routingControl, setRoutingControl] = useState<any>(null);
  const [acceptedJob, setAcceptedJob] = useState<CustomerJob | null>(null);
  const mapRef = useRef(null);
  const navigate = useNavigate();
  const [isCardVisible, setIsCardVisible] = useState(true);

  // Fetch jobs from Supabase
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase
          .from('MasterCustomer')
          .select('*');

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        if (data) {
          console.log('Raw data from Supabase:', data);

          const jobsWithLocation = await Promise.all(data.map(async (job) => {
            // Don't try to parse location if it's already an object
            const existingLocation = job.location && typeof job.location === 'string' 
              ? { lat: 51.5074, lng: -0.1278 } // Default to London if parsing fails
              : (job.location || { lat: 51.5074, lng: -0.1278 });

            const address = `${job.address || ''}, ${job.postcode || ''}, UK`;
            
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
              );
              
              const locationData = await response.json();

              return {
                ...job,
                quoteid: job.id,
                image_url: job.image_url || '/default-image.jpg',
                area: job.location || 'Location not available',
                location: locationData && locationData.length > 0 
                  ? {
                      lat: parseFloat(locationData[0].lat),
                      lng: parseFloat(locationData[0].lon)
                    }
                  : existingLocation
              };
            } catch (error) {
              return {
                ...job,
                quoteid: job.id,
                image_url: job.image_url || '/default-image.jpg',
                area: job.location || 'Location not available',
                location: existingLocation
              };
            }
          }));

          console.log('Final jobs with locations:', jobsWithLocation);
          setJobs(jobsWithLocation);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Default to London if geolocation fails
          setUserLocation([51.5074, -0.1278]);
        }
      );
    }
  }, []);

  useEffect(() => {
    console.log('Map ref:', mapRef.current);
    console.log('jobsData:', jobs);
    console.log('userLocation:', userLocation);
  }, [userLocation]);

  const handleMarkerClick = (index: number) => {
    setCurrentIndex(index);
    setIsCardVisible(true);
  };

  const handleAcceptJob = (e: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (e) e.stopPropagation();
    
    localStorage.setItem('currentJob', JSON.stringify(jobs[currentIndex]));
    setIsAccepted(true);
    setShowDetails(false);
    setAcceptedJob(jobs[currentIndex]);

    if (mapRef.current && userLocation) {
      // Clear existing route if any
      if (routingControl) {
        mapRef.current.removeControl(routingControl);
      }

      // Create new routing control
      const control = L.Routing.control({
        waypoints: [
          L.latLng(userLocation[0], userLocation[1]),
          L.latLng(jobs[currentIndex].location.lat, jobs[currentIndex].location.lng)
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
        [userLocation, [jobs[currentIndex].location.lat, jobs[currentIndex].location.lng]]
      );
      mapRef.current.fitBounds(bounds, { 
        padding: [50, 50],
        maxZoom: 15 
      });
    }
  };

  // Fix the cleanup effect
  useEffect(() => {
    return () => {
      if (mapRef.current && routingControl) {
        mapRef.current.removeControl(routingControl);
      }
    };
  }, [routingControl]);

  const openGoogleMapsDirections = () => {
    console.log("User location:", userLocation);
    console.log("Current job:", jobs[currentIndex]);

    if (!userLocation) {
      console.log("User location not available");
      return;
    }

    // Format coordinates and location
    const origin = `${userLocation[0]},${userLocation[1]}`;
    const destination = `${jobs[currentIndex].location.lat},${jobs[currentIndex].location.lng}`;

    // Create Google Maps URL with coordinates
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

    console.log("Opening URL:", url);

    // Open in new window/tab
    window.open(url, '_blank');
  };

  const getVehicleDisplay = (job: CustomerJob) => {
    if (!job?.make && !job?.model && !job?.year) return "Vehicle information not available";
    return `${job.year || ''} ${job.make || ''} ${job.model || ''}`.trim();
  };

  // Add the price formatting helper function if not already present
  const formatPrice = (price: number | null | undefined) => {
    if (price == null) return '£0.00';
    return `£${price.toFixed(2)}`;
  };

  // Add a map click handler
  const handleMapClick = () => {
    setIsCardVisible(false);
  };

  // At the top of your JobSwipe component
  useEffect(() => {
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.textContent = pulseStyle;
    document.head.appendChild(styleElement);

    // Cleanup
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-6rem)] relative">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p>Loading jobs...</p>
          </div>
        ) : (
          <>
            <MapContainer
              center={userLocation || [51.5074, -0.1278]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef as any}
            >
              <MapClickHandler onMapClick={handleMapClick} />
              <MapComponent 
                userLocation={userLocation} 
                jobsData={jobs} 
                handleMarkerClick={handleMarkerClick} 
                isAccepted={isAccepted}
                acceptedJob={acceptedJob}
              />
            </MapContainer>

            {/* Card with visibility and transition */}
            <div className={`absolute bottom-24 sm:bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-lg z-[1000] transition-all duration-300 ease-in-out ${
              isCardVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8 pointer-events-none'
            }`}>
              <div className="bg-gradient-to-br from-white/95 to-white/75 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                {/* Image Section - New */}
                <div className="relative w-full h-32 bg-gradient-to-r from-gray-100 to-gray-200">
                  {jobs[currentIndex].image_url ? (
                    <img
                      src={jobs[currentIndex].image_url}
                      alt="Vehicle damage"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Car className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="p-3.5">
                  {/* Header Section */}
                  <div className="flex justify-between items-start mb-2.5">
                    <div>
                      <h2 className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        {getVehicleDisplay(jobs[currentIndex])}
                      </h2>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.5 bg-gradient-to-r from-gray-100 to-gray-50 rounded-full text-[10px] font-medium text-gray-600">
                          {jobs[currentIndex].vehicle_reg}
                        </span>
                        <span className="px-1.5 py-0.5 bg-gradient-to-r from-red-50 to-orange-50 rounded-full text-[10px] font-medium text-red-600">
                          {jobs[currentIndex].covertype}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-500">
                        {jobs[currentIndex]?.quote_price 
                          ? formatPrice(jobs[currentIndex].quote_price)
                          : 'Quote Required'}
                      </p>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                    {[
                      { icon: User, text: `${jobs[currentIndex]?.full_name}` },
                      { 
                        icon: MapPin, 
                        text: jobs[currentIndex].area || 'Location not available',
                        className: 'text-gray-500'
                      },
                      { 
                        icon: Info, 
                        text: jobs[currentIndex].damaged_windows || 'Front Windscreen',
                        className: 'text-amber-600'
                      },
                      { 
                        icon: Clock, 
                        text: jobs[currentIndex].timeline || 'Today',
                        className: 'text-blue-600'
                      }
                    ].map((item, index) => (
                      <div key={index} 
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-gradient-to-br from-gray-50/50 to-transparent backdrop-blur-sm border border-white/20"
                      >
                        <item.icon className={`w-3 h-3 flex-shrink-0 ${item.className || 'text-gray-500'}`} />
                        <span className="text-[11px] font-medium text-gray-700 truncate">
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions Section */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/20">
                    <div className="flex gap-0.5">
                      <Button
                        onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev))}
                        disabled={currentIndex === 0}
                        variant="ghost"
                        size="sm"
                        className="h-9 w-7 text-gray-600 hover:text-gray-900 hover:bg-white/30 disabled:opacity-40"
                      >
                        ←
                      </Button>
                      <Button
                        onClick={() => setCurrentIndex((prev) => (prev < jobs.length - 1 ? prev + 1 : prev))}
                        disabled={currentIndex === jobs.length - 1}
                        variant="ghost"
                        size="sm"
                        className="h-9 w-7 text-gray-600 hover:text-gray-900 hover:bg-white/30 disabled:opacity-40"
                      >
                        →
                      </Button>
                    </div>
                    
                    <div className="flex gap-1.5 flex-1">
                      <Button 
                        onClick={handleAcceptJob}
                        className={`h-9 flex-1 text-xs font-medium rounded-lg transition-all duration-300 ${
                          isAccepted 
                            ? 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white shadow-lg shadow-green-500/20'
                            : 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 text-white shadow-lg shadow-red-500/20'
                        }`}
                        disabled={isAccepted}
                      >
                        {isAccepted ? '✓ Accepted' : 'Accept Job'}
                      </Button>
                      <Button
                        onClick={openGoogleMapsDirections}
                        className="h-9 w-9 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg shadow-lg shadow-blue-500/20 transition-all duration-300 flex items-center justify-center"
                      >
                        <MapPin className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

// Add this component to handle map clicks
const MapClickHandler = ({ onMapClick }: { onMapClick: () => void }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    map.on('click', onMapClick);
    
    return () => {
      map.off('click', onMapClick);
    };
  }, [map, onMapClick]);

  return null;
};

export default JobSwipe; 
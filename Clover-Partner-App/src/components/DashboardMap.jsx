import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useOrderStore } from '../store/useOrderStore';
import { Plus, Minus } from 'lucide-react';

// Sub-component to dynamically fly the map to the user's location
const MapUpdater = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 15, { animate: true, duration: 1.5 });
    }
  }, [location, map]);
  return null;
};

// Custom Zoom Controls using Leaflet's useMap hook
const ZoomControls = () => {
  const map = useMap();
  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-[#1E1E1E]/90 backdrop-blur-md border border-gray-700 rounded-xl flex items-center justify-center text-white shadow-lg hover:bg-[#2A2A2A] active:scale-90 transition-all"
        aria-label="Zoom in"
      >
        <Plus size={20} strokeWidth={2.5} />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-[#1E1E1E]/90 backdrop-blur-md border border-gray-700 rounded-xl flex items-center justify-center text-white shadow-lg hover:bg-[#2A2A2A] active:scale-90 transition-all"
        aria-label="Zoom out"
      >
        <Minus size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
};

// Pulsating Dot Icon configuration
const pulsatingIcon = L.divIcon({
  className: 'custom-pulse-icon',
  html: '<div class="pulse-dot"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export const DashboardMap = ({ location }) => {
  const [initialLocation, setInitialLocation] = useState(null);
  const { status, activeOrder, availableOrders } = useOrderStore();

  useEffect(() => {
    if (location && !initialLocation) {
      setInitialLocation(location);
    }
  }, [location, initialLocation]);

  const getDemandZones = (center) => {
    if (!center) return [];
    return [
      { lat: center.lat + 0.012, lng: center.lng + 0.015 },
      { lat: center.lat - 0.015, lng: center.lng + 0.01 },
      { lat: center.lat + 0.02, lng: center.lng - 0.018 },
      { lat: center.lat - 0.025, lng: center.lng - 0.02 },
      { lat: center.lat + 0.005, lng: center.lng + 0.025 },
    ];
  };

  const zones = getDemandZones(initialLocation);
  
  const routingPaths = useMemo(() => {
    if (!initialLocation || !activeOrder) return null;
    
    const pickupPoint = [
      initialLocation.lat + activeOrder.pickupCoords.latOffset,
      initialLocation.lng + activeOrder.pickupCoords.lngOffset
    ];
    
    const dropPoint = [
      initialLocation.lat + activeOrder.dropCoords.latOffset,
      initialLocation.lng + activeOrder.dropCoords.lngOffset
    ];

    return { pickupPoint, dropPoint };
  }, [initialLocation, activeOrder]);
  
  const defaultCenter = [20.5937, 78.9629]; 

  return (
    <MapContainer 
      center={location ? [location.lat, location.lng] : defaultCenter} 
      zoom={location ? 15 : 5} 
      scrollWheelZoom={true}
      doubleClickZoom={true}
      zoomControl={false}
      className="absolute inset-0 w-full h-full z-0 bg-[#2A2A2A]"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      {/* Custom Zoom Controls */}
      <ZoomControls />
      
      {location && <MapUpdater location={location} />}
      
      {location && (
        <Marker 
          position={[location.lat, location.lng]} 
          icon={pulsatingIcon}
          zIndexOffset={100}
        />
      )}

      {(status === 'IDLE' || status === 'RINGING') && zones.map((zone, idx) => (
        <Circle
          key={idx}
          center={[zone.lat, zone.lng]}
          pathOptions={{ color: '#FC8019', fillColor: '#FC8019', fillOpacity: 0.15 }}
          radius={800}
          stroke={false}
        />
      ))}

      {status === 'RINGING' && initialLocation && availableOrders?.map(order => {
        const pPt = [
          initialLocation.lat + order.pickupCoords.latOffset,
          initialLocation.lng + order.pickupCoords.lngOffset
        ];
        
        const priceIcon = L.divIcon({
          className: 'custom-price-icon',
          html: `<div style="background:#FC8019;color:#fff;font-weight:800;padding:4px 10px;border-radius:8px;box-shadow:0 2px 12px rgba(252,128,25,0.5);border:2px solid #fff;font-size:13px;white-space:nowrap;text-align:center;">₹${order.earning}</div>`,
          iconSize: [46, 28],
          iconAnchor: [23, 28],
        });

        return (
          <Marker key={order.id} position={pPt} icon={priceIcon} zIndexOffset={500} />
        );
      })}

      {status === 'NAV_PICKUP' && routingPaths && location && (
        <>
          <Circle center={routingPaths.pickupPoint} radius={50} pathOptions={{ color: '#ff9947', fillColor: '#ff9947', fillOpacity: 1 }} />
          <Polyline 
            positions={[[location.lat, location.lng], routingPaths.pickupPoint]} 
            pathOptions={{ color: '#3b82f6', weight: 5, dashArray: '10, 10' }} 
          />
        </>
      )}

      {['NAV_DROP', 'AT_DROP', 'PAYMENT'].includes(status) && routingPaths && location && (
        <>
          <Circle center={routingPaths.dropPoint} radius={50} pathOptions={{ color: '#4CAF50', fillColor: '#4CAF50', fillOpacity: 1 }} />
          <Polyline 
            positions={[routingPaths.pickupPoint, routingPaths.dropPoint]} 
            pathOptions={{ color: '#4CAF50', weight: 5, dashArray: '10, 10' }} 
          />
        </>
      )}
    </MapContainer>
  );
};

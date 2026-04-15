import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import { PhoneCall, Navigation, Clock, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { CloverShellHeader } from '../components/CloverShellHeader';
import { orderService } from '../services/orderService';
import { locationService } from '../services/locationService';

const FitRouteBounds = ({ riderPoint, targetPoint, pathPoints }) => {
  const map = useMap();

  useEffect(() => {
    const points = [];

    if (Array.isArray(pathPoints) && pathPoints.length > 0) {
      points.push(...pathPoints);
    }

    if (riderPoint) {
      points.push([riderPoint.latitude, riderPoint.longitude]);
    }

    if (targetPoint) {
      points.push([targetPoint.latitude, targetPoint.longitude]);
    }

    const validPoints = points.filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
    if (validPoints.length < 2) return;

    const bounds = new LatLngBounds(validPoints);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17, animate: true });
  }, [map, riderPoint, targetPoint, pathPoints]);

  return null;
};

export const ActiveDeliveryPage = () => {
  const navigate = useNavigate();
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [order, setOrder] = useState(null);
  const [trackingPath, setTrackingPath] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapKey, setMapKey] = useState(0);
  const watchIdRef = useRef(null);

  const safeParse = (value) => {
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  };

  const getOrderId = (delivery = activeDelivery) => {
    return delivery?.orderId?._id || delivery?.orderId || delivery?.order?._id || delivery?._id || null;
  };

  const getOrderDetails = (delivery) => {
    if (!delivery) return null;
    if (delivery.orderId && typeof delivery.orderId === 'object') return delivery.orderId;
    if (delivery.order && typeof delivery.order === 'object') return delivery.order;
    return delivery;
  };

  const getCurrentTarget = () => {
    if (!order) return null;

    if (activeDelivery?.status === 'on_way') {
      return order.dropLocation || null;
    }

    return order.pickupLocation || order.dropLocation || null;
  };

  const customMarkerIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const pickupMarkerIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const dropoffMarkerIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Load active delivery
  useEffect(() => {
    loadDelivery();
  }, []);

  // Start real-time location tracking
  useEffect(() => {
    if (activeDelivery && activeDelivery.status !== 'completed') {
      startLocationTracking();
      return () => stopLocationTracking();
    }
  }, [activeDelivery]);

  // Auto-refresh tracking path
  useEffect(() => {
    if (activeDelivery && order) {
      const interval = setInterval(() => {
        loadTrackingPath();
      }, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [activeDelivery, order]);

  const loadDelivery = async () => {
    try {
      setLoading(true);
      const partnerId = localStorage.getItem('partnerId');
      
      // Get active deliveries
      const deliveries = await orderService.getActiveDeliveries(partnerId);
      
      if (deliveries.length > 0) {
        const delivery = deliveries[0]; // Get first active delivery
        setActiveDelivery(delivery);
        setOrder(getOrderDetails(delivery));
        await loadTrackingPath(getOrderId(delivery));
      } else {
        const savedTask = safeParse(localStorage.getItem('currentDeliveryTask'));
        if (savedTask) {
          const fallbackDelivery = {
            _id: savedTask.deliveryId || savedTask.orderId,
            status: savedTask.status || 'accepted',
            orderId: {
              _id: savedTask.orderId,
              customerName: savedTask.customerName,
              customerPhone: savedTask.customerPhone,
              pickupLocation: savedTask.pickupLocation,
              dropLocation: savedTask.dropLocation,
              totalAmount: savedTask.totalAmount,
              estimatedDistance: savedTask.estimatedDistance,
              estimatedTime: savedTask.estimatedTime
            }
          };

          setActiveDelivery(fallbackDelivery);
          setOrder(getOrderDetails(fallbackDelivery));
          setTrackingPath(Array.isArray(savedTask.pathPoints) ? savedTask.pathPoints : []);
          setLocation(
            savedTask.pathPoints?.[0]
              ? {
                  latitude: savedTask.pathPoints[0][0],
                  longitude: savedTask.pathPoints[0][1],
                  accuracy: 25,
                  speed: 0,
                  timestamp: savedTask.acceptedAt || new Date().toISOString()
                }
              : null
          );
          return;
        }

        setError('No active deliveries');
      }
    } catch (err) {
      setError(err.message || 'Failed to load delivery');
    } finally {
      setLoading(false);
    }
  };

  const loadTrackingPath = async (orderId = getOrderId()) => {
    try {
      if (!orderId) return;
      
      const path = await orderService.getDeliveryTracking(orderId);
      
      // Convert to lat/lng format for polyline
      const coordinates = path.map(item => [
        item.location.latitude,
        item.location.longitude
      ]);
      
      setTrackingPath(coordinates);
      
      // Update current location
      if (path.length > 0) {
        const latest = path[path.length - 1];
        setLocation({
          latitude: latest.location.latitude,
          longitude: latest.location.longitude,
          accuracy: latest.location.accuracy,
          speed: latest.location.speed,
          timestamp: latest.timestamp
        });
      }
    } catch (err) {
      console.warn('Failed to load tracking path:', err.message);
    }
  };

  const startLocationTracking = () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy, speed } = position.coords;
        const currentOrderId = getOrderId();
        
        setLocation({
          latitude,
          longitude,
          accuracy,
          speed: speed ? Math.round(speed * 3.6) : 0, // Convert m/s to km/h
          timestamp: new Date().toISOString()
        });

        // Log location to backend
        try {
          const partnerId = localStorage.getItem('partnerId');
          const deviceInfo = await getDeviceInfo();
          const networkInfo = await getNetworkInfo();

          if (!currentOrderId) {
            return;
          }
          
          await locationService.logDeliveryLocation(
            currentOrderId,
            partnerId,
            { latitude, longitude, accuracy, speed },
            deviceInfo,
            networkInfo
          );
        } catch (err) {
          console.warn('Could not log location:', err.message);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to get location. Please enable location services.');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const getDeviceInfo = async () => {
    try {
      const battery = await navigator.getBattery?.();
      return {
        batteryLevel: battery?.level ? Math.round(battery.level * 100) : 100,
        isCharging: battery?.charging || false,
        screenOn: true
      };
    } catch {
      return { batteryLevel: 100, isCharging: false, screenOn: true };
    }
  };

  const getNetworkInfo = async () => {
    try {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      return {
        type: connection?.effectiveType || 'unknown',
        signalStrength: -50,
        isConnected: navigator.onLine
      };
    } catch {
      return { type: 'unknown', signalStrength: 0, isConnected: navigator.onLine };
    }
  };

  const handleCallCustomer = () => {
    if (order?.customerPhone) {
      window.location.href = `tel:${order.customerPhone}`;
    }
  };

  const handleStartDelivery = async () => {
    try {
      await orderService.updateDeliveryStatus(activeDelivery._id, 'on_way', location);
      setActiveDelivery({...activeDelivery, status: 'on_way'});
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleCompleteDelivery = () => {
    // Navigate to proof of delivery
    navigate('/proof-of-delivery', {
      state: {
        orderId: getOrderId(activeDelivery),
        deliveryId: activeDelivery._id
      }
    });
  };

  if (loading) {
    return (
      <div className="public-shell flex min-h-[100dvh] items-center justify-center px-4">
        <div className="page-card w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-emerald-600 to-cyan-600 text-white shadow-lg">
            <MapPin size={28} />
          </div>
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <p className="text-lg font-black tracking-tight text-slate-950">Loading delivery</p>
          <p className="mt-1 text-sm text-slate-500">Preparing your map, live route, and order details.</p>
        </div>
      </div>
    );
  }

  if (!activeDelivery || !order) {
    return (
      <div className="public-shell flex min-h-[100dvh] items-center justify-center px-4">
        <div className="page-card w-full max-w-lg p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-rose-50 text-rose-600">
            <AlertCircle size={28} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">No active delivery found</h1>
          <p className="mt-2 text-sm text-slate-600">{error || 'There is no live delivery assigned to this partner right now.'}</p>
          <button onClick={loadDelivery} className="btn-primary mt-6 px-6 py-3">
            Reload delivery
          </button>
        </div>
      </div>
    );
  }

  const targetPoint = getCurrentTarget();
  const mapCenter = location
    ? [location.latitude, location.longitude]
    : order?.pickupLocation?.latitude && order?.pickupLocation?.longitude
      ? [order.pickupLocation.latitude, order.pickupLocation.longitude]
      : order?.dropLocation?.latitude && order?.dropLocation?.longitude
        ? [order.dropLocation.latitude, order.dropLocation.longitude]
        : null;
  const liveRoute =
    location && targetPoint?.latitude && targetPoint?.longitude
      ? [
          [location.latitude, location.longitude],
          [targetPoint.latitude, targetPoint.longitude]
        ]
      : [];

  const acceptedTask = safeParse(localStorage.getItem('currentDeliveryTask'));

  return (
    <div className="public-shell min-h-[100dvh] pb-24">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <CloverShellHeader
          title="Active delivery"
          subtitle="One screen for route, order details, movement, and completion actions."
          badge={<span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />Live tracking</span>}
          actions={[
            { label: 'Profile', onClick: () => navigate('/profile'), tone: 'secondary', icon: <MapPin size={14} />, chevron: false },
            { label: 'Earnings', onClick: () => navigate('/earnings'), tone: 'secondary', icon: <Clock size={14} />, chevron: false },
            { label: 'Logout', onClick: () => navigate('/login'), tone: 'danger', icon: <AlertCircle size={14} />, chevron: false }
          ]}
        />

        {error && (
          <div className="mt-4 flex gap-2 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800 shadow-sm">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <section className="page-card overflow-hidden p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="section-title">Live map</p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Route and target preview</h2>
                <p className="mt-1 text-sm text-slate-500">The map is centered on your live location and updated in real time.</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                <Navigation size={14} />
                {activeDelivery.status === 'on_way' ? 'Heading to dropoff' : 'Heading to pickup'}
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100 shadow-inner">
              <div className="relative h-[52vh] min-h-[360px] sm:h-[58vh] lg:h-[64vh]">
                {mapCenter && (
                  <MapContainer
                    key={mapKey}
                    center={mapCenter}
                    zoom={16}
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Polyline positions={trackingPath} color="#2563eb" weight={4} opacity={0.7} />

                    {liveRoute.length === 2 && (
                      <Polyline
                        positions={liveRoute}
                        color="#16a34a"
                        weight={5}
                        opacity={0.85}
                        dashArray="10,10"
                      />
                    )}

                    <FitRouteBounds riderPoint={location} targetPoint={targetPoint} pathPoints={trackingPath} />

                    {location && (
                      <>
                        <Marker position={[location.latitude, location.longitude]} icon={customMarkerIcon}>
                          <Popup>
                            <div className="text-sm">
                              <p className="font-semibold">Your Location</p>
                              <p>Speed: {location.speed} km/h</p>
                              <p>Accuracy: {Math.round(location.accuracy)}m</p>
                            </div>
                          </Popup>
                        </Marker>

                        <Circle
                          center={[location.latitude, location.longitude]}
                          radius={Math.max(Math.round(location.accuracy || 20), 20)}
                          pathOptions={{ color: '#ef4444', fillColor: '#fecaca', fillOpacity: 0.2, weight: 1 }}
                        />
                      </>
                    )}

                    {order.pickupLocation && (
                      <Marker
                        position={[order.pickupLocation.latitude, order.pickupLocation.longitude]}
                        icon={pickupMarkerIcon}
                      >
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold">Pickup Location</p>
                            <p>{order.pickupLocation.address}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {order.dropLocation && (
                      <Marker
                        position={[order.dropLocation.latitude, order.dropLocation.longitude]}
                        icon={dropoffMarkerIcon}
                      >
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold">Dropoff Location</p>
                            <p>{order.dropLocation.address}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                )}

                {!mapCenter && (
                  <div className="flex h-full w-full items-center justify-center bg-slate-100 px-6 text-center">
                    <p className="text-sm font-semibold text-slate-500">Waiting for location coordinates to render the map preview.</p>
                  </div>
                )}
              </div>
            </div>

            {acceptedTask && (
              <div className="mt-4 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-wider font-bold text-emerald-700">Accepted task</p>
                <p className="mt-1 text-base font-black text-emerald-900">{acceptedTask.restaurant}</p>
                <p className="mt-1 text-sm text-emerald-800">{acceptedTask.routeSummary}</p>
                <p className="mt-1 text-sm font-semibold text-emerald-900">Projected earning: ₹{acceptedTask.projectedEarning}</p>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="page-card p-4 sm:p-5">
              <p className="section-title">Order summary</p>
              <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Current delivery</h3>

              <div className="mt-4 grid gap-3">
                <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-700">Pickup</p>
                  <p className="mt-2 text-sm font-bold text-slate-950">{order.pickupLocation?.address}</p>
                  {activeDelivery.pickedUpAt && (
                    <p className="mt-2 text-xs text-slate-500">Picked up at {new Date(activeDelivery.pickedUpAt).toLocaleTimeString()}</p>
                  )}
                </div>

                <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-700">Dropoff</p>
                  <p className="mt-2 text-sm font-bold text-slate-950">{order.dropLocation?.address}</p>
                </div>

                <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-700">Customer</p>
                  <p className="mt-2 text-sm font-bold text-slate-950">{order.customerName}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[1.35rem] border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs uppercase tracking-wider font-bold text-emerald-700">Distance</p>
                  <p className="mt-2 text-xl font-black text-emerald-900">{order.estimatedDistance?.toFixed(1)} km</p>
                </div>
                <div className="rounded-[1.35rem] border border-cyan-200 bg-cyan-50 p-4">
                  <p className="text-xs uppercase tracking-wider font-bold text-cyan-700">Amount</p>
                  <p className="mt-2 text-xl font-black text-cyan-900">₹{order.totalAmount}</p>
                </div>
              </div>
            </div>

            {location && (
              <div className="page-card p-4 sm:p-5">
                <p className="section-title">Live stats</p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Movement and accuracy</h3>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wider font-bold text-slate-700">Speed</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{location.speed} km/h</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wider font-bold text-slate-700">Accuracy</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">±{Math.round(location.accuracy)} m</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wider font-bold text-slate-700">Target</p>
                    <p className="mt-1 text-2xl font-black text-slate-950 capitalize">
                      {activeDelivery.status === 'on_way' ? 'Dropoff' : 'Pickup'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="page-card p-4 sm:p-5">
              <p className="section-title">Actions</p>
              <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Partner controls</h3>

              <div className="mt-4 grid gap-3">
                <button onClick={handleCallCustomer} className="btn-secondary w-full py-3">
                  <PhoneCall size={18} />
                  Call customer
                </button>

                {activeDelivery.status === 'accepted' || activeDelivery.status === 'picked_up' ? (
                  <button onClick={handleStartDelivery} className="btn-primary w-full py-3">
                    <Navigation size={18} />
                    Start route
                  </button>
                ) : activeDelivery.status === 'on_way' ? (
                  <button onClick={handleCompleteDelivery} className="btn-primary w-full py-3">
                    <CheckCircle size={18} />
                    Complete delivery
                  </button>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

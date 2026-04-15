import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import { 
  MapPin, PhoneCall, IndianRupee, Clock, Zap, AlertCircle, CheckCircle, 
  Navigation, Bell
} from 'lucide-react';
import { CloverShellHeader } from '../components/CloverShellHeader';
import { orderService } from '../services/orderService';
import { locationService } from '../services/locationService';
import { notificationService } from '../services/notificationService';
import { partnerDemoOrders } from '../data/partnerDemoOrders';
import { useEarningsStore } from '../store/useEarningsStore';

const LiveMapCenter = ({ latitude, longitude }) => {
  const map = useMap();

  useEffect(() => {
    if (latitude && longitude) {
      map.setView([latitude, longitude], map.getZoom(), { animate: true });
    }
  }, [latitude, longitude, map]);

  return null;
};

const MiniStat = ({ label, value }) => (
  <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <p className="text-xs uppercase tracking-wider font-bold text-slate-700">{label}</p>
    <p className="font-black text-xl mt-1 leading-none text-slate-900">{value}</p>
  </div>
);

const SectionTitle = ({ eyebrow, title, description, action }) => (
  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
    <div>
      <p className="text-xs uppercase tracking-wider font-bold text-slate-700">{eyebrow}</p>
      <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-1 tracking-tight">{title}</h2>
      {description && <p className="text-sm text-slate-600 mt-1">{description}</p>}
    </div>
    {action}
  </div>
);

const StatusChip = ({ online, count }) => (
  <div className={`inline-flex items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold ${online ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-200' : 'bg-rose-500/15 text-rose-700 border border-rose-200'}`}>
    <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
    <span className="hidden sm:inline">{online ? 'Live partner mode' : 'Offline mode'}</span>
    <span className="sm:hidden">{online ? 'Live' : 'Offline'}</span>
    {typeof count === 'number' && count > 0 && <span className="ml-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] text-slate-700">{count}</span>}
  </div>
);

const MetricCard = ({ tone = 'slate', title, value, hint, icon: IconComp }) => {
  const toneClasses = {
    emerald: 'from-emerald-500/12 via-emerald-500/6 to-white border-emerald-200/70 text-emerald-700',
    blue: 'from-blue-500/12 via-blue-500/6 to-white border-blue-200/70 text-blue-700',
    amber: 'from-amber-500/12 via-amber-500/6 to-white border-amber-200/70 text-amber-700',
    slate: 'from-slate-900/5 via-slate-900/2 to-white border-slate-200 text-slate-800'
  };

  return (
    <div className={`rounded-[1.75rem] border bg-gradient-to-br ${toneClasses[tone]} p-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider font-bold">{title}</p>
          <p className="text-2xl font-black mt-1 tracking-tight">{value}</p>
          {hint && <p className="text-xs mt-2 leading-relaxed">{hint}</p>}
        </div>
        {IconComp && (
          <div className="w-11 h-11 rounded-2xl bg-white/75 backdrop-blur flex items-center justify-center shadow-sm">
            <IconComp size={18} />
          </div>
        )}
      </div>
    </div>
  );
};

const Badge = ({ children, tone = 'slate' }) => {
  const styles = {
    slate: 'bg-slate-900 text-white',
    blue: 'bg-blue-600 text-white',
    emerald: 'bg-emerald-600 text-white',
    amber: 'bg-amber-500 text-white'
  };

  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
};

const MapResizer = ({ trigger }) => {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => clearTimeout(timer);
  }, [map, trigger]);

  return null;
};

export const RealTimePartnerDashboard = () => {
  const navigate = useNavigate();
  const setActiveTrip = useEarningsStore((state) => state.setActiveTrip);
  const activeTrip = useEarningsStore((state) => state.activeTrip);
  const orderHistory = useEarningsStore((state) => state.orderHistory);
  const [isOnline, setIsOnline] = useState(() => localStorage.getItem('partnerOnlineStatus') === 'true');
  const [orderView, setOrderView] = useState('available');
  const [location, setLocation] = useState(null);
  const [nearbyOrders, setNearbyOrders] = useState([]);
  const [generatedDemoOrders, setGeneratedDemoOrders] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [acceptingOrderId, setAcceptingOrderId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({ todayEarnings: 0, deliveries: 0, rating: 4.8 });
  const [notificationCount, setNotificationCount] = useState(0);
  const watchIdRef = useRef(null);
  const stopPollingRef = useRef(null);

  const readStoredLocation = () => {
    try {
      const raw = localStorage.getItem('partnerLastLocation');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const persistLocation = (newLocation) => {
    localStorage.setItem('partnerLastLocation', JSON.stringify(newLocation));
  };

  const currentLocationIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const orderLocationIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  const getNearbyDemoOrders = (currentLocation) => {
    if (!currentLocation) return [];

    return partnerDemoOrders
      .map((order, index) => {
        const pickupLatitude = currentLocation.latitude + order.pickupLocation.latitudeOffset;
        const pickupLongitude = currentLocation.longitude + order.pickupLocation.longitudeOffset;
        const distanceScore = Math.hypot(order.pickupLocation.latitudeOffset, order.pickupLocation.longitudeOffset);

        return {
          ...order,
          _id: `${order._id}-${Math.round(currentLocation.latitude * 1000)}-${index}`,
          pickupLocation: {
            address: order.pickupLocation.address,
            latitude: pickupLatitude,
            longitude: pickupLongitude
          },
          dropLocation: {
            address: order.dropLocation.address,
            latitude: currentLocation.latitude + order.dropLocation.latitudeOffset,
            longitude: currentLocation.longitude + order.dropLocation.longitudeOffset
          },
          distanceScore,
          customerPhone: order.customerPhone
        };
      })
      .sort((left, right) => left.distanceScore - right.distanceScore);
  };

  const mergeOrders = (baseOrders = [], extraOrders = []) => {
    const merged = [...extraOrders, ...baseOrders];
    return merged.filter((order, index, list) => index === list.findIndex((item) => item._id === order._id));
  };

  const safeParse = (value) => {
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  };

  const buildAcceptedTaskSnapshot = (delivery) => {
    const resolvedOrder = delivery?.orderId && typeof delivery.orderId === 'object'
      ? delivery.orderId
      : delivery?.order && typeof delivery.order === 'object'
        ? delivery.order
        : delivery;

    const acceptedAt = new Date().toISOString();
    const pickup = resolvedOrder?.pickupLocation || null;
    const drop = resolvedOrder?.dropLocation || null;
    const earning = Number(resolvedOrder?.earning || Math.round((resolvedOrder?.totalAmount || 0) * 0.18));
    const pathPoints = [
      location ? [location.latitude, location.longitude] : null,
      pickup?.latitude && pickup?.longitude ? [pickup.latitude, pickup.longitude] : null,
      drop?.latitude && drop?.longitude ? [drop.latitude, drop.longitude] : null
    ].filter(Boolean);

    return {
      deliveryId: delivery?._id || resolvedOrder?._id || null,
      orderId: resolvedOrder?._id || delivery?._id || null,
      restaurant: resolvedOrder?.restaurant || resolvedOrder?.customerName || 'Accepted order',
      customerName: resolvedOrder?.customerName || 'Customer',
      customerPhone: resolvedOrder?.customerPhone || '',
      pickupLocation: pickup,
      dropLocation: drop,
      totalAmount: resolvedOrder?.totalAmount || 0,
      earning,
      projectedEarning: earning,
      acceptedAt,
      status: 'accepted',
      pathPoints,
      routeSummary: pickup && drop ? `${pickup.address} → ${drop.address}` : 'Route ready'
    };
  };

  const generateDemoOrder = () => {
    const effectiveLocation = location || readStoredLocation();
    if (!effectiveLocation) {
      setError('Enable location first so the demo order can be placed near you');
      return;
    }

    const pool = getNearbyDemoOrders(effectiveLocation);
    const demoOrder = pool[Math.floor(Math.random() * pool.length)];
    if (!demoOrder) return;

    const generatedOrder = {
      ...demoOrder,
      _id: `${demoOrder._id}-generated-${Date.now()}`,
      generatedAt: new Date().toISOString()
    };

    setGeneratedDemoOrders((prev) => [generatedOrder, ...prev]);

    setNearbyOrders((prev) => mergeOrders(prev, [generatedOrder]));
    setSuccess('Demo order generated near your current location');
    setTimeout(() => setSuccess(''), 2500);
  };

  useEffect(() => {
    if (isOnline && location) {
      loadNearbyOrders();
    }
  }, [isOnline, location?.latitude, location?.longitude]);

  // Initialize app
  useEffect(() => {
    requestNotificationPermission();
    checkLocation();
  }, []);

  useEffect(() => {
    return () => {
      stopLocationTracking();
      if (stopPollingRef.current) {
        stopPollingRef.current();
      }
    };
  }, []);

  // Handle online/offline
  useEffect(() => {
    if (isOnline) {
      startLocationTracking();
      loadActiveDeliveries();
      loadNearbyOrders();
    } else {
      stopLocationTracking();
      if (stopPollingRef.current) stopPollingRef.current();
    }
  }, [isOnline]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    const granted = await notificationService.requestNotificationPermission();
    if (!granted) {
      console.warn('Notifications not enabled');
    }
  };

  // Check if location is available
  const checkLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          persistLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        () => {
          const storedLocation = readStoredLocation();
          if (storedLocation) {
            setLocation(storedLocation);
            setSuccess('Using your last real location so the demo order still works');
            setTimeout(() => setSuccess(''), 3000);
            return;
          }

          setError('Enable location services to generate nearby demo orders');
        }
      );
    } else {
      const storedLocation = readStoredLocation();
      if (storedLocation) {
        setLocation(storedLocation);
        setSuccess('Using your last real location so the demo order still works');
        setTimeout(() => setSuccess(''), 3000);
        return;
      }

      setError('Location is required to generate a nearby demo order');
    }
  };

  // Start real-time location tracking
  const startLocationTracking = () => {
    if (!('geolocation' in navigator)) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0
        };

        setLocation(newLocation);
        persistLocation(newLocation);

        // Log activity
        const partnerId = localStorage.getItem('partnerId');
        locationService.logActivity(partnerId, partnerId, {
          type: 'location_update',
          location: newLocation,
          timestamp: new Date().toISOString()
        }).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Load nearby orders
  const loadNearbyOrders = async () => {
    if (!location) return;

    try {
      const orders = await orderService.getNearbyOrders(
        location.latitude,
        location.longitude,
        5
      );
      setNearbyOrders(mergeOrders(orders, generatedDemoOrders));

      // Start polling for new orders with notifications
      if (!stopPollingRef.current) {
        stopPollingRef.current = notificationService.startOrderPolling(
          localStorage.getItem('partnerId'),
          location.latitude,
          location.longitude,
          (newOrder) => {
            setNearbyOrders(prev => {
              if (!prev.find(o => o._id === newOrder._id)) {
                return [newOrder, ...prev];
              }
              return prev;
            });
            setNotificationCount(prev => prev + 1);
          }
        );
      }
    } catch (err) {
      if (isOnline) {
        const demoOrders = getNearbyDemoOrders(location);
        setNearbyOrders(mergeOrders(demoOrders, generatedDemoOrders));
        setError('Live backend unavailable. Showing nearby demo orders.');
      }
    }
  };

  // Load active deliveries
  const loadActiveDeliveries = async () => {
    try {
      const partnerId = localStorage.getItem('partnerId');
      const deliveries = await orderService.getActiveDeliveries(partnerId);
      setActiveDeliveries(deliveries);
    } catch (err) {
      console.warn('Failed to load active deliveries:', err.message);
    }
  };

  // Accept order
  const handleAcceptOrder = async (orderId) => {
    try {
      setLoading(true);
      setAcceptingOrderId(orderId);
      setError('');
      const partnerId = localStorage.getItem('partnerId');
      const selectedOrder = nearbyOrders.find((item) => item._id === orderId) || null;

      let delivery = null;
      const isDemoOrder = orderId.includes('demo-order') || orderId.includes('-generated-');

      if (!isDemoOrder) {
        try {
          delivery = await orderService.acceptOrder(orderId, partnerId);
        } catch {
          // Fall back to local acceptance so UI flow continues even when backend is unavailable.
          delivery = null;
        }
      }

      if (!delivery && selectedOrder) {
        delivery = {
          _id: `local-delivery-${Date.now()}`,
          status: 'accepted',
          acceptedAt: new Date().toISOString(),
          orderId: selectedOrder
        };
      }

      if (!delivery) {
        throw new Error('Unable to accept this order right now. Please try again.');
      }

      const taskSummary = buildAcceptedTaskSnapshot(delivery);

      localStorage.setItem('currentDeliveryId', delivery._id);
      localStorage.setItem('currentDeliveryTask', JSON.stringify(taskSummary));

      const storedPartner = safeParse(localStorage.getItem('partnerData')) || {};
      const updatedPartner = {
        ...storedPartner,
        currentDeliveryId: delivery._id,
        currentDeliveryTask: taskSummary,
        lastAcceptedOrder: taskSummary,
        lastAcceptedAt: taskSummary.acceptedAt,
        totalDeliveries: (Number(storedPartner.totalDeliveries) || 0) + 1
      };

      localStorage.setItem('partnerData', JSON.stringify(updatedPartner));
      setActiveTrip(taskSummary);
      setActiveDeliveries((prev) => [{ _id: delivery._id, status: delivery.status || 'accepted', orderId: selectedOrder || delivery.orderId || delivery }, ...prev]);
      setNearbyOrders((prev) => prev.filter((item) => item._id !== orderId));
      setOrderView('accepted');

      setSuccess('Order accepted and added to Accepted tab.');
    } catch (err) {
      setError(err.message || 'Failed to accept order');
    } finally {
      setLoading(false);
      setAcceptingOrderId(null);
    }
  };

  // Toggle Online/Offline
  const handleToggleOnline = async () => {
    try {
      const newStatus = !isOnline;
      setIsOnline(newStatus);
      localStorage.setItem('partnerOnlineStatus', String(newStatus));

      const partnerId = localStorage.getItem('partnerId');

      if (newStatus) {
        // Going online
        await locationService.logActivity(partnerId, partnerId, {
          type: 'online',
          location: location,
          timestamp: new Date().toISOString()
        });
        setSuccess('You\'re now online!');
      } else {
        // Going offline
        await locationService.logActivity(partnerId, partnerId, {
          type: 'offline',
          timestamp: new Date().toISOString()
        });
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setIsOnline(!isOnline); // Revert on error
      setError(err.message);
    }
  };

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('partnerId');
      navigate('/login');
    }
  };

  const handleRefresh = () => {
    if (location && isOnline) {
      loadNearbyOrders();
      loadActiveDeliveries();
    }
  };

  const totalDemoOrders = nearbyOrders.length + generatedDemoOrders.length;
  const currentTask = activeTrip || safeParse(localStorage.getItem('currentDeliveryTask'));
  const acceptedOrders = activeDeliveries.length > 0 ? activeDeliveries : currentTask ? [currentTask] : [];

  const availableCount = nearbyOrders.length;
  const acceptedCount = acceptedOrders.length;
  const deliveredCount = orderHistory.length;

  return (
    <div className="min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.09),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_48%,#f8fafc_100%)] text-slate-900">
      <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="absolute top-12 right-0 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-300/15 blur-3xl" />

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <div className="mx-auto w-full max-w-none px-4 pt-4 sm:px-6 lg:px-8">
          <CloverShellHeader
            title="Delivery dashboard"
            subtitle="Live order handling, map tracking, and quick partner controls in one Clover workspace."
            badge={<span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />{isOnline ? 'Online' : 'Offline'}</span>}
            actions={[
              { label: 'Profile', onClick: handleViewProfile, tone: 'secondary', icon: <MapPin size={14} />, chevron: false },
              { label: 'Earnings', onClick: () => navigate('/earnings'), tone: 'secondary', icon: <IndianRupee size={14} />, chevron: false },
              { label: 'Logout', onClick: handleLogout, tone: 'danger', icon: <AlertCircle size={14} />, chevron: false }
            ]}
          />
        </div>

        {(error || success) && (
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-8 pt-4">
            {error && (
              <div className="flex items-center gap-3 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800 shadow-sm">
                <AlertCircle size={18} className="shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 shadow-sm">
                <CheckCircle size={18} className="shrink-0" />
                <p className="text-sm font-medium">{success}</p>
              </div>
            )}
          </div>
        )}

        <div className="mx-auto flex-1 w-full max-w-none overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 pb-8">
          <div className="mb-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1fr]">
              <button
                onClick={handleToggleOnline}
                className={`group inline-flex items-center justify-center gap-2 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 ${
                  isOnline
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-rose-500 to-orange-500 shadow-rose-500/25'
                }`}
              >
                <Zap size={18} className="transition group-hover:scale-110" />
                {isOnline ? 'You are online' : 'Go online'}
              </button>

              <button
                onClick={generateDemoOrder}
                className="inline-flex items-center justify-center gap-2 rounded-[1.5rem] border border-slate-200 bg-white/85 px-5 py-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              >
                <Bell size={17} className="text-blue-600" />
                Generate order
              </button>

              <MetricCard tone="emerald" title="Today" value={`₹${stats.todayEarnings}`} hint="Earned on active deliveries" icon={IndianRupee} />
              <MetricCard tone="blue" title="Deliveries" value={String(stats.deliveries)} hint="Completed this session" icon={Clock} />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MiniStat label="Rating" value={`${stats.rating.toFixed(1)} ★`} />
              <MiniStat label="Orders nearby" value={String(nearbyOrders.length)} />
              <MiniStat label="Demo orders" value={String(totalDemoOrders)} />
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <StatusChip online={isOnline} count={notificationCount} />
            <Badge tone="blue">{notificationCount > 0 ? `${notificationCount} new` : 'Live sync'}</Badge>
          </div>
          {isOnline ? (
            <div className="space-y-6">
              <section className="grid gap-4 xl:grid-cols-[1.55fr_0.95fr]">
                <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                  <div className="flex flex-col gap-3 border-b border-slate-200/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                      <SectionTitle
                        eyebrow="Live location"
                        title="Real-time map tracking"
                        description="Auto-centers on your current GPS position and keeps nearby pickup markers visible."
                      />
                    </div>
                    <Badge tone="emerald">
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> Live
                    </Badge>
                  </div>

                  {location && (
                    <div className="px-5 pt-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm sm:col-span-2">
                          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500 font-semibold">Current position</p>
                          <p className="mt-2 text-sm text-slate-600">Coordinates</p>
                          <p className="text-lg font-black tracking-tight text-slate-900">
                            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900">
                          <p className="text-[10px] uppercase tracking-[0.28em] font-semibold text-blue-700">Accuracy</p>
                          <p className="mt-2 text-2xl font-black tracking-tight">±{Math.round(location.accuracy)}m</p>
                          <p className="text-xs text-blue-700/80 mt-1">GPS location from browser</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 sm:p-5">
                    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-slate-100 shadow-inner">
                      <div className="flex flex-col items-start gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">Map view</p>
                          <p className="text-xs text-slate-500">A larger canvas makes pickup points easier to demonstrate.</p>
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Tracking
                        </div>
                      </div>
                      <div className="h-[48vh] min-h-[320px] sm:h-[520px] lg:h-[620px] w-full">
                        {location ? (
                          <MapContainer
                            center={[location.latitude, location.longitude]}
                            zoom={15}
                            className="h-full w-full"
                          >
                            <MapResizer trigger={`${location.latitude}-${location.longitude}`} />
                            <LiveMapCenter latitude={location.latitude} longitude={location.longitude} />
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <Marker position={[location.latitude, location.longitude]} icon={currentLocationIcon}>
                              <Popup>
                                <div className="text-sm">
                                  <p className="font-semibold">You are here</p>
                                  <p>Accuracy: ±{Math.round(location.accuracy)}m</p>
                                </div>
                              </Popup>
                            </Marker>

                            <Circle
                              center={[location.latitude, location.longitude]}
                              radius={Math.max(location.accuracy || 30, 20)}
                              pathOptions={{ color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.18 }}
                            />

                            {nearbyOrders
                              .filter((o) => o?.pickupLocation?.latitude && o?.pickupLocation?.longitude)
                              .slice(0, 10)
                              .map((order) => (
                                <Marker
                                  key={order._id}
                                  position={[order.pickupLocation.latitude, order.pickupLocation.longitude]}
                                  icon={orderLocationIcon}
                                >
                                  <Popup>
                                    <div className="text-sm">
                                      <p className="font-semibold">{order.customerName || 'Order'}</p>
                                      <p>Pickup: {order.pickupLocation.address || 'N/A'}</p>
                                      <p>Amount: ₹{order.totalAmount || 0}</p>
                                    </div>
                                  </Popup>
                                </Marker>
                              ))}
                          </MapContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center bg-slate-100 px-4 text-center">
                            <p className="text-sm font-semibold text-slate-500">Waiting for your location. Enable GPS to load live map and nearby orders.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                    <SectionTitle
                      eyebrow="Live ops"
                      title="Partner snapshot"
                      description="A concise view of current work and momentum."
                    />
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <MetricCard tone="emerald" title="Today earnings" value={`₹${stats.todayEarnings}`} hint="Active session total" icon={IndianRupee} />
                      <MetricCard tone="blue" title="Deliveries" value={String(stats.deliveries)} hint="Completed this shift" icon={Clock} />
                      <MetricCard tone="amber" title="Rating" value={`${stats.rating.toFixed(1)} ★`} hint="Partner feedback average" icon={Zap} />
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                    <SectionTitle
                      eyebrow="Quick actions"
                      title="Fast partner controls"
                      description="Simple shortcuts for profile, refresh, and demo order creation."
                      action={
                        <button
                          onClick={handleRefresh}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:shadow-sm"
                        >
                          Refresh
                        </button>
                      }
                    />

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <button
                        onClick={handleViewProfile}
                        className="group rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <p className="text-sm font-bold text-slate-900">Open profile</p>
                        <p className="mt-1 text-xs text-slate-500">Update KYC, payout, and partner details</p>
                      </button>
                      <button
                        onClick={generateDemoOrder}
                        className="group rounded-[1.5rem] border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <p className="text-sm font-bold text-slate-900">Generate nearby order</p>
                        <p className="mt-1 text-xs text-slate-500">Create a demo delivery around your real location</p>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                <SectionTitle
                  eyebrow="Nearby work"
                  title={
                    orderView === 'available'
                      ? `Available orders (${availableCount})`
                      : orderView === 'accepted'
                        ? `Accepted orders (${acceptedCount})`
                        : `Delivered orders (${deliveredCount})`
                  }
                  description={
                    orderView === 'available'
                      ? 'Orders are filtered around your current location and surfaced in a delivery-partner friendly layout.'
                      : orderView === 'accepted'
                        ? 'Track the orders that are currently accepted and in progress.'
                        : 'Recent delivered orders credited to your earnings wallet.'
                  }
                  action={
                    <Badge tone="blue">
                      {notificationCount > 0 ? `${notificationCount} new` : 'Live sync'}
                    </Badge>
                  }
                />

                <div className="mb-4 grid gap-2 sm:grid-cols-3">
                  {[
                    { id: 'available', label: 'Available', count: availableCount },
                    { id: 'accepted', label: 'Accepted', count: acceptedCount },
                    { id: 'delivered', label: 'Delivered', count: deliveredCount }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setOrderView(tab.id)}
                      className={`inline-flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                        orderView === tab.id
                          ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                          : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:shadow-sm'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${orderView === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {orderView === 'available' && nearbyOrders.length === 0 ? (
                  <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <MapPin size={34} className="mx-auto text-slate-400" />
                    <p className="mt-3 text-base font-semibold text-slate-900">No nearby orders yet</p>
                    <p className="mt-1 text-sm text-slate-500">Go online or generate a demo order to show how the delivery flow works.</p>
                  </div>
                ) : orderView === 'available' ? (
                  <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                    {nearbyOrders.map((order) => {
                      const isSelected = selectedOrder?._id === order._id;

                      return (
                        <button
                          key={order._id}
                          type="button"
                          onClick={() => setSelectedOrder(isSelected ? null : order)}
                          className={`text-left rounded-[1.75rem] border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                            isSelected ? 'border-blue-300 ring-2 ring-blue-200' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-lg font-black text-slate-950">{order.customerName}</p>
                                <Badge tone={order.priority === 'urgent' ? 'amber' : order.priority === 'high' ? 'blue' : 'slate'}>
                                  {order.priority || 'standard'}
                                </Badge>
                              </div>
                              <p className="mt-1 text-xs text-slate-500">Order ID {order._id.slice(-6)}</p>
                            </div>

                            <div className="text-right">
                              <p className="text-2xl font-black text-emerald-600">₹{order.totalAmount}</p>
                              <p className="text-xs text-slate-500">{order.estimatedDistance?.toFixed(1)} km</p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 p-3">
                              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400 font-semibold">Pickup</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{order.pickupLocation?.address}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-3">
                              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400 font-semibold">Drop</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{order.dropLocation?.address}</p>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-2xl bg-blue-50 p-3">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-blue-500 font-semibold">ETA</p>
                                <p className="mt-1 text-lg font-black text-blue-900">{order.estimatedTime || '20'} min</p>
                              </div>
                              <div className="rounded-2xl bg-emerald-50 p-3">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-600 font-semibold">Action</p>
                                <p className="mt-1 text-sm font-semibold text-emerald-900">Tap call or accept below</p>
                              </div>
                            </div>
                          )}

                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                window.location.href = `tel:${order.customerPhone}`;
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                            >
                              <PhoneCall size={16} />
                              Call
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                handleAcceptOrder(order._id);
                              }}
                              disabled={Boolean(acceptingOrderId)}
                              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {acceptingOrderId === order._id ? 'Accepting...' : 'Accept'}
                            </button>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : orderView === 'accepted' ? (
                  acceptedOrders.length === 0 ? (
                    <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                      <Navigation size={34} className="mx-auto text-slate-400" />
                      <p className="mt-3 text-base font-semibold text-slate-900">No accepted order right now</p>
                      <p className="mt-1 text-sm text-slate-500">Accept any available order and it will appear here instantly.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {acceptedOrders.map((item, index) => {
                        const order = item.orderId && typeof item.orderId === 'object' ? item.orderId : item;
                        const status = item.status || 'accepted';
                        const pickup = order?.pickupLocation?.address || item?.pickupLocation?.address || 'Pickup pending';
                        const drop = order?.dropLocation?.address || item?.dropLocation?.address || 'Drop pending';
                        const customer = order?.customerName || item?.customerName || 'Customer';
                        const amount = order?.totalAmount || item?.totalAmount || 0;

                        return (
                          <div key={`${order?._id || item?.deliveryId || 'accepted'}-${index}`} className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-lg font-black text-slate-950">{customer}</p>
                              <Badge tone="emerald">{String(status).replace('_', ' ')}</Badge>
                            </div>
                            <p className="mt-2 text-sm font-semibold text-emerald-900">₹{amount}</p>
                            <div className="mt-3 grid gap-2">
                              <p className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700"><span className="font-bold">Pickup:</span> {pickup}</p>
                              <p className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700"><span className="font-bold">Drop:</span> {drop}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => navigate('/active-delivery')}
                              className="btn-primary mt-4 w-full py-3"
                            >
                              Continue delivery
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : deliveredCount === 0 ? (
                  <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <IndianRupee size={34} className="mx-auto text-slate-400" />
                    <p className="mt-3 text-base font-semibold text-slate-900">No delivered orders yet</p>
                    <p className="mt-1 text-sm text-slate-500">Complete a delivery and the credited earning will appear here.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                    {orderHistory.slice(0, 12).map((trip, idx) => (
                      <div key={`${trip.id}-${idx}`} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-base font-black text-slate-950">{trip.restaurant}</p>
                          <Badge tone="emerald">Delivered</Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{trip.time} • {trip.distance}</p>
                        <p className="mt-3 text-2xl font-black text-emerald-600">₹{trip.earning}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="grid flex-1 place-items-center px-4 py-8">
              <div className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/85 p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg">
                  <MapPin size={36} />
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950">Go online to start working</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">The dashboard is ready for live delivery partner mode. Go online to see nearby orders, the live map, and demo order creation.</p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <MetricCard tone="emerald" title="Delivery mode" value="Ready" hint="Live partner workflow" icon={Zap} />
                  <MetricCard tone="blue" title="Nearby demo" value={String(totalDemoOrders)} hint="Generated around your location" icon={Bell} />
                  <MetricCard tone="amber" title="Map" value="Live" hint="GPS and pickup markers" icon={MapPin} />
                </div>

                <button
                  onClick={handleToggleOnline}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-[1.5rem] bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:-translate-y-0.5"
                >
                  <Zap size={18} />
                  Start Working
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


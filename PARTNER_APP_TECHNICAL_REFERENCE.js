// =====================================================
// CLOVER PARTNER APP - TECHNICAL REFERENCE
// =====================================================

// AUTH FLOW - COMPLETE REFERENCE
// =====================================================

// 1. SEND OTP
authService.sendOtp(phone) 
  → POST /auth/send-otp { phone: "9876543210" }
  ← { success: true, message: "OTP sent" }

// 2. VERIFY OTP
authService.verifyOtp(phone, otp)
  → POST /auth/verify-otp { phone: "9876543210", otp: "1234" }
  ← { token: "jwt_token_here", _id: "worker_id" }
  → localStorage.setItem('authToken', token)

// 3. REGISTER PARTNER
authService.registerPartner({
  phone, firstName, lastName, email, dateOfBirth, gender,
  address, city, state, zipCode,
  accountHolderName, accountNumber, ifscCode, bankName,
  vehicleType, vehicleNumber, vehicleModel,
  panNumber, drivingLicenseNumber, aadharNumber
})
  → POST /workers/register with Authorization header
  ← { _id: "worker_id", firstName, phone, ... }

// 4. GET PROFILE
authService.getProfile(workerId)
  → GET /workers/:id with Authorization header
  ← Full worker object with all details

// 5. UPDATE PROFILE
authService.updateProfile(workerId, { firstName, email, address, ... })
  → PUT /workers/:id with Authorization header
  ← Updated worker object


// ORDER FLOW - COMPLETE REFERENCE
// =====================================================

// GET NEARBY ORDERS (Polling every 10 seconds)
orderService.getNearbyOrders(latitude, longitude, maxDistance)
  → GET /delivery/orders/available?lat=19.0760&lon=72.8777&maxDistance=5
  ← [
      {
        _id: "order_id",
        customerName: "John Doe",
        customerPhone: "9876543210",
        pickupLocation: { latitude, longitude, address },
        dropLocation: { latitude, longitude, address },
        totalAmount: 250,
        estimatedDistance: 2.5,
        estimatedTime: 20,
        status: "pending"
      },
      ...
    ]

// ACCEPT ORDER
orderService.acceptOrder(orderId, workerId)
  → PUT /delivery/orders/:id/accept { workerId }
  ← {
      _id: "delivery_id",
      orderId: "order_id",
      status: "assigned",
      workerId,
      pickedUpAt: null,
      deliveredAt: null,
      routePath: [],
      metrics: {}
    }
  → Save delivery_id for next operations


// DELIVERY LIFECYCLE
// =====================================================

// 1. GET ACTIVE DELIVERIES
orderService.getActiveDeliveries(workerId)
  → GET /delivery/workers/:id/deliveries
  ← [{ _id, orderId, status: "assigned" | "picked_up" | "on_way", ... }]

// 2. START LOGGING LOCATION (Once accepted)
Every 5-10 seconds:
locationService.logDeliveryLocation(orderId, workerId, 
  { latitude, longitude, accuracy, speed },
  { batteryLevel, isCharging, screenOn },
  { type, signalStrength, isConnected }
)
  → POST /delivery/orders/:id/location with full context
  ← { success, data }

// 3. PICK UP LOCATION
orderService.updateDeliveryStatus(deliveryId, "picked_up", location)
  → PUT /delivery/deliveries/:id/status
  ← Updated delivery with pickedUpAt timestamp

// 4. START DELIVERY
orderService.updateDeliveryStatus(deliveryId, "on_way", location)
  → PUT /delivery/deliveries/:id/status
  ← Updated delivery

// 5. COMPLETE & SUBMIT PROOF
orderService.submitDeliveryProof(deliveryId, {
  photo: "base64_string",
  signature: "base64_string",
  otp: "1234",
  location: { latitude, longitude },
  timestamp: "2024-04-15T08:34:00Z"
})
  → POST /delivery/deliveries/:id/proof
  ← { success, deliveryId, status: "completed" }


// REAL-TIME TRACKING - MAP REFERENCE
// =====================================================

// GET DELIVERY PATH (for map visualization)
orderService.getDeliveryTracking(orderId)
  → GET /delivery/orders/:id/tracking
  ← [
      { 
        _id: "activity_id",
        orderId, workerId,
        location: { latitude, longitude, accuracy, speed, heading },
        timestamp: "2024-04-15T08:05:00Z",
        deviceInfo: { batteryLevel: 100, isCharging: false },
        networkInfo: { type: "4g", signalStrength: -50 }
      },
      { ... }, // Next point
      { ... }  // Next point
    ]

// Convert to polyline for Leaflet:
const pathPoints = tracking.map(t => [t.location.latitude, t.location.longitude])
<Polyline positions={pathPoints} color="blue" />

// Current location marker:
const latest = tracking[tracking.length - 1]
<Marker position={[latest.location.latitude, latest.location.longitude]} />


// LOCATION SERVICE - REAL-TIME LOGGING
// =====================================================

// LOG ACTIVITY (Every 5-10 seconds)
locationService.logActivity(workerId, deliveryPartnerId, {
  type: "location_update" | "online" | "offline" | "order_accepted",
  location: { latitude, longitude, accuracy, speed },
  timestamp: "2024-04-15T08:05:00Z"
})
  → POST /delivery/activities/log
  ← { _id, workerId, createdAt, sentToCLOVER: false }

// GET ACTIVITY TIMELINE
locationService.getActivityTimeline(workerId, limit = 50)
  → GET /delivery/workers/:id/activities?limit=50
  ← [activity1, activity2, ...] (last 50 activities)

// GET WORKER STATS
locationService.getActivityStats(workerId)
  → GET /delivery/workers/:id/activity-stats
  ← {
      totalActivities: 147,
      activeHours: 8,
      totalDeliveries: 8,
      totalDistance: 42.5,
      totalEarnings: 2500,
      riskFlags: ["low_battery", "no_signal"],
      fraudDetections: 0
    }

// SYNC TO CLOVER (Hourly)
locationService.syncToCLOVER(workerId)
  → POST /delivery/activities/sync-to-clover
  ← {
      success: true,
      activitiesSynced: 245,
      dateRange: { from, to },
      claimsTriggered: 1
    }


// NOTIFICATION POLLING - REAL-TIME
// =====================================================

// START POLLING (Automatic when user goes online)
stopPollingRef.current = notificationService.startOrderPolling(
  workerId,
  latitude,
  longitude,
  (newOrder) => {
    // Called when new order detected
    setNearbyOrders(prev => [newOrder, ...prev])
    setNotificationCount(prev => prev + 1)
    // Browser notification shown automatically
    // Sound alert played automatically
  }
)

// Polling runs every 10 seconds:
// - GET /delivery/orders/available?lat=X&lon=Y&maxDistance=5
// - Check for orders not in localStorage
// - Show notification if new
// - Add to shownOrders list
// - Play sound

// STOP POLLING (When user goes offline)
stopPollingRef.current()


// DEVICE INFO - CONTINUOUSLY COLLECTED
// =====================================================

// Battery Info
navigator.getBattery?.()
  → { level: 0.85, charging: true, chargingTime: 3600 }
  → Convert to: { batteryLevel: 85, isCharging: true }

// Network Info
navigator.connection?.effectiveType
  → "4g" | "3g" | "2g" | "slow-2g"

// GPS Accuracy
position.coords.accuracy
  → ±50 (meters)

// Speed
position.coords.speed * 3.6
  → Convert m/s to km/h

// Every activity logs all this automatically!


// ZUSTAND STORES - STATE MANAGEMENT
// =====================================================

// useAuthStore
const { user, token, isAuthenticated } = useAuthStore()

// useOrderStore (Deprecated - now use services directly)
const { orders, activeDelivery, fetchNearbyOrders } = useOrderStore()

// useActivityStore (Deprecated - now use services directly)
const { activities, isTracking, logActivity } = useActivityStore()

// useDeliveryStore (Deprecated - now use services directly)
const { deliveries, currentDelivery } = useDeliveryStore()


// PROTECTED ROUTES
// =====================================================

// Check authentication:
const token = localStorage.getItem('authToken')
if (!token) redirect to /login

// ProtectedRoute component:
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<RealTimePartnerDashboard />} />
</Route>


// ERROR HANDLING
// =====================================================

try {
  const result = await authService.sendOtp(phone)
} catch (error) {
  // error.message contains API error message
  // Show to user:
  setError(error.message)
  // Clear after 3 seconds:
  setTimeout(() => setError(''), 3000)
}


// KEY HOOKS - REAL-TIME TRACKING
// =====================================================

// useEffect for location tracking:
useEffect(() => {
  if (isOnline) {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed * 3.6
        })
      },
      (error) => setError(error.message),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }
}, [isOnline])

// useEffect for polling orders:
useEffect(() => {
  if (isOnline && location) {
    stopPollingRef.current = notificationService.startOrderPolling(
      partnerId,
      location.latitude,
      location.longitude,
      (newOrder) => {
        // Handle new order
      }
    )
    return () => stopPollingRef.current?.()
  }
}, [isOnline, location])


// PERMISSIONS - BROWSER FEATURES
// =====================================================

// Location Permission
navigator.geolocation.getCurrentPosition() / watchPosition()
→ User grants "Allow" / "Deny"

// Notification Permission
await Notification.requestPermission()
→ "granted" | "denied" | "default"

// Battery API (optional)
navigator.getBattery?.()
→ May not be available on all browsers

// Network Info API (optional)
navigator.connection?.effectiveType
→ May not be available on all browsers


// FILE UPLOAD FORMATS
// =====================================================

// Proof of Delivery Photo
canvas.toBlob((blob) => {
  const reader = new FileReader()
  reader.readAsDataURL(blob)
  reader.onload = () => {
    const base64 = reader.result // "data:image/png;base64,..."
    // Send to: /delivery/deliveries/:id/proof
  }
})

// Signature
signatureCanvas.toDataURL()
→ "data:image/png;base64,..." // Base64 encoded


// IMPORTANT CONSTANTS
// =====================================================

API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds
ORDER_POLLING_INTERVAL = 10000; // 10 seconds
MAP_UPDATE_INTERVAL = 5000; // 5 seconds
GPS_ACCURACY_THRESHOLD = 50; // meters
MAX_NEARBY_DISTANCE = 5; // km
DELIVERY_STATUS = ["assigned", "picked_up", "on_way", "completed"]


// TESTING REFERENCE
// =====================================================

// Test phone number:
"9876543210" (or any 10 digits)

// Test OTP:
Backend will send real OTP via SMS
(Or configure test account for demo OTP)

// Test order creation:
POST to /delivery/orders with valid data

// Test location:
Device needs GPS (works on Android/iOS + browser geolocation)

// Test notifications:
Browser needs notification permission
Phone speaker needs to be on for sound

// Test map:
Browser needs internet for OpenStreetMap tiles


// =====================================================
// END TECHNICAL REFERENCE
// =====================================================

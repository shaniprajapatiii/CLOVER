import React, { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Camera, Check, AlertCircle, Sparkles, ShieldCheck, MapPin } from 'lucide-react';
import { CloverShellHeader } from './CloverShellHeader';
import { useEarningsStore } from '../store/useEarningsStore';

/**
 * Proof of Delivery Component
 * Captures:
 * 1. Photo of delivery location
 * 2. Customer signature
 * 3. GPS coordinates
 */
const ProofOfDelivery = ({ orderId, onSuccess, onError }) => {
  const locationState = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const signatureCanvasRef = useRef(null);
  
  const [step, setStep] = useState('photo'); // photo, signature, review
  const [photo, setPhoto] = useState(null);
  const [signature, setSignature] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const addCompletedOrder = useEarningsStore((state) => state.addCompletedOrder);
  const clearActiveTrip = useEarningsStore((state) => state.clearActiveTrip);
  const savedTask = (() => {
    try {
      return JSON.parse(localStorage.getItem('currentDeliveryTask') || 'null');
    } catch {
      return null;
    }
  })();
  const resolvedOrderId = orderId || locationState.state?.orderId || savedTask?.orderId || locationState.state?.deliveryId || localStorage.getItem('currentDeliveryId');

  // ==================== Initialize Camera ====================
  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }, // Back camera
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.');
      console.error('Camera error:', err);
    }
  };

  // ==================== Capture Photo ====================
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      
      context.drawImage(videoRef.current, 0, 0);
      
      const photoData = canvasRef.current.toDataURL('image/jpeg', 0.8);
      setPhoto(photoData);
      
      // Stop camera
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }

      // Get GPS location
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        });
      }

      setStep('signature');
    }
  };

  // ==================== Draw on Signature Canvas ====================
  const handleSignatureMouseDown = (e) => {
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');

    let isDrawing = false;

    const onMouseMove = (e) => {
      if (!isDrawing) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const onMouseUp = () => {
      isDrawing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawing = true;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // ==================== Clear Signature ====================
  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignature(null);
    }
  };

  // ==================== Get Signature Data ====================
  const getSignatureData = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      return canvas.toDataURL('image/png');
    }
    return null;
  };

  // ==================== Submit Proof ====================
  const submitProof = async () => {
    if (!resolvedOrderId) {
      setError('Missing delivery reference. Please go back and reopen the delivery.');
      return;
    }

    if (!photo || !signature) {
      setError('Photo and signature are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/delivery/orders/${resolvedOrderId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          photo,
          signature,
          location: location || { latitude: 0, longitude: 0 }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to submit proof');

      if (data.success !== false) {
        const earning = Number(savedTask?.earning || savedTask?.projectedEarning || data?.data?.earning || 0);
        addCompletedOrder({
          id: savedTask?.orderId || resolvedOrderId,
          restaurant: savedTask?.restaurant || data?.data?.restaurant || 'Completed order',
          distance: savedTask?.estimatedDistance ? `${savedTask.estimatedDistance} km` : (data?.data?.distance || '0 km'),
          earning,
          type: 'food'
        });

        clearActiveTrip();
        localStorage.removeItem('currentDeliveryTask');
        localStorage.removeItem('currentDeliveryId');

        const rawPartner = localStorage.getItem('partnerData');
        if (rawPartner) {
          try {
            const partner = JSON.parse(rawPartner) || {};
            localStorage.setItem('partnerData', JSON.stringify({
              ...partner,
              currentDeliveryId: null,
              currentDeliveryTask: null,
              totalEarnings: (Number(partner.totalEarnings) || 0) + earning
            }));
          } catch {
            // no-op
          }
        }

        setStep('review');
        onSuccess?.(data.data);
        setTimeout(() => {
          navigate('/earnings', { replace: true });
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit proof');
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  // ==================== Initialize on Mount ====================
  React.useEffect(() => {
    if (step === 'photo') {
      initializeCamera();
    }
  }, [step]);

  return (
    <div className="public-shell min-h-[100dvh] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <CloverShellHeader
          title="Proof of delivery"
          subtitle="Capture photo, signature, and location in a single Clover workflow."
          badge={<span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"><Sparkles size={14} /> Secure completion</span>}
          actions={[
            { label: 'Back to delivery', onClick: () => navigate('/active-delivery'), tone: 'secondary', icon: <MapPin size={14} />, chevron: false },
            { label: 'Dashboard', onClick: () => navigate('/dashboard'), tone: 'secondary', icon: <ShieldCheck size={14} />, chevron: false }
          ]}
        />

        <div className="page-card mt-4 overflow-hidden p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-title">Delivery complete flow</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Lock the order with proof</h2>
              <p className="mt-1 text-sm text-slate-500">Use one clean card flow for photo, signature, and GPS location.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className={`rounded-[1.35rem] border p-4 ${step === 'photo' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
              <p className="text-[10px] uppercase tracking-[0.24em] font-semibold text-slate-500">Step 1</p>
              <p className="mt-1 font-black text-slate-950">Photo capture</p>
            </div>
            <div className={`rounded-[1.35rem] border p-4 ${step === 'signature' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
              <p className="text-[10px] uppercase tracking-[0.24em] font-semibold text-slate-500">Step 2</p>
              <p className="mt-1 font-black text-slate-950">Signature</p>
            </div>
            <div className={`rounded-[1.35rem] border p-4 ${step === 'review' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
              <p className="text-[10px] uppercase tracking-[0.24em] font-semibold text-slate-500">Step 3</p>
              <p className="mt-1 font-black text-slate-950">Review & submit</p>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-[1.35rem] border border-rose-200 bg-rose-50 p-4 flex items-start">
              <AlertCircle className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
              <div>
                <p className="font-medium text-rose-800">Error</p>
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] font-semibold text-slate-500">Capture</p>
                  <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                    {step === 'photo' ? 'Take delivery photo' : step === 'signature' ? 'Draw customer signature' : 'Review proof details'}
                  </h3>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  {resolvedOrderId ? 'Reference ready' : 'Missing reference'}
                </div>
              </div>

              {step === 'photo' && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-slate-600">Take a clear photo at the delivery location before collecting the signature.</p>

                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="h-80 w-full rounded-[1.5rem] bg-slate-950 object-cover shadow-inner"
                  />

                  <canvas ref={canvasRef} className="hidden" />

                  <button
                    onClick={capturePhoto}
                    className="btn-primary w-full py-3"
                  >
                    <Camera className="h-5 w-5" />
                    Capture photo
                  </button>
                </div>
              )}

              {step === 'signature' && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-slate-600">Capture the customer signature directly on the canvas below.</p>

                  {photo && (
                    <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Photo preview</p>
                      <img src={photo} alt="Delivery proof" className="h-36 w-full rounded-[1.1rem] object-cover" />
                    </div>
                  )}

                  <div className="rounded-[1.35rem] border border-slate-200 bg-white p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Signature pad</p>
                    <canvas
                      ref={signatureCanvasRef}
                      onMouseDown={handleSignatureMouseDown}
                      width={300}
                      height={150}
                      className="h-44 w-full rounded-[1.1rem] border border-slate-200 bg-white cursor-crosshair"
                    />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      onClick={clearSignature}
                      className="btn-secondary py-3"
                    >
                      Clear
                    </button>

                    <button
                      onClick={() => {
                        const sig = getSignatureData();
                        if (sig && sig !== 'data:image/png;base64,') {
                          setSignature(sig);
                          setStep('review');
                        } else {
                          setError('Please provide a signature');
                        }
                      }}
                      className="btn-primary py-3"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {step === 'review' && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-slate-600">Review everything once before completing the delivery proof.</p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {photo && (
                      <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Photo</p>
                        <img src={photo} alt="Delivery proof" className="h-36 w-full rounded-[1.1rem] object-cover" />
                      </div>
                    )}

                    {signature && (
                      <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Signature</p>
                        <img src={signature} alt="Customer signature" className="h-36 w-full rounded-[1.1rem] object-contain bg-white" />
                      </div>
                    )}
                  </div>

                  {location && (
                    <div className="rounded-[1.35rem] border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
                      <div className="flex items-center gap-2 font-semibold">
                        <MapPin size={16} />
                        Location captured
                      </div>
                      <p className="mt-1">{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</p>
                    </div>
                  )}

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      onClick={() => {
                        setStep('signature');
                        setSignature(null);
                      }}
                      className="btn-secondary py-3"
                    >
                      Back
                    </button>

                    <button
                      onClick={submitProof}
                      disabled={loading}
                      className="btn-primary py-3 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Check className="h-5 w-5" />
                      {loading ? 'Submitting...' : 'Submit proof'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-[0_20px_50px_rgba(15,23,42,0.25)]">
                <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-[0.24em]">
                  <ShieldCheck size={14} /> Verified completion
                </div>
                <p className="mt-2 text-lg font-black leading-tight">Use this final card to lock the delivery with proof, signature, and location.</p>
                <p className="mt-2 text-sm text-slate-300">The capture flow keeps every proof step visible and simple for the partner.</p>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Checklist</p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${photo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    Photo captured
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${signature ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    Customer signature saved
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${location ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    GPS location captured
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProofOfDelivery;

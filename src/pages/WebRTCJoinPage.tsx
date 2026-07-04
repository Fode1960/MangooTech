import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import WebRTCManagerConnectPlus from '../components/WebRTCManagerConnectPlus';
import { LiveShoppingProvider } from '../contexts/LiveShoppingContext';
import mangooLogoUrl from '../assets/mangoo-logo.svg';

const WebRTCJoinPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roleParam = String(searchParams.get('role') || '').toLowerCase();
  const role = roleParam === 'client' ? 'client' : 'vendor';
  const forcedUserId = String(searchParams.get('userId') || '').trim();
  const autoCallParam = String(searchParams.get('autoCall') || '').trim() === '1';
  const rawRoomId = String(searchParams.get('roomId') || 'demo-room-123');
  const roomId = useMemo(() => {
    const rid = String(rawRoomId || '').trim()
    const low = rid.toLowerCase()
    const uid = String(forcedUserId || '').trim()
    const uidLow = uid.toLowerCase()
    if (!autoCallParam && role === 'vendor' && low.startsWith('client:') && (uidLow.startsWith('shop:') || uidLow.startsWith('support:'))) return uid
    return rid
  }, [autoCallParam, forcedUserId, rawRoomId, role])
  const uiParam = String(searchParams.get('ui') || '').toLowerCase();
  const callParam = String(searchParams.get('call') || '').trim().toLowerCase()
  const callMode = callParam === 'audio' ? 'audio' : (callParam === 'video' ? 'video' : 'auto')
  const ui = uiParam === 'ultra' ? 'ultra' : (uiParam === 'simple' ? 'simple' : 'full')
  const instanceId = useMemo(() => Math.random().toString(36).slice(2, 10), []);
  const userId = useMemo(() => {
    if (forcedUserId) return forcedUserId;
    const rid = String(roomId || '').trim();
    const low = rid.toLowerCase();
    if (role === 'client' && low.startsWith('client:')) return rid;
    if (role === 'vendor' && low.startsWith('shop:')) return rid;
    return `${role}_${instanceId}`;
  }, [forcedUserId, instanceId, role, roomId]);
  const fromLabel = String(searchParams.get('fromLabel') || searchParams.get('label') || '').trim();
  const returnRoomId = String(searchParams.get('returnRoomId') || '').trim()
  const returnUiParam = String(searchParams.get('returnUi') || '').trim().toLowerCase()
  const returnUi = returnUiParam === 'ultra' ? 'ultra' : (returnUiParam === 'simple' ? 'simple' : (returnUiParam === 'full' ? 'full' : ''))
  const returnUserId = String(searchParams.get('returnUserId') || '').trim()
  const returnFromLabel = String(searchParams.get('returnFromLabel') || '').trim()
  const forceOffline = String(searchParams.get('forceOffline') || '').trim() === '1';
  const autoCall = autoCallParam;
  const startCallSignal = useMemo(() => (autoCall ? Date.now() : 0), [autoCall]);

  React.useEffect(() => {
    const rid = String(rawRoomId || '').trim()
    if (!rid) return
    if (rid === String(roomId || '').trim()) return
    try {
      const u = new URL(String(window.location.href || ''))
      u.searchParams.set('roomId', String(roomId || '').trim())
      window.history.replaceState(null, '', u.toString())
    } catch {
    }
  }, [rawRoomId, roomId])
  const isSecureOrigin = useMemo(() => {
    try {
      const h = String(window.location.hostname || '').toLowerCase();
      const isLocal = h === 'localhost' || h === '127.0.0.1' || h === '::1';
      const isHttps = String(window.location.protocol || '').toLowerCase() === 'https:';
      return isHttps || isLocal;
    } catch {
      return false;
    }
  }, []);
  const effectiveFromLabel = useMemo(() => {
    if (fromLabel) return fromLabel;
    const rid = String(roomId || '').trim();
    if (role === 'vendor') {
      if (rid.toLowerCase().startsWith('shop:')) return `Boutique ${rid.slice(5)}`;
      return 'Vendeur';
    }
    const uid = String(userId || '').trim();
    if (uid.toLowerCase().startsWith('client:')) return `Client ${uid.slice(7)}`;
    if (rid.toLowerCase().startsWith('client:')) return `Client ${rid.slice(7)}`;
    return 'Client';
  }, [fromLabel, roomId, role, userId]);
  const roomQs = encodeURIComponent(roomId);
  const vendorHref = `/webrtc?role=vendor&roomId=${roomQs}`;
  const clientHref = `/webrtc?role=client&roomId=${roomQs}`;
  const vendorHrefSimple = `${vendorHref}&ui=simple`;
  const clientHrefSimple = `${clientHref}&ui=simple`;
  const vendorHrefUltra = `${vendorHref}&ui=ultra`;
  const clientHrefUltra = `${clientHref}&ui=ultra`;

  return (
    <LiveShoppingProvider>
      <div className="h-dvh overflow-hidden bg-gradient-to-br from-gray-950 via-gray-950 to-green-950">
        <div className="max-w-6xl mx-auto h-full p-4 flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img src={mangooLogoUrl} alt="Mangoo Tech" className="w-10 h-10 shrink-0" />
              <div className="min-w-0">
                <div className="text-white font-semibold text-lg leading-tight">Mangoo Connect+</div>
                <div className="text-gray-300 text-xs sm:text-sm truncate">
                  ID: {effectiveFromLabel} • Salon: {roomId} • {role === 'vendor' ? 'Vendeur' : 'Client'} • UI: {ui === 'simple' ? 'Simple' : 'Complète'}
                </div>
                {!isSecureOrigin && (
                  <div className="mt-1 text-[11px] sm:text-xs text-amber-200">
                    Attention: micro/caméra bloqués sur http://IP. Sur PC utilisez http://localhost:3015. Sur téléphone, utilisez HTTPS.
                  </div>
                )}
                
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={ui === 'ultra' ? vendorHrefUltra : (ui === 'simple' ? vendorHrefSimple : vendorHref)}
                className={`text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${role === 'vendor' ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white' : 'bg-white/10 hover:bg-white/15 text-white'}`}
              >
                Vendeur
              </a>
              <a
                href={ui === 'ultra' ? clientHrefUltra : (ui === 'simple' ? clientHrefSimple : clientHref)}
                className={`text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${role === 'client' ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white' : 'bg-white/10 hover:bg-white/15 text-white'}`}
              >
                Client
              </a>
              <a
                href="/"
                className="text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors"
              >
                Retour
              </a>
            </div>
          </div>

          <div className="flex-1 min-h-0 rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
            <WebRTCManagerConnectPlus
              role={role}
              roomId={roomId}
              userId={userId}
              ui={ui}
              callMode={callMode as any}
              fromLabel={effectiveFromLabel}
              returnRoomId={returnRoomId || undefined}
              returnUi={returnUi || undefined}
              returnUserId={returnUserId || undefined}
              returnFromLabel={returnFromLabel || undefined}
              forceOffline={forceOffline}
              startCallSignal={startCallSignal || undefined}
            />
          </div>
        </div>
      </div>
    </LiveShoppingProvider>
  );
};

export default WebRTCJoinPage;

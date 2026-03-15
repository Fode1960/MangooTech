import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import WebRTCManagerFinal from '../components/WebRTCManagerFinal';
import { LiveShoppingProvider } from '../contexts/LiveShoppingContext';

const WebRTCJoinPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roleParam = String(searchParams.get('role') || '').toLowerCase();
  const roomId = String(searchParams.get('roomId') || 'demo-room-123');
  const role = roleParam === 'client' ? 'client' : 'vendor';
  const instanceId = useMemo(() => Math.random().toString(36).slice(2, 10), []);
  const userId = `${role}_${instanceId}`;

  return (
    <LiveShoppingProvider>
      <div className="h-dvh bg-gray-950 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full p-4 flex flex-col">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-white font-bold text-xl">WebRTC</div>
              <div className="text-gray-400 text-sm">Room: {roomId} • Rôle: {role}</div>
            </div>
            <a
              href="/"
              className="text-sm font-semibold px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
            >
              Retour
            </a>
          </div>
          <div className="flex-1 min-h-0">
            <WebRTCManagerFinal role={role} roomId={roomId} userId={userId} />
          </div>
        </div>
      </div>
    </LiveShoppingProvider>
  );
};

export default WebRTCJoinPage;

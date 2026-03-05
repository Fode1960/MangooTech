import React from 'react';
import WebRTCManagerAfricainFixed from '../components/WebRTCManagerAfricainFixed';

const ClientWebRTCFixed: React.FC = () => {
  const roomId = 'demo-vendor-room';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <WebRTCManagerAfricainFixed
        mode="video-call"
        roomId={roomId}
        userRole="customer"
      />
    </div>
  );
};

export default ClientWebRTCFixed;
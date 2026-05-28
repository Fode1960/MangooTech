import React from 'react';
import WebRTCManagerAfricainFixed from '../components/WebRTCManagerAfricainFixed';

const VendorWebRTCFixed: React.FC = () => {
  const roomId = 'demo-vendor-room';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <WebRTCManagerAfricainFixed
        mode="video-call"
        roomId={roomId}
        userRole="vendor"
      />
    </div>
  );
};

export default VendorWebRTCFixed;
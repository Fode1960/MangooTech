import React from 'react';
import WebRTCManagerFinal from '../components/WebRTCManagerFinal';

const VendorWebRTCPage: React.FC = () => {
  const roomId = 'demo-room-123';
  const userId = 'vendor-001';

  return (
    <div className="h-screen">
      <WebRTCManagerFinal 
        role="vendor"
        roomId={roomId}
        userId={userId}
      />
    </div>
  );
};

export default VendorWebRTCPage;
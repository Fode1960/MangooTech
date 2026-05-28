import React from 'react';
import WebRTCManagerFinal from '../components/WebRTCManagerFinal';

const ClientWebRTCPage: React.FC = () => {
  const roomId = 'demo-room-123';
  const userId = 'client-001';

  return (
    <div className="h-screen">
      <WebRTCManagerFinal 
        role="client"
        roomId={roomId}
        userId={userId}
      />
    </div>
  );
};

export default ClientWebRTCPage;
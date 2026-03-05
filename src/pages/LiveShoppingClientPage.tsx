import React from 'react';
import LiveShoppingVoIPManager from '../components/LiveShoppingVoIPManager';

const LiveShoppingClientPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <LiveShoppingVoIPManager
        mode="viewer"
        roomId="live-room-8888"
        userId="client-8889"
        userName="Client 8889"
        sipNumber="8889"
        sipPassword="8889"
      />
    </div>
  );
};

export default LiveShoppingClientPage;
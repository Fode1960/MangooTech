import React from 'react';
import LiveShoppingVoIPManager from '../components/LiveShoppingVoIPManager';

const LiveShoppingDirectHost: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <LiveShoppingVoIPManager
        mode="host"
        roomId="live-room-8888"
        userId="host-8888"
        userName="Vendeur 8888"
        sipNumber="8888"
        sipPassword="8888"
      />
    </div>
  );
};

export default LiveShoppingDirectHost;
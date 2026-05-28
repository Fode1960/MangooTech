import React from 'react';
import { VideoCallProvider } from '../contexts/VideoCallContext';
import VideoCallManager from '../components/VideoCallManager';

const VideoCallManagerPage: React.FC = () => {
  return (
    <VideoCallProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <VideoCallManager />
        </div>
      </div>
    </VideoCallProvider>
  );
};

export default VideoCallManagerPage;
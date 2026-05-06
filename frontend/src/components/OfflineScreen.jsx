import React from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="gradient-bg w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <WifiOff size={36} color="white" />
      </div>
      <h1 className="text-white text-2xl font-bold mb-2">No Internet</h1>
      <p className="text-gray-400 text-sm max-w-xs">
        Anti-WA needs an internet connection to work. Please check your Wi-Fi or mobile data and try again.
      </p>
      <button
        className="btn-primary mt-8 w-full max-w-xs"
        onClick={() => window.location.reload()}
      >
        Retry
      </button>
    </div>
  );
}

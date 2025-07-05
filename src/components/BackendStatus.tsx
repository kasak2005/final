import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';

const BackendStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkBackendStatus = async () => {
    setIsChecking(true);
    try {
      const response = await apiService.healthCheck();
      setIsConnected(response.success !== false);
      setLastChecked(new Date());
    } catch (error) {
      setIsConnected(false);
      setLastChecked(new Date());
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkBackendStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (isConnected === null || isChecking) return 'text-yellow-400';
    return isConnected ? 'text-green-400' : 'text-red-400';
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking...';
    if (isConnected === null) return 'Unknown';
    return isConnected ? 'Connected' : 'Disconnected';
  };

  const getStatusIcon = () => {
    if (isChecking) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (isConnected === null) return <Server className="h-4 w-4" />;
    return isConnected ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />;
  };

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
    >
      <div className="glass rounded-lg p-3 border border-white/10 shadow-lg">
        <div className="flex items-center space-x-2">
          <div className={getStatusColor()}>
            {getStatusIcon()}
          </div>
          <div className="text-sm">
            <div className={`font-medium ${getStatusColor()}`}>
              Backend: {getStatusText()}
            </div>
            {lastChecked && (
              <div className="text-xs text-gray-400">
                Last: {lastChecked.toLocaleTimeString()}
              </div>
            )}
          </div>
          <button
            onClick={checkBackendStatus}
            disabled={isChecking}
            className="p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 text-gray-400 ${isChecking ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {!isConnected && isConnected !== null && (
          <div className="mt-2 text-xs text-red-400">
            Make sure Flask backend is running on port 5000
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BackendStatus;
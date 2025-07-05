import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, AlertTriangle, CheckCircle, RefreshCw, Settings, Calendar } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';

interface CameraCheckProps {
  onCameraReady: (isReady: boolean) => void;
  onReschedule?: () => void;
}

const CameraCheck: React.FC<CameraCheckProps> = ({ onCameraReady, onReschedule }) => {
  const [checkStatus, setCheckStatus] = useState<'checking' | 'success' | 'error' | 'no-camera'>('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const [troubleshootingStep, setTroubleshootingStep] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  
  const {
    isActive,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    capturePhoto
  } = useCamera();

  const troubleshootingSteps = [
    {
      title: "Check Camera Permissions",
      description: "Make sure your browser has permission to access your camera",
      action: "Click the camera icon in your browser's address bar and allow camera access"
    },
    {
      title: "Check Camera Connection",
      description: "Ensure your camera is properly connected and not being used by another application",
      action: "Close other video applications (Zoom, Teams, etc.) and try again"
    },
    {
      title: "Try Different Browser",
      description: "Some browsers work better with camera access",
      action: "Try using Chrome, Firefox, or Edge for the best experience"
    },
    {
      title: "Restart Browser",
      description: "Sometimes a browser restart can resolve camera issues",
      action: "Close and reopen your browser, then return to this page"
    }
  ];

  useEffect(() => {
    performCameraCheck();
  }, []);

  const performCameraCheck = async () => {
    setCheckStatus('checking');
    setErrorMessage('');
    
    try {
      // Check if camera is available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        setCheckStatus('no-camera');
        setErrorMessage('No camera detected on this device');
        onCameraReady(false);
        return;
      }

      // Try to start camera
      await startCamera();
      
      // Wait a moment to ensure camera is working
      setTimeout(() => {
        if (isActive) {
          setCheckStatus('success');
          onCameraReady(true);
        } else {
          setCheckStatus('error');
          setErrorMessage('Camera failed to start properly');
          onCameraReady(false);
        }
      }, 2000);
      
    } catch (error: any) {
      console.error('Camera check failed:', error);
      setCheckStatus('error');
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError') {
        setErrorMessage('Camera access was denied. Please allow camera permissions and try again.');
      } else if (error.name === 'NotFoundError') {
        setErrorMessage('No camera found. Please connect a camera and try again.');
      } else if (error.name === 'NotReadableError') {
        setErrorMessage('Camera is being used by another application. Please close other video apps and try again.');
      } else {
        setErrorMessage('Unable to access camera. Please check your camera settings and try again.');
      }
      
      onCameraReady(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    performCameraCheck();
  };

  const handleProceedWithoutCamera = () => {
    onCameraReady(true); // Allow proceeding without camera
  };

  const renderTroubleshooting = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Troubleshooting Steps</h3>
      {troubleshootingSteps.map((step, index) => (
        <motion.div
          key={index}
          className={`p-4 rounded-xl border ${
            index === troubleshootingStep 
              ? 'border-cyber-blue bg-cyber-blue/10' 
              : 'border-white/10 bg-dark-200/30'
          }`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-start space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              index === troubleshootingStep 
                ? 'bg-cyber-blue text-white' 
                : 'bg-gray-600 text-gray-300'
            }`}>
              {index + 1}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-white mb-1">{step.title}</h4>
              <p className="text-gray-300 text-sm mb-2">{step.description}</p>
              <p className="text-cyber-blue text-sm">{step.action}</p>
            </div>
          </div>
        </motion.div>
      ))}
      
      <div className="flex space-x-3 mt-6">
        <button
          onClick={() => setTroubleshootingStep(prev => Math.min(prev + 1, troubleshootingSteps.length - 1))}
          disabled={troubleshootingStep >= troubleshootingSteps.length - 1}
          className="bg-cyber-blue text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next Step
        </button>
        <button
          onClick={handleRetry}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 font-orbitron">Camera Check</h2>
        <p className="text-gray-300">We need to verify your camera is working properly</p>
      </div>

      {/* Camera Preview */}
      <div className="mb-6">
        <div className="bg-dark-200/50 rounded-2xl aspect-video flex items-center justify-center border border-white/10 relative overflow-hidden">
          {checkStatus === 'checking' && (
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-cyber-blue border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-white">Checking camera...</p>
            </div>
          )}
          
          {checkStatus === 'success' && isActive && (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover rounded-2xl"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Camera Working</span>
              </div>
            </>
          )}
          
          {(checkStatus === 'error' || checkStatus === 'no-camera') && (
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 font-medium mb-2">Camera Issue Detected</p>
              <p className="text-gray-300 text-sm">{errorMessage}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status and Actions */}
      {checkStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-green-400 font-medium">Camera is working perfectly!</p>
            <p className="text-gray-300 text-sm">You're ready to start your interview</p>
          </div>
          
          <button
            onClick={() => onCameraReady(true)}
            className="bg-gradient-to-r from-cyber-blue to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 btn-futuristic"
          >
            Continue to Interview
          </button>
        </motion.div>
      )}

      {checkStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 font-medium text-center">Camera Access Failed</p>
            <p className="text-gray-300 text-sm text-center">{errorMessage}</p>
          </div>

          {retryCount < 3 ? (
            renderTroubleshooting()
          ) : (
            <div className="text-center space-y-4">
              <p className="text-gray-300">Still having trouble? You have a few options:</p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleProceedWithoutCamera}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Continue Without Camera</span>
                </button>
                
                {onReschedule && (
                  <button
                    onClick={onReschedule}
                    className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Reschedule Interview</span>
                  </button>
                )}
                
                <button
                  onClick={handleRetry}
                  className="bg-cyber-blue text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {checkStatus === 'no-camera' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <Camera className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-yellow-400 font-medium">No Camera Detected</p>
            <p className="text-gray-300 text-sm">This device doesn't have a camera or it's not accessible</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleProceedWithoutCamera}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Continue Without Camera
            </button>
            
            {onReschedule && (
              <button
                onClick={onReschedule}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Calendar className="h-4 w-4" />
                <span>Reschedule Interview</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CameraCheck;
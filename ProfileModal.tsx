import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { X, User, Mail, Phone, Building, Save, Camera, CreditCard } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import LoadingSpinner from './LoadingSpinner';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    hrId: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  const {
    isActive,
    capturedPhoto,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    capturePhoto,
    retakePhoto
  } = useCamera();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        hrId: user.hrId || ''
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const updates = {
        ...formData,
        avatar: capturedPhoto || user?.avatar
      };

      const success = await updateProfile(updates);
      
      if (success) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    }
  };

  const handleCameraToggle = async () => {
    if (showCamera && isActive) {
      stopCamera();
    }
    setShowCamera(!showCamera);
    
    if (!showCamera && !isActive) {
      try {
        await startCamera();
      } catch (error) {
        setError('Unable to access camera. Please check permissions.');
      }
    }
  };

  if (!isOpen || !user) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass rounded-3xl p-8 border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white font-orbitron">Update Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Profile Photo Section */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-center">
              <Camera className="h-5 w-5 mr-2 text-cyber-blue" />
              Profile Photo
            </h3>
            
            <div className="flex flex-col items-center space-y-4">
              {/* Photo Preview */}
              <div className="relative">
                {capturedPhoto || user.avatar ? (
                  <div className="relative">
                    <img
                      src={capturedPhoto || user.avatar}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-2 border-cyber-blue glow-blue"
                    />
                    {capturedPhoto && (
                      <button
                        type="button"
                        onClick={retakePhoto}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-dark-200/50 border-2 border-dashed border-gray-600 flex items-center justify-center">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCameraToggle}
                  className="btn-futuristic bg-gradient-to-r from-cyber-blue to-purple-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
                >
                  <Camera className="h-4 w-4" />
                  <span>{showCamera ? 'Hide Camera' : 'Open Camera'}</span>
                </button>

                {isActive && (
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="btn-futuristic bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                  >
                    Take Photo
                  </button>
                )}
              </div>

              {/* Camera Preview */}
              {showCamera && (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-64 h-48 object-cover rounded-xl border border-white/10"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyber-blue focus:border-cyber-blue transition-all duration-200"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyber-blue focus:border-cyber-blue transition-all duration-200"
                  required
                  disabled
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyber-blue focus:border-cyber-blue transition-all duration-200"
                />
              </div>
            </div>

            {(user.role === 'hr' || user.role === 'admin') && (
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-2">
                  {user.role === 'admin' ? 'Organization' : 'Company'}
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyber-blue focus:border-cyber-blue transition-all duration-200"
                  />
                </div>
              </div>
            )}

            {user.role === 'hr' && (
              <div className="md:col-span-2">
                <label htmlFor="hrId" className="block text-sm font-medium text-gray-300 mb-2">
                  HR ID
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="hrId"
                    name="hrId"
                    type="text"
                    value={formData.hrId}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyber-blue focus:border-cyber-blue transition-all duration-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-3"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/10 border border-green-500/20 rounded-xl p-3"
            >
              <p className="text-green-400 text-sm">{success}</p>
            </motion.div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-xl hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-cyber-blue to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 btn-futuristic flex items-center justify-center space-x-2 glow-blue disabled:opacity-50"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ProfileModal;
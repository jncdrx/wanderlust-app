import { User, Mail, Lock, Bell, Moon, LogOut, ChevronRight, Settings, Download, Upload, RotateCcw, Shield, FileText, HelpCircle, MapPin, Camera, Plane, BarChart3, AlertTriangle } from 'lucide-react';
import { useState, useRef } from 'react';
import { EditProfileModal } from './EditProfileModal';
import { EmailSettingsModal } from './EmailSettingsModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { AppSettingsModal } from './AppSettingsModal';
import { DarkModeModal } from './DarkModeModal';
import { AboutModal } from './AboutModal';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import type { Trip, Destination, Photo } from '../types/travel';
import { motion } from 'motion/react';
import { useSession } from '../context/SessionContext';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'motion/react';

interface ProfileScreenProps {
  userType: 'user';
  userName: string;
  currentUser?: any;
  onLogout: () => void;
  onNavigate: (screen: string) => void;
  onUpdateUserName?: (name: string) => void;
  trips?: Trip[];
  destinations?: Destination[];
  photos?: Photo[];
  darkMode?: boolean;
  onToggleDarkMode?: (enabled: boolean) => void;
  onExportData?: () => void;
  onImportData?: (file: File) => void;
  onResetData?: () => void;
}

// Reset Data Confirmation Modal
function ResetDataConfirmModal({ isOpen, onClose, onConfirm, darkMode = false }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; darkMode?: boolean }) {
  const modalRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0"
            style={{
              background: darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 9999,
              pointerEvents: 'auto',
            }}
            onClick={onClose}
          />
          <div 
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 10000, pointerEvents: 'none' }}
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
              className={`w-full max-w-md rounded-2xl overflow-hidden flex flex-col ${
                darkMode
                  ? 'bg-[#0f172a] border border-white/30'
                  : 'bg-white border border-black/10'
              }`}
              style={{
                boxShadow: darkMode
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.15)'
                  : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                pointerEvents: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`px-5 py-4 border-b ${darkMode ? 'border-white/20' : 'border-black/10'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    darkMode ? 'bg-red-500/20' : 'bg-red-50'
                  }`}>
                    <AlertTriangle size={18} className="text-red-500" />
                  </div>
                  <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}>
                    Reset Demo Data
                  </h2>
                </div>
              </div>
              <div className={`px-5 py-5 ${darkMode ? 'text-white/80' : 'text-[#1a1a2e]/80'}`}>
                <p className="text-sm mb-4">
                  This will restore all Philippine destinations and trips. This action cannot be undone.
                </p>
                <p className={`text-xs ${darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'}`}>
                  Are you sure you want to continue?
                </p>
              </div>
              <div className={`px-5 py-4 border-t flex gap-3 ${darkMode ? 'border-white/20' : 'border-black/10'}`}>
                <motion.button
                  onClick={onClose}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    darkMode
                      ? 'bg-white/10 text-white hover:bg-white/15'
                      : 'bg-black/5 text-[#1a1a2e] hover:bg-black/10'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="flex-1 py-2.5 rounded-xl font-medium text-sm transition-all bg-red-500 text-white hover:bg-red-600"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Reset Data
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

export function ProfileScreen({ 
  userType, 
  userName, 
  currentUser,
  onLogout, 
  onNavigate,
  onUpdateUserName,
  trips = [],
  destinations = [],
  photos = [],
  darkMode = false,
  onToggleDarkMode,
  onExportData,
  onImportData,
  onResetData
}: ProfileScreenProps) {
  const { updateUser } = useSession();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profilePhotoError, setProfilePhotoError] = useState(false);
  const [emailSettingsOpen, setEmailSettingsOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [appSettingsOpen, setAppSettingsOpen] = useState(false);
  const [darkModeOpen, setDarkModeOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [resetDataConfirmOpen, setResetDataConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportData) {
      onImportData(file);
    }
  };

  const handleSaveProfile = (name: string, email: string) => {
    if (onUpdateUserName) {
      onUpdateUserName(name);
    }
  };

  const getDisplayName = () => {
    if (currentUser?.firstName && currentUser?.lastName) {
      return `${currentUser.firstName} ${currentUser.lastName}`;
    }
    return userName || 'Traveler';
  };

  const getInitials = () => {
    const name = getDisplayName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getEmail = () => {
    return currentUser?.email || 'traveler@wanderlust.com';
  };

  // Row component for consistent styling
  const SettingRow = ({ 
    icon: Icon, 
    label, 
    onClick, 
    description, 
    isDestructive = false,
    showToggle = false,
    toggleValue = false,
    onToggle
  }: { 
    icon: any; 
    label: string; 
    onClick?: () => void; 
    description?: string;
    isDestructive?: boolean;
    showToggle?: boolean;
    toggleValue?: boolean;
    onToggle?: (value: boolean) => void;
  }) => (
    <motion.button
      onClick={onClick}
      className={`w-full px-4 py-3.5 flex items-center justify-between transition-colors ${
        darkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      whileHover={onClick ? { scale: 1.01 } : {}}
      whileTap={onClick ? { scale: 0.99 } : {}}
      disabled={!onClick}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon 
          size={18} 
          className={
            isDestructive
              ? 'text-red-500'
              : darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'
          } 
        />
        <div className="flex-1 min-w-0 text-left">
          <p className={`text-sm font-medium ${
            isDestructive
              ? 'text-red-500'
              : darkMode ? 'text-white' : 'text-[#1a1a2e]'
          }`}>
            {label}
          </p>
          {description && (
            <p className={`text-xs mt-0.5 ${
              darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'
            }`}>
              {description}
            </p>
          )}
        </div>
      </div>
      {showToggle ? (
        <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
          toggleValue
            ? darkMode ? 'bg-[#50fa7b]' : 'bg-[#4ecdc4]'
            : darkMode ? 'bg-white/20' : 'bg-black/20'
        }`}>
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            toggleValue ? 'translate-x-5' : 'translate-x-0.5'
          }`} />
        </div>
      ) : onClick && (
        <ChevronRight size={18} className={`flex-shrink-0 ${
          darkMode ? 'text-white/30' : 'text-[#1a1a2e]/30'
        }`} />
      )}
    </motion.button>
  );

  return (
    <div className={`min-h-screen pb-32 sm:pb-24 relative overflow-hidden ${
      darkMode ? 'bg-[#0f0f1a]' : 'bg-[#faf8f5]'
    }`}>
      {/* Background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: darkMode
            ? 'linear-gradient(180deg, rgba(80, 250, 123, 0.08) 0%, rgba(139, 233, 253, 0.05) 50%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(149, 225, 211, 0.15) 0%, rgba(78, 205, 196, 0.08) 50%, transparent 100%)',
        }}
      />

      <div className="relative">
        {/* ===== HEADER ===== */}
        <div className="px-5 pt-12 pb-4">
          <h1 
            className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Profile
          </h1>
        </div>

        {/* ===== PROFILE HEADER CARD ===== */}
        <div className="px-5 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-6 border ${
              darkMode 
                ? 'bg-[#1a1a2e]/60 border-white/8' 
                : 'bg-white border-black/5 shadow-sm'
            }`}
          >
            {/* Avatar and Name */}
            <div className="flex items-center gap-4 mb-6">
              {/* Avatar */}
              {currentUser?.profilePhoto && !profilePhotoError ? (
                <div className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img 
                    src={currentUser.profilePhoto} 
                    alt={getDisplayName()}
                    className="w-full h-full object-cover"
                    onError={() => setProfilePhotoError(true)}
                  />
                </div>
              ) : (
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: darkMode 
                      ? 'linear-gradient(135deg, #50fa7b 0%, #8be9fd 100%)'
                      : 'linear-gradient(135deg, #4ecdc4 0%, #45b7d1 100%)',
                  }}
                >
                  <span className="text-white text-2xl font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {getInitials()}
                  </span>
                </div>
              )}

              {/* Name and Email */}
              <div className="flex-1 min-w-0">
                <h2 
                  className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {getDisplayName()}
                </h2>
                <div className="flex items-center gap-1.5">
                  <Mail size={12} className={darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'} />
                  <p className={`text-xs ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                    {getEmail()}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex gap-3">
              {[
                { label: 'Trips', value: trips.length, icon: Plane, color: darkMode ? '#bd93f9' : '#667eea' },
                { label: 'Places', value: destinations.length, icon: MapPin, color: darkMode ? '#8be9fd' : '#4ecdc4' },
                { label: 'Photos', value: photos.length, icon: Camera, color: darkMode ? '#ff79c6' : '#ff6b6b' },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.button
                    key={index}
                    onClick={() => {
                      if (stat.label === 'Trips') onNavigate('itinerary');
                      if (stat.label === 'Places') onNavigate('destinations');
                      if (stat.label === 'Photos') onNavigate('gallery');
                    }}
                    className={`flex-1 py-3 px-3 rounded-xl transition-colors ${
                      darkMode 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'bg-black/5 hover:bg-black/10'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Icon size={14} style={{ color: stat.color }} />
                      <span 
                        className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        {stat.value}
                      </span>
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                      {stat.label}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ===== ACCOUNT SECTION ===== */}
        <div className="px-5 mb-5">
          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 px-1 ${
            darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'
          }`}>
            Account
          </h3>
          <div className={`rounded-2xl border overflow-hidden ${
            darkMode ? 'bg-[#1a1a2e]/60 border-white/8' : 'bg-white border-black/5 shadow-sm'
          }`}>
            <SettingRow
              icon={User}
              label="Edit Profile"
              onClick={() => setEditProfileOpen(true)}
            />
            <div className={`h-px mx-4 ${darkMode ? 'bg-white/8' : 'bg-black/5'}`} />
            <SettingRow
              icon={Mail}
              label="Email Settings"
              onClick={() => setEmailSettingsOpen(true)}
            />
            <div className={`h-px mx-4 ${darkMode ? 'bg-white/8' : 'bg-black/5'}`} />
            <SettingRow
              icon={Lock}
              label="Change Password"
              onClick={() => setChangePasswordOpen(true)}
            />
          </div>
        </div>

        {/* ===== PREFERENCES SECTION ===== */}
        <div className="px-5 mb-5">
          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 px-1 ${
            darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'
          }`}>
            Preferences
          </h3>
          <div className={`rounded-2xl border overflow-hidden ${
            darkMode ? 'bg-[#1a1a2e]/60 border-white/8' : 'bg-white border-black/5 shadow-sm'
          }`}>
            <SettingRow
              icon={BarChart3}
              label="Reports & Insights"
              onClick={() => onNavigate('reports')}
            />
            <div className={`h-px mx-4 ${darkMode ? 'bg-white/8' : 'bg-black/5'}`} />
            <motion.button
              onClick={() => setDarkModeOpen(true)}
              className={`w-full px-4 py-3.5 flex items-center justify-between transition-colors ${
                darkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Moon 
                  size={18} 
                  className={darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'} 
                />
                <p className={`text-sm font-medium ${
                  darkMode ? 'text-white' : 'text-[#1a1a2e]'
                }`}>
                  Dark Mode
                </p>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                darkMode
                  ? 'bg-[#50fa7b]'
                  : 'bg-black/20'
              }`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  darkMode ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </div>
            </motion.button>
            <div className={`h-px mx-4 ${darkMode ? 'bg-white/8' : 'bg-black/5'}`} />
            <SettingRow
              icon={Settings}
              label="App Settings"
              onClick={() => setAppSettingsOpen(true)}
            />
          </div>
        </div>

        {/* ===== DATA MANAGEMENT SECTION ===== */}
        <div className="px-5 mb-5">
          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 px-1 ${
            darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'
          }`}>
            Data Management
          </h3>
          <div className="space-y-3">
            <motion.div
              className={`rounded-xl border p-4 transition-colors ${
                darkMode 
                  ? 'bg-[#1a1a2e]/60 border-white/8 hover:bg-[#1a1a2e]/80' 
                  : 'bg-white border-black/5 shadow-sm hover:bg-black/[0.02]'
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <SettingRow
                icon={Download}
                label="Export Data"
                description="Download backup file"
                onClick={onExportData}
              />
            </motion.div>
            <motion.div
              className={`rounded-xl border p-4 transition-colors ${
                darkMode 
                  ? 'bg-[#1a1a2e]/60 border-white/8 hover:bg-[#1a1a2e]/80' 
                  : 'bg-white border-black/5 shadow-sm hover:bg-black/[0.02]'
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <SettingRow
                icon={Upload}
                label="Import Data"
                description="Restore from backup"
                onClick={handleImportClick}
              />
            </motion.div>
            <motion.div
              className={`rounded-xl border p-4 transition-colors ${
                darkMode 
                  ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/15' 
                  : 'bg-red-50 border-red-200 hover:bg-red-100'
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <SettingRow
                icon={AlertTriangle}
                label="Reset Demo Data"
                description="Restore Philippine destinations & trips"
                onClick={() => setResetDataConfirmOpen(true)}
                isDestructive={true}
              />
            </motion.div>
          </div>
        </div>

        {/* ===== ABOUT SECTION ===== */}
        <div className="px-5 mb-5">
          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 px-1 ${
            darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'
          }`}>
            About
          </h3>
          <div className={`rounded-2xl border overflow-hidden ${
            darkMode ? 'bg-[#1a1a2e]/60 border-white/8' : 'bg-white border-black/5 shadow-sm'
          }`}>
            <SettingRow
              icon={Shield}
              label="About Wanderlust"
              onClick={() => setAboutOpen(true)}
            />
            <div className={`h-px mx-4 ${darkMode ? 'bg-white/8' : 'bg-black/5'}`} />
            <SettingRow
              icon={FileText}
              label="Privacy & Terms"
              onClick={() => setAboutOpen(true)}
            />
            <div className={`h-px mx-4 ${darkMode ? 'bg-white/8' : 'bg-black/5'}`} />
            <SettingRow
              icon={HelpCircle}
              label="Help & Support"
              onClick={() => setAboutOpen(true)}
            />
            <div className={`h-px mx-4 ${darkMode ? 'bg-white/8' : 'bg-black/5'}`} />
            <SettingRow
              icon={LogOut}
              label="Log Out"
              onClick={() => setLogoutConfirmOpen(true)}
              isDestructive={true}
            />
          </div>
        </div>

        {/* ===== VERSION ===== */}
        <div className="px-5 pb-6 text-center">
          <p className={`text-xs ${darkMode ? 'text-white/30' : 'text-[#1a1a2e]/30'}`}>
            Wanderlust v1.0.0
          </p>
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Modals */}
      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        userName={userName}
        currentUser={currentUser}
        onSave={handleSaveProfile}
        onProfileUpdated={(user) => {
          console.log('Profile updated:', user);
          setProfilePhotoError(false);
          updateUser({
            firstName: user.firstName,
            lastName: user.lastName,
            profilePhoto: user.profilePhoto,
          });
          if (onUpdateUserName && user.firstName) {
            const newName = user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
            onUpdateUserName(newName);
          }
        }}
        onOpenEmailSettings={() => {
          setEditProfileOpen(false);
          setEmailSettingsOpen(true);
        }}
        darkMode={darkMode}
      />
      <EmailSettingsModal
        isOpen={emailSettingsOpen}
        onClose={() => setEmailSettingsOpen(false)}
        currentUser={currentUser}
        darkMode={darkMode}
      />
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        currentUser={currentUser}
        darkMode={darkMode}
      />
      <AppSettingsModal
        isOpen={appSettingsOpen}
        onClose={() => setAppSettingsOpen(false)}
        darkMode={darkMode}
      />
      <DarkModeModal
        isOpen={darkModeOpen}
        onClose={() => setDarkModeOpen(false)}
        darkMode={darkMode}
        currentUser={currentUser}
        onToggle={(enabled) => {
          if (onToggleDarkMode) {
            onToggleDarkMode(enabled);
          }
        }}
      />
      <AboutModal
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
        darkMode={darkMode}
      />
      <LogoutConfirmModal
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={onLogout}
        darkMode={darkMode}
      />
      <ResetDataConfirmModal
        isOpen={resetDataConfirmOpen}
        onClose={() => setResetDataConfirmOpen(false)}
        onConfirm={() => {
          if (onResetData) {
            onResetData();
          }
        }}
        darkMode={darkMode}
      />
    </div>
  );
}

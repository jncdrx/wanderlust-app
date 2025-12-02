import { useState, useEffect, useRef } from 'react';
import { Plane, Eye, EyeOff, User, UserPlus, ArrowRight, AlertCircle, Shield, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiClient } from '../api/client';
import type { UserSession } from '../types/travel';

interface LoginScreenProps {
  onLogin: (payload: { user: UserSession; token: string }) => void;
  darkMode?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export function LoginScreen({ onLogin, darkMode = false }: LoginScreenProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const termsModalRef = useRef<HTMLDivElement>(null);
  const privacyModalRef = useRef<HTMLDivElement>(null);
  const termsTriggerRef = useRef<HTMLButtonElement>(null);
  const privacyTriggerRef = useRef<HTMLButtonElement>(null);
  const [particles] = useState<Particle[]>(
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 5,
    }))
  );

  // Password requirements checker - Updated to 12 characters minimum
  const getPasswordRequirements = () => {
    const hasMinLength = password.length >= 12;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>\[\]\\\/_+\-=~`]/.test(password);
    
    return {
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
      allMet: hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar
    };
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (isRegisterMode) {
      const requirements = getPasswordRequirements();
      if (!requirements.allMet) {
        errors.password = 'Password does not meet requirements';
      }
    } else if (password.length < 1) {
      errors.password = 'Password is required';
    }
    
    if (isRegisterMode) {
      if (!firstName.trim()) {
        errors.firstName = 'First name is required';
      }
      if (!lastName.trim()) {
        errors.lastName = 'Last name is required';
      }
      if (!confirmPassword.trim()) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Only require terms agreement for registration
    if (isRegisterMode && !agreedToTerms) {
      setConsentError(true);
      return;
    }
    setConsentError(false);
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
    
    try {
      if (isRegisterMode) {
        await apiClient.register({
          email,
          password,
          firstName,
          lastName
        });
        
        setShowSuccessModal(true);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFirstName('');
        setLastName('');
        // Auto-close after 3 seconds (matching toast behavior)
        setTimeout(() => {
          setShowSuccessModal(false);
          setTimeout(() => {
            setIsRegisterMode(false);
          }, 200);
        }, 3000);
      } else {
        const response = await apiClient.login({ email, password });
        onLogin({ user: response.user, token: response.accessToken });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showTermsModal) setShowTermsModal(false);
        if (showPrivacyModal) setShowPrivacyModal(false);
      }
    };

    if (showTermsModal || showPrivacyModal) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showTermsModal, showPrivacyModal]);

  // Focus trap for modals with focus return
  useEffect(() => {
    if (showTermsModal && termsModalRef.current) {
      const modal = termsModalRef.current;
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      firstElement?.focus();
      modal.addEventListener('keydown', handleTab);

      return () => {
        modal.removeEventListener('keydown', handleTab);
        // Return focus to trigger element
        termsTriggerRef.current?.focus();
      };
    }
  }, [showTermsModal]);

  useEffect(() => {
    if (showPrivacyModal && privacyModalRef.current) {
      const modal = privacyModalRef.current;
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      firstElement?.focus();
      modal.addEventListener('keydown', handleTab);

      return () => {
        modal.removeEventListener('keydown', handleTab);
        // Return focus to trigger element
        privacyTriggerRef.current?.focus();
      };
    }
  }, [showPrivacyModal]);

  const getInputStyles = (fieldName: string) => {
    const isFocused = focusedField === fieldName;
    const hasError = !!fieldErrors[fieldName];
    
    return `w-full px-4 py-3.5 rounded-xl text-sm transition-all duration-200 outline-none relative focus:outline-2 focus:outline-offset-2 ${
      hasError
        ? darkMode 
          ? 'bg-red-500/10 border-2 border-red-400 text-white focus:outline-red-400' 
          : 'bg-red-50 border-2 border-red-400 text-[#1a1a2e] focus:outline-red-400'
        : isFocused
          ? darkMode 
            ? 'bg-white/15 border-2 border-[#8be9fd] text-white focus:outline-[#8be9fd]' 
            : 'bg-white border-2 border-[#4ecdc4] text-[#1a1a2e] focus:outline-[#4ecdc4]'
          : darkMode 
            ? 'bg-white/5 border border-white/15 text-white hover:bg-white/10 focus:outline-[#8be9fd]' 
            : 'bg-white/60 border border-black/10 text-[#1a1a2e] hover:bg-white/80 focus:outline-[#4ecdc4]'
    } ${darkMode ? 'placeholder:text-white/50' : 'placeholder:text-[#1a1a2e]/50'}`;
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-5 relative ${
      darkMode ? 'bg-[#0f0f1a]' : 'bg-[#faf8f5]'
    }`}>
      {/* Background gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: darkMode
            ? 'linear-gradient(135deg, rgba(139, 233, 253, 0.08) 0%, rgba(189, 147, 249, 0.1) 50%, rgba(255, 121, 198, 0.08) 100%)'
            : 'linear-gradient(135deg, rgba(78, 205, 196, 0.15) 0%, rgba(255, 107, 107, 0.1) 50%, rgba(255, 230, 109, 0.08) 100%)',
        }}
      />

      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${darkMode ? 'bg-white/10' : 'bg-black/5'}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Decorative orbs */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: darkMode 
            ? 'radial-gradient(circle, rgba(139, 233, 253, 0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(78, 205, 196, 0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div 
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: darkMode 
            ? 'radial-gradient(circle, rgba(189, 147, 249, 0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(255, 107, 107, 0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="relative w-full max-w-md mx-auto" style={{ isolation: 'isolate' }}>
        {/* Logo & Header - Fixed position to stay on top */}
        <motion.div 
          className="text-center mb-12 relative"
          style={{ zIndex: 50, position: 'relative' }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo */}
          <motion.div 
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
              darkMode 
                ? 'bg-gradient-to-br from-[#8be9fd] to-[#bd93f9]' 
                : 'bg-gradient-to-br from-[#4ecdc4] to-[#667eea]'
            }`}
            style={{
              boxShadow: darkMode 
                ? '0 8px 32px rgba(139, 233, 253, 0.3)' 
                : '0 8px 32px rgba(78, 205, 196, 0.3)',
              position: 'relative',
              zIndex: 50,
            }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Plane size={28} className="text-white" />
          </motion.div>
          
          {/* Brand */}
          <motion.p 
            className={`text-xs font-semibold uppercase tracking-widest mb-5 ${
              darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Wanderlust
          </motion.p>
          
          {/* Heading */}
          <motion.h1 
            className={`text-4xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
            style={{ fontFamily: "'Outfit', sans-serif" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {isRegisterMode ? 'Create Account' : 'Welcome Back'}
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p 
            className={`text-base mb-10 ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {isRegisterMode ? 'Start your journey today' : 'Continue your journey'}
          </motion.p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          className={`rounded-3xl p-8 sm:p-10 relative max-w-full ${
            darkMode 
              ? 'bg-[#1a1a2e]/80 border border-white/10' 
              : 'bg-white/70 border border-black/5'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
            boxShadow: darkMode
              ? '0 20px 50px rgba(0, 0, 0, 0.4)'
              : '0 20px 50px rgba(0, 0, 0, 0.08)',
            zIndex: 10,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className={`flex items-start gap-3 p-4 rounded-xl ${
                    darkMode 
                      ? 'bg-red-500/15 border border-red-500/30' 
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Registration Fields */}
            <AnimatePresence>
              {isRegisterMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    {/* First Name */}
                    <div className="space-y-2.5">
                      <label 
                        htmlFor="firstName-input"
                        className={`text-sm font-semibold block ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                      >
                        First Name <span className="text-red-400" aria-label="required">*</span>
                      </label>
                      <input
                        id="firstName-input"
                        type="text"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (fieldErrors.firstName) setFieldErrors({ ...fieldErrors, firstName: '' });
                        }}
                        onFocus={() => setFocusedField('firstName')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="John"
                        className={getInputStyles('firstName')}
                        aria-required="true"
                        aria-invalid={!!fieldErrors.firstName}
                        aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined}
                      />
                      {fieldErrors.firstName && (
                        <p 
                          id="firstName-error"
                          className="text-red-400 text-xs flex items-center gap-1.5 mt-1.5"
                          role="alert"
                        >
                          <AlertCircle size={12} aria-hidden="true" />
                          {fieldErrors.firstName}
                        </p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2.5">
                      <label 
                        htmlFor="lastName-input"
                        className={`text-sm font-semibold block ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                      >
                        Last Name <span className="text-red-400" aria-label="required">*</span>
                      </label>
                      <input
                        id="lastName-input"
                        type="text"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          if (fieldErrors.lastName) setFieldErrors({ ...fieldErrors, lastName: '' });
                        }}
                        onFocus={() => setFocusedField('lastName')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Doe"
                        className={getInputStyles('lastName')}
                        aria-required="true"
                        aria-invalid={!!fieldErrors.lastName}
                        aria-describedby={fieldErrors.lastName ? 'lastName-error' : undefined}
                      />
                      {fieldErrors.lastName && (
                        <p 
                          id="lastName-error"
                          className="text-red-400 text-xs flex items-center gap-1.5 mt-1.5"
                          role="alert"
                        >
                          <AlertCircle size={12} aria-hidden="true" />
                          {fieldErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Required Fields Note */}
            <p className={`text-xs ${darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'}`}>
              All fields are required
            </p>

            {/* Credentials Section - Grouped */}
            <div className={`rounded-2xl p-6 space-y-6 ${
              darkMode 
                ? 'bg-white/5 border border-white/10' 
                : 'bg-white/40 border border-black/5'
            }`}>
            {/* Email */}
              <div className="space-y-2.5">
                <label 
                  htmlFor="email-input"
                  className={`text-sm font-semibold block ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                >
                  Email address <span className="text-red-400" aria-label="required">*</span>
              </label>
              <div className="relative">
                <input
                    id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                  }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                    placeholder="Enter your email address"
                    className={getInputStyles('email')}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
              </div>
              {fieldErrors.email && (
                  <p 
                    id="email-error"
                    className="text-red-400 text-xs flex items-center gap-1.5 mt-1.5"
                    role="alert"
                  >
                    <AlertCircle size={12} aria-hidden="true" />
                    {fieldErrors.email === 'Email is required' 
                      ? 'Please enter your email address' 
                      : 'Please enter a valid email address'}
                </p>
              )}
            </div>

            {/* Password */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label 
                    htmlFor="password-input"
                    className={`text-sm font-semibold block ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                  >
                    Password <span className="text-red-400" aria-label="required">*</span>
              </label>
                  {!isRegisterMode && (
                    <button
                      type="button"
                      className={`text-xs font-medium transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-[#4ecdc4] rounded px-1 py-0.5 ${
                        darkMode 
                          ? 'text-[#8be9fd] hover:text-[#8be9fd]/80 hover:underline focus:outline-[#8be9fd]' 
                          : 'text-[#4ecdc4] hover:text-[#4ecdc4]/80 hover:underline'
                      }`}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                <input
                    id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                    // Clear confirm password error if passwords now match
                    if (confirmPassword && e.target.value === confirmPassword && fieldErrors.confirmPassword) {
                      setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                    }
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your password"
                    className={`${getInputStyles('password')} pr-12`}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors focus:outline-2 focus:outline-offset-2 ${
                    darkMode 
                        ? 'text-white/50 hover:text-white hover:bg-white/10 focus:outline-[#8be9fd]' 
                        : 'text-[#1a1a2e]/50 hover:text-[#1a1a2e] hover:bg-black/5 focus:outline-[#4ecdc4]'
                  }`}
                >
                    {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
              {fieldErrors.password && (
                  <p 
                    id="password-error"
                    className="text-red-400 text-xs flex items-center gap-1.5 mt-1.5"
                    role="alert"
                  >
                    <AlertCircle size={12} aria-hidden="true" />
                    {fieldErrors.password === 'Password is required' 
                      ? 'Please enter your password' 
                      : fieldErrors.password}
                </p>
              )}

              {/* Password Requirements - Only for registration and when password field is focused */}
              <AnimatePresence>
                {isRegisterMode && password && focusedField === 'password' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`rounded-lg p-2.5 space-y-1.5 ${
                      darkMode ? 'bg-white/5 border border-white/10' : 'bg-black/[0.02] border border-black/5'
                    }`}
                  >
                    <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${
                      darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'
                    }`}>
                      Password Requirements
                    </div>
                    {(() => {
                      const req = getPasswordRequirements();
                      return (
                        <div className="space-y-1">
                          <div className={`flex items-center gap-1.5 text-[10px] ${
                            req.hasMinLength 
                              ? darkMode ? 'text-green-400' : 'text-green-600'
                              : darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'
                          }`}>
                            {req.hasMinLength ? (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            <span>At least 12 characters</span>
                          </div>
                          <div className={`flex items-center gap-1.5 text-[10px] ${
                            req.hasUpperCase 
                              ? darkMode ? 'text-green-400' : 'text-green-600'
                              : darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'
                          }`}>
                            {req.hasUpperCase ? (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            <span>One uppercase letter</span>
                          </div>
                          <div className={`flex items-center gap-1.5 text-[10px] ${
                            req.hasLowerCase 
                              ? darkMode ? 'text-green-400' : 'text-green-600'
                              : darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'
                          }`}>
                            {req.hasLowerCase ? (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            <span>One lowercase letter</span>
                          </div>
                          <div className={`flex items-center gap-1.5 text-[10px] ${
                            req.hasNumber 
                              ? darkMode ? 'text-green-400' : 'text-green-600'
                              : darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'
                          }`}>
                            {req.hasNumber ? (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            <span>One number</span>
                          </div>
                          <div className={`flex items-center gap-1.5 text-[10px] ${
                            req.hasSpecialChar 
                              ? darkMode ? 'text-green-400' : 'text-green-600'
                              : darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'
                          }`}>
                            {req.hasSpecialChar ? (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            <span>One special character</span>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
              </div>

              {/* Confirm Password - Only for registration */}
              <AnimatePresence>
                {isRegisterMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2.5"
                  >
                    <label 
                      htmlFor="confirm-password-input"
                      className={`text-sm font-semibold block ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                    >
                      Confirm Password <span className="text-red-400" aria-label="required">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password-input"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                        }}
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Confirm your password"
                        className={`${getInputStyles('confirmPassword')} pr-12`}
                        aria-required="true"
                        aria-invalid={!!fieldErrors.confirmPassword}
                        aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors focus:outline-2 focus:outline-offset-2 ${
                          darkMode 
                            ? 'text-white/50 hover:text-white hover:bg-white/10 focus:outline-[#8be9fd]' 
                            : 'text-[#1a1a2e]/50 hover:text-[#1a1a2e] hover:bg-black/5 focus:outline-[#4ecdc4]'
                        }`}
                      >
                        {showConfirmPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p 
                        id="confirm-password-error"
                        className="text-red-400 text-xs flex items-center gap-1.5 mt-1.5"
                        role="alert"
                      >
                        <AlertCircle size={12} aria-hidden="true" />
                        {fieldErrors.confirmPassword}
                      </p>
                    )}

                    {/* Password Match Indicator */}
                    {confirmPassword && !fieldErrors.confirmPassword && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-1.5 text-[10px] ${
                          password === confirmPassword
                            ? darkMode ? 'text-green-400' : 'text-green-600'
                            : darkMode ? 'text-orange-400' : 'text-orange-500'
                        }`}
                      >
                        {password === confirmPassword ? (
                          <>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Passwords match</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>Passwords do not match</span>
                          </>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Area: Consent + Button */}
            <div className="space-y-4">
              {/* Consent Row - Only shown for registration */}
              <AnimatePresence>
                {isRegisterMode && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <label 
                      htmlFor="terms-checkbox"
                      className="flex items-center gap-2.5 cursor-pointer select-none group"
                    >
                      {/* Compact Checkbox */}
                      <div className="relative flex-shrink-0">
                        <input
                          type="checkbox"
                          id="terms-checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => {
                            setAgreedToTerms(e.target.checked);
                            if (e.target.checked) {
                              setConsentError(false);
                            }
                          }}
                          className={`
                            appearance-none w-[18px] h-[18px] rounded border-[1.5px] cursor-pointer
                            transition-all duration-150
                            focus:outline-none focus:ring-2 focus:ring-offset-1
                            ${agreedToTerms
                              ? darkMode
                                ? 'bg-[#8be9fd] border-[#8be9fd] focus:ring-[#8be9fd]'
                                : 'bg-[#4ecdc4] border-[#4ecdc4] focus:ring-[#4ecdc4]'
                              : consentError
                                ? 'bg-transparent border-red-400 focus:ring-red-400'
                                : darkMode
                                  ? 'bg-transparent border-white/40 group-hover:border-white/60 focus:ring-[#8be9fd]'
                                  : 'bg-transparent border-black/30 group-hover:border-black/50 focus:ring-[#4ecdc4]'
                            }
                          `}
                          aria-required="true"
                          aria-invalid={consentError}
                          aria-describedby={consentError ? 'consent-error' : undefined}
                        />
                        {/* Checkmark */}
                        <svg
                          className={`absolute top-[3px] left-[3px] w-3 h-3 pointer-events-none transition-all duration-150 ${
                            agreedToTerms ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                          }`}
                          viewBox="0 0 12 12"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M2.5 6.5L5 9L9.5 3.5"
                            stroke={darkMode ? '#0f0f1a' : 'white'}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>

                      {/* Consent text */}
                      <span className={`text-[13px] ${
                        consentError
                          ? darkMode ? 'text-red-300' : 'text-red-600'
                          : darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'
                      }`}>
                        I agree to the{' '}
                        <button
                          ref={termsTriggerRef}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowTermsModal(true);
                          }}
                          className={`font-semibold underline underline-offset-2 transition-colors ${
                            darkMode 
                              ? 'text-[#8be9fd] hover:text-[#a8f0ff]' 
                              : 'text-[#4ecdc4] hover:text-[#3db9b0]'
                          } focus:outline-none focus:ring-1 focus:ring-offset-1 rounded-sm ${
                            darkMode ? 'focus:ring-[#8be9fd]' : 'focus:ring-[#4ecdc4]'
                          }`}
                          aria-haspopup="dialog"
                        >
                          Terms
                        </button>
                        {' & '}
                        <button
                          ref={privacyTriggerRef}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowPrivacyModal(true);
                          }}
                          className={`font-semibold underline underline-offset-2 transition-colors ${
                            darkMode 
                              ? 'text-[#8be9fd] hover:text-[#a8f0ff]' 
                              : 'text-[#4ecdc4] hover:text-[#3db9b0]'
                          } focus:outline-none focus:ring-1 focus:ring-offset-1 rounded-sm ${
                            darkMode ? 'focus:ring-[#8be9fd]' : 'focus:ring-[#4ecdc4]'
                          }`}
                          aria-haspopup="dialog"
                        >
                          Privacy
                        </button>
                      </span>
                    </label>

                    {/* Error - only on submit attempt */}
                    <AnimatePresence>
                      {consentError && (
                        <motion.span
                          id="consent-error"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`text-xs flex items-center gap-1 ${
                            darkMode ? 'text-red-300' : 'text-red-500'
                          }`}
                          role="alert"
                        >
                          <AlertCircle size={11} aria-hidden="true" />
                          Required to continue
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Primary Action Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
                className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isLoading
                    ? 'opacity-60 cursor-wait'
                    : (isRegisterMode && !agreedToTerms)
                      ? 'opacity-60 cursor-pointer'
                      : darkMode
                        ? 'hover:shadow-lg hover:shadow-[#8be9fd]/40 active:scale-[0.98] cursor-pointer'
                        : 'hover:shadow-lg hover:shadow-[#4ecdc4]/40 active:scale-[0.98] cursor-pointer'
              } ${
                darkMode 
                    ? 'bg-gradient-to-r from-[#8be9fd] to-[#bd93f9] text-[#0f0f1a] focus:ring-[#8be9fd]' 
                    : 'bg-gradient-to-r from-[#4ecdc4] to-[#667eea] text-white focus:ring-[#4ecdc4]'
              }`}
              style={{
                  boxShadow: (!isRegisterMode || agreedToTerms) && !isLoading
                    ? darkMode 
                      ? '0 4px 20px rgba(139, 233, 253, 0.4)' 
                      : '0 4px 20px rgba(78, 205, 196, 0.4)'
                    : 'none',
                }}
                whileHover={!isLoading && (!isRegisterMode || agreedToTerms) ? { scale: 1.01, y: -1 } : {}}
                whileTap={!isLoading && (!isRegisterMode || agreedToTerms) ? { scale: 0.98 } : {}}
                aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      aria-hidden="true"
                  />
                    <span>{isRegisterMode ? 'Creating account...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  {isRegisterMode ? (
                    <>
                        <UserPlus size={18} aria-hidden="true" />
                      Create Account
                    </>
                  ) : (
                    <>
                      Continue
                        <ArrowRight size={18} aria-hidden="true" />
                    </>
                  )}
                </>
              )}
            </motion.button>

              {/* Security indicator */}
              <div className={`flex items-center justify-center gap-1.5 ${darkMode ? 'text-white/30' : 'text-[#1a1a2e]/30'}`}>
                <Shield size={11} aria-hidden="true" />
                <span className="text-[10px] tracking-wide uppercase">Secure connection</span>
              </div>
            </div>

            {/* Divider */}
            <div className="relative py-4">
              <div className={`absolute inset-0 flex items-center ${
                darkMode ? 'border-white/10' : 'border-black/10'
              }`}>
                <div className={`w-full border-t ${
                  darkMode ? 'border-white/10' : 'border-black/10'
                }`}></div>
              </div>
              <div className="relative flex justify-center">
                <span className={`px-4 text-xs ${
                  darkMode ? 'text-white/40 bg-[#1a1a2e]/80' : 'text-[#1a1a2e]/40 bg-white/70'
                }`}>
                  or
                </span>
              </div>
            </div>

            {/* Toggle Login/Register */}
            <div className="text-center pt-2">
              <p className={`text-sm mb-4 ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setError('');
                  setFieldErrors({});
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                  setFirstName('');
                  setLastName('');
                  setAgreedToTerms(false);
                }}
                className={`text-sm font-bold transition-all focus:outline-2 focus:outline-offset-2 rounded px-2 py-1 ${
                  darkMode 
                    ? 'text-[#8be9fd] hover:text-[#8be9fd]/80 hover:underline focus:outline-[#8be9fd]' 
                    : 'text-[#4ecdc4] hover:text-[#4ecdc4]/80 hover:underline focus:outline-[#4ecdc4]'
                }`}
              >
                {isRegisterMode ? 'Sign in' : 'Sign up'}
              </button>
            </div>

            {/* Terms & Privacy Footer - Only on Create Account */}
            <AnimatePresence>
              {isRegisterMode && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`pt-4 mt-2 border-t ${darkMode ? 'border-white/10' : 'border-black/5'}`}
                >
                  <p className={`text-[11px] text-center ${darkMode ? 'text-white/40' : 'text-[#1a1a2e]/40'}`}>
                    By creating an account, you agree to our
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        darkMode 
                          ? 'bg-[#8be9fd]/10 text-[#8be9fd] hover:bg-[#8be9fd]/20 border border-[#8be9fd]/20 hover:border-[#8be9fd]/40' 
                          : 'bg-[#4ecdc4]/10 text-[#4ecdc4] hover:bg-[#4ecdc4]/20 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/40'
                      } focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                        darkMode ? 'focus:ring-[#8be9fd]' : 'focus:ring-[#4ecdc4]'
                      }`}
                      aria-haspopup="dialog"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Terms
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        darkMode 
                          ? 'bg-[#bd93f9]/10 text-[#bd93f9] hover:bg-[#bd93f9]/20 border border-[#bd93f9]/20 hover:border-[#bd93f9]/40' 
                          : 'bg-[#667eea]/10 text-[#667eea] hover:bg-[#667eea]/20 border border-[#667eea]/20 hover:border-[#667eea]/40'
                      } focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                        darkMode ? 'focus:ring-[#bd93f9]' : 'focus:ring-[#667eea]'
                      }`}
                      aria-haspopup="dialog"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Privacy
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>

      </div>

      {/* Terms of Service Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            ref={termsModalRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-title"
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowTermsModal(false)}
            />
            
            {/* Modal Container - Centered */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className={`w-full max-w-sm rounded-xl shadow-2xl overflow-hidden flex flex-col ${
                  darkMode 
                    ? 'bg-[#1a1a2e] border border-white/10' 
                    : 'bg-white border border-black/5'
                }`}
                style={{ maxHeight: 'min(420px, 70vh)' }}
              >
                {/* Compact Header */}
                <div className={`flex-shrink-0 flex items-center justify-between px-4 py-3 border-b ${
                  darkMode ? 'border-white/10' : 'border-black/10'
                }`}>
                  <h2 
                    id="terms-title"
                    className={`text-base font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                  >
                    Terms of Service
                  </h2>
                  <button
                    onClick={() => setShowTermsModal(false)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      darkMode 
                        ? 'text-white/60 hover:text-white hover:bg-white/10' 
                        : 'text-[#1a1a2e]/60 hover:text-[#1a1a2e] hover:bg-black/5'
                    }`}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div 
                  className="flex-1 overflow-y-auto px-4 py-3 overscroll-contain"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <div className="space-y-2.5">
                    {/* Intro */}
                    <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-white/60' : 'text-[#1a1a2e]/60'}`}>
                      By using Wanderlust, you agree to these terms. Continued use after updates means acceptance.
                    </p>

                    {/* Allowed / Not Allowed Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Allowed */}
                      <div className={`rounded-lg p-2.5 ${darkMode ? 'bg-green-500/10' : 'bg-green-50'}`}>
                        <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                          Allowed
                        </div>
                        <ul className={`text-[10px] space-y-1 ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                          <li className="flex items-start gap-1.5">
                            <span className="text-green-500 mt-px">•</span>
                            <span>Personal use</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-green-500 mt-px">•</span>
                            <span>Travel planning</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-green-500 mt-px">•</span>
                            <span>Content sharing</span>
                          </li>
                        </ul>
                      </div>

                      {/* Not Allowed */}
                      <div className={`rounded-lg p-2.5 ${darkMode ? 'bg-red-500/10' : 'bg-red-50'}`}>
                        <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
                          Not Allowed
                        </div>
                        <ul className={`text-[10px] space-y-1 ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                          <li className="flex items-start gap-1.5">
                            <span className="text-red-400 mt-px">•</span>
                            <span>Redistribution</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-red-400 mt-px">•</span>
                            <span>Commercial use</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-red-400 mt-px">•</span>
                            <span>Bots/Scraping</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Account & Content */}
                    <div className={`rounded-lg p-2.5 ${darkMode ? 'bg-white/5' : 'bg-black/[0.02]'}`}>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                            Your Account
                          </div>
                          <ul className={`text-[10px] space-y-0.5 ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                            <li>• Keep credentials secure</li>
                            <li>• Accurate info only</li>
                            <li>• You own activity</li>
                          </ul>
                        </div>
                        <div>
                          <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                            Your Content
                          </div>
                          <ul className={`text-[10px] space-y-0.5 ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                            <li>• You retain ownership</li>
                            <li>• License to display</li>
                            <li>• Respect copyrights</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Footer note */}
                    <p className={`text-[9px] text-center ${darkMode ? 'text-white/30' : 'text-[#1a1a2e]/30'}`}>
                      Max liability $100 • Delete anytime • Local laws apply
                    </p>
                  </div>
                </div>

                {/* Compact Footer */}
                <div className={`flex-shrink-0 px-4 py-3 border-t ${
                  darkMode ? 'border-white/10' : 'border-black/10'
                }`}>
                  <button
                    onClick={() => setShowTermsModal(false)}
                    className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${
                      darkMode 
                        ? 'bg-gradient-to-r from-[#8be9fd] to-[#bd93f9] text-[#0f0f1a]' 
                        : 'bg-gradient-to-r from-[#4ecdc4] to-[#667eea] text-white'
                    }`}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <motion.div
            ref={privacyModalRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-title"
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowPrivacyModal(false)}
            />
            
            {/* Modal Container - Centered */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className={`w-full max-w-sm rounded-xl shadow-2xl overflow-hidden flex flex-col ${
                  darkMode 
                    ? 'bg-[#1a1a2e] border border-white/10' 
                    : 'bg-white border border-black/5'
                }`}
                style={{ maxHeight: 'min(420px, 70vh)' }}
              >
                {/* Compact Header */}
                <div className={`flex-shrink-0 flex items-center justify-between px-4 py-3 border-b ${
                  darkMode ? 'border-white/10' : 'border-black/10'
                }`}>
                  <h2 
                    id="privacy-title"
                    className={`text-base font-bold ${darkMode ? 'text-white' : 'text-[#1a1a2e]'}`}
                  >
                    Privacy Policy
                  </h2>
                  <button
                    onClick={() => setShowPrivacyModal(false)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      darkMode 
                        ? 'text-white/60 hover:text-white hover:bg-white/10' 
                        : 'text-[#1a1a2e]/60 hover:text-[#1a1a2e] hover:bg-black/5'
                    }`}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div 
                  className="flex-1 overflow-y-auto px-4 py-3 overscroll-contain"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <div className="space-y-2.5">
                    {/* Data Collection & Usage */}
                    <div className={`rounded-lg p-2.5 ${darkMode ? 'bg-white/5' : 'bg-black/[0.02]'}`}>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                            We Collect
                          </div>
                          <ul className={`text-[10px] space-y-0.5 ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                            <li>• Name & email</li>
                            <li>• Travel data</li>
                            <li>• Device info</li>
                          </ul>
                        </div>
                        <div>
                          <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${darkMode ? 'text-white/50' : 'text-[#1a1a2e]/50'}`}>
                            We Use For
                          </div>
                          <ul className={`text-[10px] space-y-0.5 ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                            <li>• Our services</li>
                            <li>• Updates</li>
                            <li>• Security</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Promise Card */}
                    <div className={`rounded-lg p-2.5 ${darkMode ? 'bg-green-500/10' : 'bg-green-50'}`}>
                      <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                        Our Promise
                      </div>
                      <div className={`grid grid-cols-3 gap-2 text-[10px] ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                        <div className="flex items-center gap-1">
                          <span className="text-green-500">✓</span>
                          <span>No data sales</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-green-500">✓</span>
                          <span>No spam</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-green-500">✓</span>
                          <span>Encrypted</span>
                        </div>
                      </div>
                    </div>

                    {/* Your Rights */}
                    <div className={`rounded-lg p-2.5 ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                      <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        Your Rights
                      </div>
                      <div className={`flex flex-wrap gap-1.5 text-[10px] ${darkMode ? 'text-white/70' : 'text-[#1a1a2e]/70'}`}>
                        <span className={`px-2 py-0.5 rounded-full ${darkMode ? 'bg-white/10' : 'bg-white'}`}>Access</span>
                        <span className={`px-2 py-0.5 rounded-full ${darkMode ? 'bg-white/10' : 'bg-white'}`}>Correct</span>
                        <span className={`px-2 py-0.5 rounded-full ${darkMode ? 'bg-white/10' : 'bg-white'}`}>Delete</span>
                        <span className={`px-2 py-0.5 rounded-full ${darkMode ? 'bg-white/10' : 'bg-white'}`}>Export</span>
                        <span className={`px-2 py-0.5 rounded-full ${darkMode ? 'bg-white/10' : 'bg-white'}`}>Opt-out</span>
                      </div>
                    </div>

                    {/* Footer note */}
                    <p className={`text-[9px] text-center ${darkMode ? 'text-white/30' : 'text-[#1a1a2e]/30'}`}>
                      Data deleted within 30 days • Users must be 13+ • SSL protected
                    </p>
                  </div>
                </div>

                {/* Compact Footer */}
                <div className={`flex-shrink-0 px-4 py-3 border-t ${
                  darkMode ? 'border-white/10' : 'border-black/10'
                }`}>
                  <button
                    onClick={() => setShowPrivacyModal(false)}
                    className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${
                      darkMode 
                        ? 'bg-gradient-to-r from-[#8be9fd] to-[#bd93f9] text-[#0f0f1a]' 
                        : 'bg-gradient-to-r from-[#4ecdc4] to-[#667eea] text-white'
                    }`}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Alert Modal - Toast Style */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
            style={{ zIndex: 2147483647 }}
          >
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 pointer-events-auto"
              onClick={() => setShowSuccessModal(false)}
            />
            
            {/* Toast Alert */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className={`
                relative pointer-events-auto
                flex items-center gap-3
                px-5 py-4 rounded-2xl
                min-w-[280px] max-w-[90vw]
                ${darkMode 
                  ? 'bg-slate-800/95 border border-white/10' 
                  : 'bg-white/95 border border-black/5'
                }
              `}
              style={{
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: darkMode 
                  ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
                  : '0 8px 32px rgba(0, 0, 0, 0.15)',
              }}
            >
              {/* Success Icon */}
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              
              {/* Content */}
              <div className="flex-1">
                <p className={`font-medium text-[15px] ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Account Created!
                </p>
                <p className={`text-sm mt-0.5 ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
                  Redirecting you to sign in...
                </p>
              </div>
              
              {/* Close button */}
              <button
                onClick={() => setShowSuccessModal(false)}
                className={`
                  flex-shrink-0 p-1 rounded-lg transition-colors
                  ${darkMode 
                    ? 'text-white/40 hover:text-white hover:bg-white/10' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }
                `}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

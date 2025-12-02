const rateLimit = require('express-rate-limit');

// In-memory store for tracking failed login attempts per email address
const failedAttemptsStore = new Map();

// General IP-based rate limiter for login endpoint
// Completely disabled in development by default, enabled in production
const isDevelopment = process.env.NODE_ENV !== 'production';
const shouldDisableRateLimit = isDevelopment && process.env.ENABLE_RATE_LIMIT !== 'true';

// Create a no-op middleware that does nothing (bypasses rate limiting)
const noOpRateLimiter = (req, res, next) => {
  next();
};

// Only create actual rate limiter if not in development or if explicitly enabled
const loginRateLimiter = shouldDisableRateLimit 
  ? noOpRateLimiter
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isDevelopment ? 10000 : 20, // Very lenient in dev (10000 attempts), stricter in prod (20 attempts)
      message: {
        error: 'Too many login attempts from this IP. Please try again after 15 minutes.',
        retryAfter: 15 * 60, // seconds
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true,
      // Use memory store explicitly (default, but make it clear)
      store: new rateLimit.MemoryStore(),
      // Custom handler to provide better error messages
      handler: (req, res, next, options) => {
        const message = isDevelopment 
          ? `Rate limit reached (${options.max} requests per ${options.windowMs / 1000 / 60} minutes). Set ENABLE_RATE_LIMIT=true to enable in development, or wait ${Math.ceil(options.windowMs / 1000 / 60)} minutes.`
          : 'Too many login attempts from this IP. Please try again after 15 minutes.';
        
        res.status(429).json({
          error: message,
          retryAfter: Math.ceil(options.windowMs / 1000),
          maxRequests: options.max,
          windowMinutes: options.windowMs / 1000 / 60,
        });
      },
    });

if (shouldDisableRateLimit) {
  console.log('⚠️  Rate limiting DISABLED in development mode (set ENABLE_RATE_LIMIT=true to enable)');
} else if (isDevelopment) {
  console.log('ℹ️  Rate limiting enabled in development (10000 attempts per 15 min)');
}

// Clear all rate limit stores (for development)
const clearAllRateLimits = () => {
  failedAttemptsStore.clear();
  // Try to clear express-rate-limit stores
  if (rateLimitStore) {
    if (typeof rateLimitStore.resetAll === 'function') {
      rateLimitStore.resetAll();
    } else if (typeof rateLimitStore.resetKey === 'function') {
      // If resetKey exists, we'd need to track keys, but for now just clear the store
      try {
        // Try to access internal store and clear it
        if (rateLimitStore.store && typeof rateLimitStore.store.resetAll === 'function') {
          rateLimitStore.store.resetAll();
        }
      } catch (e) {
        // Ignore errors
      }
    }
  }
  console.log('✅ All rate limits cleared');
};

// Track failed login attempts by email address with exponential backoff
const trackFailedAttempt = (email) => {
  if (!email) return { count: 0, firstAttempt: Date.now() };
  
  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();
  const attempts = failedAttemptsStore.get(normalizedEmail) || { count: 0, firstAttempt: now };
  
  attempts.count += 1;
  attempts.lastAttempt = now;
  
  // Reset counter after 15 minutes
  if (now - attempts.firstAttempt > 15 * 60 * 1000) {
    attempts.count = 1;
    attempts.firstAttempt = now;
  }
  
  failedAttemptsStore.set(normalizedEmail, attempts);
  
  // Clean up old entries (older than 1 hour)
  for (const [key, value] of failedAttemptsStore.entries()) {
    if (now - value.firstAttempt > 60 * 60 * 1000) {
      failedAttemptsStore.delete(key);
    }
  }
  
  return attempts;
};

// Check if email address is locked
const isLocked = (email) => {
  if (!email) return false;
  
  const normalizedEmail = email.toLowerCase().trim();
  const attempts = failedAttemptsStore.get(normalizedEmail);
  if (!attempts || attempts.count < 5) return false;
  
  const now = Date.now();
  const timeSinceFirstAttempt = now - attempts.firstAttempt;
  const lockDuration = Math.min(
    Math.pow(2, attempts.count - 5) * 60 * 1000, // Exponential backoff
    60 * 60 * 1000 // Max 1 hour
  );
  
  return timeSinceFirstAttempt < lockDuration;
};

// Get lock information for an email
const getLockInfo = (email) => {
  if (!email) return null;
  
  const normalizedEmail = email.toLowerCase().trim();
  const attempts = failedAttemptsStore.get(normalizedEmail);
  if (!attempts || attempts.count < 5) return null;
  
  const now = Date.now();
  const timeSinceFirstAttempt = now - attempts.firstAttempt;
  const lockDuration = Math.min(
    Math.pow(2, attempts.count - 5) * 60 * 1000,
    60 * 60 * 1000
  );
  const remainingLockTime = lockDuration - timeSinceFirstAttempt;
  
  if (remainingLockTime <= 0) return null;
  
  return {
    locked: true,
    retryAfter: Math.ceil(remainingLockTime / 1000),
    lockedUntil: new Date(now + remainingLockTime).toISOString(),
    attempts: attempts.count,
  };
};

// Reset failed attempts on successful login
const resetFailedAttempts = (email) => {
  if (!email) return;
  const normalizedEmail = email.toLowerCase().trim();
  failedAttemptsStore.delete(normalizedEmail);
};

// General API rate limiter - 100 requests per 15 minutes
// Disabled in development by default, enabled in production
const apiRateLimiter = shouldDisableRateLimit
  ? noOpRateLimiter
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: isDevelopment ? 10000 : 100, // Very lenient in dev (10000 requests), normal in prod (100 requests)
      message: {
        error: 'Too many requests. Please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

// Export rate limiter store for development reset endpoint
let rateLimitStore = null;

// Helper to get the rate limiter store for reset
const getRateLimitStore = () => {
  return rateLimitStore;
};

// Set the store (will be called from server/index.js after creating limiter)
const setRateLimitStore = (store) => {
  rateLimitStore = store;
};

module.exports = {
  loginRateLimiter,
  apiRateLimiter,
  trackFailedAttempt,
  isLocked,
  getLockInfo,
  resetFailedAttempts,
  getRateLimitStore,
  setRateLimitStore,
  clearAllRateLimits,
};


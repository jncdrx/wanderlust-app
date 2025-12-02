const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');
const SECURITY_LOG_FILE = path.join(LOG_DIR, 'security.log');
const AUTH_LOG_FILE = path.join(LOG_DIR, 'auth.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Get client IP address
const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
};

// Get user agent
const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'unknown';
};

// Format log entry
const formatLogEntry = (level, event, data) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...data,
  }) + '\n';
};

// Log security event
const logSecurityEvent = (event, data) => {
  const logEntry = formatLogEntry('SECURITY', event, data);
  fs.appendFileSync(SECURITY_LOG_FILE, logEntry);
};

// Log authentication event
const logAuthEvent = (event, data) => {
  const logEntry = formatLogEntry('AUTH', event, data);
  fs.appendFileSync(AUTH_LOG_FILE, logEntry);
};

// Log failed login attempt
const logFailedLogin = (req, email, reason) => {
  const ip = getClientIP(req);
  const userAgent = getUserAgent(req);
  
  logSecurityEvent('FAILED_LOGIN', {
    email: email ? email.toLowerCase() : 'unknown',
    ip,
    userAgent,
    reason,
  });
  
  logAuthEvent('LOGIN_FAILED', {
    email: email ? email.toLowerCase() : 'unknown',
    ip,
    userAgent,
    reason,
  });
};

// Log successful login
const logSuccessfulLogin = (req, email, userId) => {
  const ip = getClientIP(req);
  const userAgent = getUserAgent(req);
  
  logAuthEvent('LOGIN_SUCCESS', {
    email: email ? email.toLowerCase() : 'unknown',
    userId,
    ip,
    userAgent,
  });
};

// Log registration
const logRegistration = (req, email, userId) => {
  const ip = getClientIP(req);
  const userAgent = getUserAgent(req);
  
  logAuthEvent('REGISTRATION', {
    email: email ? email.toLowerCase() : 'unknown',
    userId,
    ip,
    userAgent,
  });
};

// Log token refresh
const logTokenRefresh = (req, userId, success) => {
  const ip = getClientIP(req);
  const userAgent = getUserAgent(req);
  
  logAuthEvent('TOKEN_REFRESH', {
    userId,
    ip,
    userAgent,
    success,
  });
};

// Log suspicious activity
const logSuspiciousActivity = (req, activity, details) => {
  const ip = getClientIP(req);
  const userAgent = getUserAgent(req);
  
  logSecurityEvent('SUSPICIOUS_ACTIVITY', {
    activity,
    ip,
    userAgent,
    details,
  });
};

// Middleware to log all requests
const requestLogger = (req, res, next) => {
  const ip = getClientIP(req);
  const userAgent = getUserAgent(req);
  
  // Log only important requests
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/users')) {
    logAuthEvent('REQUEST', {
      method: req.method,
      path: req.path,
      ip,
      userAgent,
    });
  }
  
  next();
};

module.exports = {
  logFailedLogin,
  logSuccessfulLogin,
  logRegistration,
  logTokenRefresh,
  logSuspiciousActivity,
  logAuthEvent,
  requestLogger,
  getClientIP,
  getUserAgent,
};


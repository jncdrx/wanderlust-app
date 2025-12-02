const { body, validationResult } = require('express-validator');

// Sanitize input to prevent XSS and injection attacks
const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  
  // Remove potential script tags and dangerous characters
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
};

// Email validation regex (RFC 5322 compliant)
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Password strength validation
const validatePasswordStrength = (password) => {
  if (typeof password !== 'string') return false;
  
  const minLength = password.length >= 12;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>\[\]\\\/_+\-=~`]/.test(password);
  
  return minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
};

// Login validation rules
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .customSanitizer((value) => sanitizeInput(value)),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password is required')
    .customSanitizer((value) => sanitizeInput(value)),
];

// Registration validation rules
const registerValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .custom((value) => {
      if (!emailRegex.test(value)) {
        throw new Error('Invalid email format');
      }
      return true;
    })
    .customSanitizer((value) => sanitizeInput(value)),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters long')
    .custom((value) => {
      if (!validatePasswordStrength(value)) {
        throw new Error(
          'Password must contain at least 12 characters, including uppercase, lowercase, number, and special character'
        );
      }
      return true;
    })
    .customSanitizer((value) => sanitizeInput(value)),
  
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes')
    .customSanitizer((value) => sanitizeInput(value)),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes')
    .customSanitizer((value) => sanitizeInput(value)),
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// Sanitize request body
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    }
  }
  next();
};

module.exports = {
  loginValidation,
  registerValidation,
  handleValidationErrors,
  sanitizeBody,
  sanitizeInput,
  validatePasswordStrength,
  emailRegex,
};


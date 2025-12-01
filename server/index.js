// Load environment variables
require('dotenv').config();

// Log environment loading status on startup
console.log('📋 [Environment] Loading .env file...');
console.log('📋 [Environment] OPENAI_API_KEY loaded:', process.env.OPENAI_API_KEY ? `Yes (length: ${process.env.OPENAI_API_KEY.length})` : 'No');

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const postgres = require('postgres');
const cors = require('cors');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
// Using Gemini API via fetch (no SDK needed)

const app = express();

const DEFAULT_TRIP_IMAGE = 'https://images.unsplash.com/photo-1663017225895-61cfe42309ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';
const MAX_TRIP_TITLE_LENGTH = 255;
const MAX_TRIP_DESTINATION_LENGTH = 255;
const MAX_TRIP_BUDGET_LENGTH = 50;
const MAX_TRIP_IMAGE_LENGTH = 150000000; // ~100MB of base64 data

// Destination field length limits (matching database schema)
const MAX_DESTINATION_NAME_LENGTH = 255;
const MAX_DESTINATION_LOCATION_LENGTH = 255;
const MAX_DESTINATION_CATEGORY_LENGTH = 100;
const MAX_DESTINATION_IMAGE_URL_LENGTH = 2000; // Increased for longer URLs
const MAX_DESTINATION_DESCRIPTION_LENGTH = 10000; // TEXT field, but we'll set a reasonable limit

// Image upload configuration
const MAX_IMAGE_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');

// Ensure upload directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, IMAGES_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_IMAGE_FILE_SIZE,
  },
  fileFilter: fileFilter,
});

let tripIdUsesText = false;
const photoLogFile = path.join(__dirname, 'photo-errors.log');

const logPhotoError = (context, error) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack || '' : '';
  fs.appendFileSync(photoLogFile, `[${new Date().toISOString()}] ${context}: ${message}\n${stack}\n`);
  return message;
};

const parseBudgetInput = (budget) => {
  try {
    if (budget === null || budget === undefined || budget === '') {
      return 0;
    }
    if (typeof budget === 'number' && !isNaN(budget)) {
      return budget;
    }
    if (typeof budget === 'string') {
      const numericValue = parseFloat(budget.replace(/[^\d.-]/g, ''));
      if (!isNaN(numericValue)) {
        return numericValue;
      }
    }
    return 0;
  } catch (error) {
    console.warn('⚠️ Error parsing budget input:', error, 'Budget value:', budget);
    return 0;
  }
};

const formatBudgetForClient = (budget) => {
  try {
    if (budget === null || budget === undefined || budget === '') {
      return '₱0';
    }
    const numericValue = parseBudgetInput(budget);
    if (isNaN(numericValue) || numericValue < 0) {
      return '₱0';
    }
    return `₱${Math.round(numericValue).toLocaleString()}`;
  } catch (error) {
    console.warn('⚠️ Error formatting budget:', error, 'Budget value:', budget);
    return '₱0';
  }
};

const normalizeItinerary = (itinerary) => {
  if (!itinerary) return [];
  if (Array.isArray(itinerary)) return itinerary;
  try {
    const parsed = typeof itinerary === 'string' ? JSON.parse(itinerary) : itinerary;
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('⚠️ Failed to parse itinerary JSON, defaulting to empty array:', error.message);
    return [];
  }
};

const normalizeTripRecord = (trip) => {
  try {
    return {
      ...trip,
      budget: formatBudgetForClient(trip.budget),
      companions: trip.companions ?? 1,
      status: trip.status === 'planning' ? 'upcoming' : (trip.status || 'upcoming'),
      image: trip.image || DEFAULT_TRIP_IMAGE,
      itinerary: normalizeItinerary(trip.itinerary),
    };
  } catch (error) {
    console.error('❌ Error normalizing trip record:', error, 'Trip:', trip);
    // Return a safe default if normalization fails
    return {
      ...trip,
      budget: '₱0',
      companions: trip.companions ?? 1,
      status: trip.status || 'upcoming',
      image: trip.image || DEFAULT_TRIP_IMAGE,
      itinerary: [],
    };
  }
};

// Enhanced CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://untaxing-invertible-brittny.ngrok-free.dev',
    ];
    
    // Allow any ngrok domain
    const isNgrok = origin.includes('.ngrok-free.dev') || origin.includes('.ngrok.io');
    
    if (allowedOrigins.includes(origin) || isNgrok) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Serve uploaded images statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Initialize PostgreSQL connection
let sql;
try {
  console.log('🔗 Attempting to connect to database...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
  console.log('🔍 Database URL details:', process.env.DATABASE_URL?.substring(0, 50) + '...');
  
  sql = postgres(process.env.DATABASE_URL, {
    ssl: 'require',
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    prepare: false
  });
  
  // Test the connection
  sql`SELECT NOW()`.then(result => {
    console.log('✅ PostgreSQL connected successfully');
    console.log('📊 Database time:', result[0].now);
  }).catch(err => {
    console.error('❌ Database connection test failed:', err);
  });
  
} catch (error) {
  console.error('❌ PostgreSQL connection failed:', error);
  console.error('DATABASE_URL:', process.env.DATABASE_URL);
  process.exit(1);
}

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('📝 Registration request received:', req.body);
    const { email, password, firstName, lastName } = req.body;
    
    // Validate input
    if (!email || !password || !firstName || !lastName) {
      console.log('❌ Validation failed - missing fields');
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = randomUUID();
    
    console.log('💾 Inserting user into database...');
    // Insert user using direct SQL
    const user = await sql`
      INSERT INTO "User" (id, email, password, "firstName", "lastName", "createdAt", "updatedAt")
      VALUES (${id}, ${email}, ${hashedPassword}, ${firstName}, ${lastName}, NOW(), NOW())
      RETURNING id, email, "firstName", "lastName", "profilePhoto", "createdAt"
    `;
    
    console.log('✅ User created in database:', user[0].email);
    
    const token = jwt.sign({ userId: user[0].id }, process.env.JWT_SECRET || 'fallback-secret');
    
    res.status(201).json({ user: user[0], token });
  } catch (error) {
    console.error('❌ Registration error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user using direct SQL
    const users = await sql`
      SELECT id, email, password, "firstName", "lastName", "profilePhoto"
      FROM "User"
      WHERE email = ${email}
    `;
    
    if (users.length === 0 || !await bcrypt.compare(password, users[0].password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: users[0].id }, process.env.JWT_SECRET || 'fallback-secret');
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = users[0];
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Fetch user profile
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const users = await sql`
      SELECT id, email, "firstName", "lastName", "profilePhoto", "createdAt"
      FROM "User"
      WHERE id = ${id}
    `;

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('❌ Fetch user error:', error);
    res.status(400).json({ error: error.message || 'Failed to load user' });
  }
});

// Update user profile
app.put('/api/users/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, profilePhoto } = req.body;

    console.log('📝 Updating profile for user:', id);
    console.log('📸 Profile photo:', profilePhoto ? 'provided' : 'not provided');

    // Check if user exists
    const existingUser = await sql`
      SELECT id FROM "User" WHERE id = ${id}
    `;

    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If email is being changed, check if it's already taken
    if (email) {
      const emailExists = await sql`
        SELECT id FROM "User" WHERE email = ${email} AND id != ${id}
      `;
      if (emailExists.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Update the user
    const updatedUser = await sql`
      UPDATE "User"
      SET 
        "firstName" = COALESCE(${firstName}, "firstName"),
        "lastName" = COALESCE(${lastName}, "lastName"),
        email = COALESCE(${email}, email),
        "profilePhoto" = COALESCE(${profilePhoto}, "profilePhoto"),
        "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING id, email, "firstName", "lastName", "profilePhoto", "createdAt", "updatedAt"
    `;

    console.log('✅ Profile updated:', updatedUser[0].email);
    res.json({ user: updatedUser[0], message: 'Profile updated successfully' });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(400).json({ error: error.message || 'Failed to update profile' });
  }
});

// Change password
app.put('/api/users/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    console.log('🔐 Changing password for user:', id);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get user with password
    const users = await sql`
      SELECT id, password FROM "User" WHERE id = ${id}
    `;

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await sql`
      UPDATE "User"
      SET password = ${hashedPassword}, "updatedAt" = NOW()
      WHERE id = ${id}
    `;

    console.log('✅ Password changed successfully');
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(400).json({ error: error.message || 'Failed to change password' });
  }
});

// Send email verification
app.post('/api/users/:id/email/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { newEmail, currentPassword } = req.body;

    console.log('📧 Sending email verification for user:', id);

    if (!newEmail || !currentPassword) {
      return res.status(400).json({ error: 'New email and current password are required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get user with password
    const users = await sql`
      SELECT id, email, password FROM "User" WHERE id = ${id}
    `;

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Check if new email is different
    if (newEmail === users[0].email) {
      return res.status(400).json({ error: 'New email must be different from current email' });
    }

    // Check if email is already in use
    const emailExists = await sql`
      SELECT id FROM "User" WHERE email = ${newEmail} AND id != ${id}
    `;
    if (emailExists.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // In a real implementation, you would:
    // 1. Generate a verification token
    // 2. Store it in the database with an expiration
    // 3. Send an email with a verification link
    // For now, we'll just return success
    // TODO: Implement actual email sending service

    console.log('✅ Email verification sent to:', newEmail);
    res.json({ message: 'Verification link sent to new email address' });
  } catch (error) {
    console.error('❌ Send email verification error:', error);
    res.status(400).json({ error: error.message || 'Failed to send verification email' });
  }
});

// Get user settings
app.get('/api/users/:id/settings', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const userExists = await sql`
      SELECT id FROM "User" WHERE id = ${id}
    `;

    if (userExists.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get settings or create default
    let settings = await sql`
      SELECT * FROM "UserSettings" WHERE "userId" = ${id}
    `;

    if (settings.length === 0) {
      // Create default settings
      settings = await sql`
        INSERT INTO "UserSettings" ("userId", "emailNotifications", "newsletter", "tripUpdates", "darkMode", "language", "timezone", "dateFormat", "mapView", "autoBackup")
        VALUES (${id}, true, false, true, false, 'en', 'UTC', 'MM/DD/YYYY', 'Standard', true)
        RETURNING *
      `;
    }

    res.json(settings[0]);
  } catch (error) {
    console.error('❌ Get settings error:', error);
    res.status(400).json({ error: error.message || 'Failed to get settings' });
  }
});

// Update user settings
app.put('/api/users/:id/settings', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    console.log('⚙️ Updating settings for user:', id, 'with:', body);

    // Check if user exists
    const userExists = await sql`
      SELECT id FROM "User" WHERE id = ${id}
    `;

    if (userExists.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // First, ensure settings record exists with defaults
    await sql`
      INSERT INTO "UserSettings" ("userId", "emailNotifications", "newsletter", "tripUpdates", "darkMode", "language", "timezone", "dateFormat", "mapView", "autoBackup")
      VALUES (${id}, true, false, true, false, 'en', 'UTC', 'MM/DD/YYYY', 'Standard', true)
      ON CONFLICT ("userId") DO NOTHING
    `;

    // Convert undefined to null for SQL compatibility
    // SQL COALESCE will preserve existing values when null is passed
    const emailNotifications = body.emailNotifications !== undefined ? body.emailNotifications : null;
    const newsletter = body.newsletter !== undefined ? body.newsletter : null;
    const tripUpdates = body.tripUpdates !== undefined ? body.tripUpdates : null;
    const darkMode = body.darkMode !== undefined ? body.darkMode : null;
    const language = body.language !== undefined ? body.language : null;
    const timezone = body.timezone !== undefined ? body.timezone : null;
    const dateFormat = body.dateFormat !== undefined ? body.dateFormat : null;
    const mapView = body.mapView !== undefined ? body.mapView : null;
    const autoBackup = body.autoBackup !== undefined ? body.autoBackup : null;

    // Update settings - COALESCE preserves existing value if null is passed
    const settings = await sql`
      UPDATE "UserSettings"
      SET 
        "emailNotifications" = COALESCE(${emailNotifications}, "emailNotifications"),
        "newsletter" = COALESCE(${newsletter}, "newsletter"),
        "tripUpdates" = COALESCE(${tripUpdates}, "tripUpdates"),
        "darkMode" = COALESCE(${darkMode}, "darkMode"),
        "language" = COALESCE(${language}, "language"),
        "timezone" = COALESCE(${timezone}, "timezone"),
        "dateFormat" = COALESCE(${dateFormat}, "dateFormat"),
        "mapView" = COALESCE(${mapView}, "mapView"),
        "autoBackup" = COALESCE(${autoBackup}, "autoBackup"),
        "updatedAt" = NOW()
      WHERE "userId" = ${id}
      RETURNING *
    `;

    console.log('✅ Settings updated');
    res.json({ settings: settings[0], message: 'Settings updated successfully' });
  } catch (error) {
    console.error('❌ Update settings error:', error);
    res.status(400).json({ error: error.message || 'Failed to update settings' });
  }
});

// Delete user account
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    console.log('🗑️ Deleting account for user:', id);

    // Get user with password
    const users = await sql`
      SELECT id, password FROM "User" WHERE id = ${id}
    `;

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password if provided
    if (password) {
      const isValidPassword = await bcrypt.compare(password, users[0].password);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Password is incorrect' });
      }
    }

    // Delete user (cascades to settings, destinations, etc.)
    await sql`DELETE FROM "User" WHERE id = ${id}`;

    console.log('✅ Account deleted');
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('❌ Delete account error:', error);
    res.status(400).json({ error: error.message || 'Failed to delete account' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Travel API is running!' });
});

// Database initialization
async function initializeDatabase() {
  try {
    // Create destinations table
    await sql`
      CREATE TABLE IF NOT EXISTS "Destination" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        image TEXT,
        rating DECIMAL(3,2) DEFAULT 4.5,
        visited BOOLEAN DEFAULT false,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `;

    // Update existing image column to TEXT if it exists as VARCHAR(500)
    await sql`
      ALTER TABLE "Destination"
      ALTER COLUMN image TYPE TEXT
    `;

    // Add columns for external source metadata (TikTok, trending content, etc.)
    await sql`
      ALTER TABLE "Destination"
      ADD COLUMN IF NOT EXISTS "externalSourceId" TEXT
    `;

    await sql`
      ALTER TABLE "Destination"
      ADD COLUMN IF NOT EXISTS "externalSourcePlatform" TEXT
    `;

    await sql`
      ALTER TABLE "Destination"
      ADD COLUMN IF NOT EXISTS "externalSourceUrl" TEXT
    `;

    await sql`
      ALTER TABLE "Destination"
      ADD COLUMN IF NOT EXISTS "isExternal" BOOLEAN DEFAULT false
    `;

    // Create index for faster duplicate checking
    await sql`
      CREATE INDEX IF NOT EXISTS "Destination_userId_externalSourceId_idx" 
      ON "Destination"("userId", "externalSourceId")
      WHERE "externalSourceId" IS NOT NULL
    `;

    // Create trips table
    await sql`
      CREATE TABLE IF NOT EXISTS "Trip" (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        "startDate" DATE NOT NULL,
        "endDate" DATE NOT NULL,
        budget VARCHAR(50) NOT NULL,
        companions INTEGER DEFAULT 1,
        status VARCHAR(20) DEFAULT 'upcoming',
        image VARCHAR(500),
        itinerary JSONB DEFAULT '[]',
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      ALTER TABLE "Trip"
      ALTER COLUMN "createdAt" SET DEFAULT NOW()
    `;

    await sql`
      ALTER TABLE "Trip"
      ALTER COLUMN "updatedAt" SET DEFAULT NOW()
    `;

    await sql`
      ALTER TABLE "Trip"
      ADD COLUMN IF NOT EXISTS companions INTEGER DEFAULT 1
    `;

    await sql`
      ALTER TABLE "Trip"
      ADD COLUMN IF NOT EXISTS image TEXT
    `;

    await sql`
      ALTER TABLE "Trip"
      ALTER COLUMN image TYPE TEXT
    `;

    await sql`
      ALTER TABLE "Trip"
      ADD COLUMN IF NOT EXISTS itinerary JSONB DEFAULT '[]'
    `;

    await sql`
      ALTER TABLE "Trip"
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'upcoming'
    `;

    // Create photos table
    await sql`
      CREATE TABLE IF NOT EXISTS "Photo" (
        id SERIAL PRIMARY KEY,
        "destinationId" INTEGER NOT NULL REFERENCES "Destination"(id) ON DELETE CASCADE,
        url VARCHAR(500) NOT NULL,
        caption TEXT,
        rating INTEGER DEFAULT 5,
        "dateAdded" DATE DEFAULT CURRENT_DATE,
        title VARCHAR(255),
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      ALTER TABLE "Photo"
      ALTER COLUMN "destinationId" DROP NOT NULL
    `;

    await sql`
      ALTER TABLE "Photo"
      DROP CONSTRAINT IF EXISTS "Photo_destinationId_fkey"
    `;

    await sql`
      ALTER TABLE "Photo"
      ADD CONSTRAINT "Photo_destinationId_fkey"
      FOREIGN KEY ("destinationId") REFERENCES "Destination"(id) ON DELETE SET NULL
    `;

    await sql`
      ALTER TABLE "Photo"
      ALTER COLUMN url TYPE TEXT
    `;

    // Create Activity table if it doesn't exist
    // Store tripId as TEXT to handle both integer and text Trip IDs
    // We enforce referential integrity at the application level via JOINs
    await sql`
      CREATE TABLE IF NOT EXISTS "Activity" (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        location TEXT,
        "startTime" TIMESTAMP(3),
        "endTime" TIMESTAMP(3),
        cost DOUBLE PRECISION,
        "tripId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create index on tripId for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS "Activity_tripId_idx" ON "Activity"("tripId")
    `;

    // Detect Trip ID column type so we know whether to generate IDs manually
    const tripIdColumn = await sql`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Trip' AND column_name = 'id'
    `;
    const tripIdType = tripIdColumn[0]?.data_type || '';
    tripIdUsesText = !tripIdType || tripIdType.toLowerCase().includes('text') || tripIdType.toLowerCase().includes('char');
    console.log('🆔 Trip ID column type:', tripIdType || 'unknown', '| Using manual UUID:', tripIdUsesText);

    // Create UserSettings table
    await sql`
      CREATE TABLE IF NOT EXISTS "UserSettings" (
        id SERIAL PRIMARY KEY,
        "userId" TEXT NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
        "emailNotifications" BOOLEAN DEFAULT true,
        "newsletter" BOOLEAN DEFAULT false,
        "tripUpdates" BOOLEAN DEFAULT true,
        "darkMode" BOOLEAN DEFAULT false,
        "language" VARCHAR(10) DEFAULT 'en',
        "timezone" VARCHAR(50) DEFAULT 'UTC',
        "dateFormat" VARCHAR(20) DEFAULT 'MM/DD/YYYY',
        "mapView" VARCHAR(20) DEFAULT 'Standard',
        "autoBackup" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `;

    // Add new columns if they don't exist
    await sql`
      ALTER TABLE "UserSettings"
      ADD COLUMN IF NOT EXISTS "dateFormat" VARCHAR(20) DEFAULT 'MM/DD/YYYY'
    `;

    await sql`
      ALTER TABLE "UserSettings"
      ADD COLUMN IF NOT EXISTS "mapView" VARCHAR(20) DEFAULT 'Standard'
    `;

    await sql`
      ALTER TABLE "UserSettings"
      ADD COLUMN IF NOT EXISTS "autoBackup" BOOLEAN DEFAULT true
    `;

    // Create index on userId for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS "UserSettings_userId_idx" ON "UserSettings"("userId")
    `;

    // Add profilePhoto column to User table if it doesn't exist
    await sql`
      ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS "profilePhoto" TEXT
    `;

    console.log('🗄️ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// Initialize database on server start
initializeDatabase();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) {
      console.log('❌ Invalid token:', err.message);
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.log('✅ Token verified for userId:', user.userId);
    req.user = user;
    next();
  });
};

// IMAGE UPLOAD ENDPOINT
app.post('/api/upload/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Generate URL for the uploaded image
    const imageUrl = `/uploads/images/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${imageUrl}`;

    console.log('✅ Image uploaded successfully:', req.file.filename);
    res.status(200).json({
      url: fullUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Failed to delete uploaded file:', err);
      });
    }
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: `File too large. Maximum size is ${MAX_IMAGE_FILE_SIZE / 1024 / 1024}MB` 
        });
      }
      return res.status(400).json({ error: `Upload error: ${error.message}` });
    }
    
    res.status(400).json({ error: error.message || 'Failed to upload image' });
  }
});

// DESTINATIONS CRUD OPERATIONS
app.get('/api/destinations', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching destinations for userId:', req.user.userId);
    const destinations = await sql`
      SELECT id, name, location, category, description, image, rating, visited, "createdAt", "updatedAt"
      FROM "Destination"
      WHERE "userId" = ${req.user.userId}
      ORDER BY "createdAt" DESC
    `;
    console.log('📊 Found destinations:', destinations.length);
    res.json(destinations);
  } catch (error) {
    console.error('❌ Error fetching destinations:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/destinations', authenticateToken, async (req, res) => {
  try {
    const { name, location, category, description, image, rating } = req.body;
    
    console.log('🆕 Creating destination for userId:', req.user.userId);
    console.log('📝 Destination data:', { name, location, userId: req.user.userId });
    
    // Validate and sanitize input fields
    const sanitizedName = typeof name === 'string' ? name.trim() : '';
    const sanitizedLocation = typeof location === 'string' ? location.trim() : '';
    const sanitizedCategory = typeof category === 'string' ? category.trim() : '';
    const sanitizedDescription = typeof description === 'string' ? description.trim() : '';
    const sanitizedImage = typeof image === 'string' ? image.trim() : '';
    const ratingValue = Number(rating);
    const normalizedRating = Number.isFinite(ratingValue) && ratingValue >= 0 && ratingValue <= 5
      ? Math.round(ratingValue * 100) / 100 // Round to 2 decimal places
      : 4.5;
    
    // Validate required fields
    if (!sanitizedName) {
      return res.status(400).json({ 
        error: 'Destination name is required',
        field: 'name'
      });
    }
    
    if (!sanitizedLocation) {
      return res.status(400).json({ 
        error: 'Location is required',
        field: 'location'
      });
    }
    
    if (!sanitizedCategory) {
      return res.status(400).json({ 
        error: 'Category is required',
        field: 'category'
      });
    }
    
    // Validate field lengths
    if (sanitizedName.length > MAX_DESTINATION_NAME_LENGTH) {
      return res.status(400).json({ 
        error: `Destination name is too long. Maximum ${MAX_DESTINATION_NAME_LENGTH} characters allowed (current: ${sanitizedName.length})`,
        field: 'name',
        maxLength: MAX_DESTINATION_NAME_LENGTH,
        currentLength: sanitizedName.length
      });
    }
    
    if (sanitizedLocation.length > MAX_DESTINATION_LOCATION_LENGTH) {
      return res.status(400).json({ 
        error: `Location is too long. Maximum ${MAX_DESTINATION_LOCATION_LENGTH} characters allowed (current: ${sanitizedLocation.length})`,
        field: 'location',
        maxLength: MAX_DESTINATION_LOCATION_LENGTH,
        currentLength: sanitizedLocation.length
      });
    }
    
    if (sanitizedCategory.length > MAX_DESTINATION_CATEGORY_LENGTH) {
      return res.status(400).json({ 
        error: `Category is too long. Maximum ${MAX_DESTINATION_CATEGORY_LENGTH} characters allowed (current: ${sanitizedCategory.length})`,
        field: 'category',
        maxLength: MAX_DESTINATION_CATEGORY_LENGTH,
        currentLength: sanitizedCategory.length
      });
    }
    
    if (sanitizedDescription.length > MAX_DESTINATION_DESCRIPTION_LENGTH) {
      return res.status(400).json({ 
        error: `Description is too long. Maximum ${MAX_DESTINATION_DESCRIPTION_LENGTH} characters allowed (current: ${sanitizedDescription.length})`,
        field: 'description',
        maxLength: MAX_DESTINATION_DESCRIPTION_LENGTH,
        currentLength: sanitizedDescription.length
      });
    }
    
    // Validate image URL length (now supports longer URLs)
    if (sanitizedImage && sanitizedImage.length > MAX_DESTINATION_IMAGE_URL_LENGTH) {
      return res.status(400).json({ 
        error: `Image URL is too long. Maximum ${MAX_DESTINATION_IMAGE_URL_LENGTH} characters allowed (current: ${sanitizedImage.length}). Please use a shorter image URL.`,
        field: 'image',
        maxLength: MAX_DESTINATION_IMAGE_URL_LENGTH,
        currentLength: sanitizedImage.length
      });
    }
    
    const destination = await sql`
      INSERT INTO "Destination" (name, location, category, description, image, rating, "userId")
      VALUES (${sanitizedName}, ${sanitizedLocation}, ${sanitizedCategory}, ${sanitizedDescription}, ${sanitizedImage || null}, ${normalizedRating}, ${req.user.userId})
      RETURNING *
    `;
    
    console.log('✅ Destination created:', destination[0]);
    res.status(201).json(destination[0]);
  } catch (error) {
    console.error('❌ Error creating destination:', error);
    
    // Check if it's a database constraint error
    if (error.message && error.message.includes('value too long for type character varying')) {
      // Extract the field name from the error if possible
      const fieldMatch = error.message.match(/column "(\w+)"/i);
      const fieldName = fieldMatch ? fieldMatch[1] : 'unknown';
      
      return res.status(400).json({ 
        error: `The ${fieldName} field exceeds the maximum allowed length. Please shorten your input.`,
        field: fieldName,
        details: error.message
      });
    }
    
    res.status(400).json({ error: error.message || 'Failed to create destination' });
  }
});

app.put('/api/destinations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, category, description, image, rating, visited } = req.body;
    
    // Validate and sanitize input fields (same validation as POST)
    const sanitizedName = typeof name === 'string' ? name.trim() : '';
    const sanitizedLocation = typeof location === 'string' ? location.trim() : '';
    const sanitizedCategory = typeof category === 'string' ? category.trim() : '';
    const sanitizedDescription = typeof description === 'string' ? description.trim() : '';
    const sanitizedImage = typeof image === 'string' ? image.trim() : '';
    const ratingValue = Number(rating);
    const normalizedRating = Number.isFinite(ratingValue) && ratingValue >= 0 && ratingValue <= 5
      ? Math.round(ratingValue * 100) / 100
      : 4.5;
    const visitedValue = Boolean(visited);
    
    // Validate required fields
    if (!sanitizedName) {
      return res.status(400).json({ 
        error: 'Destination name is required',
        field: 'name'
      });
    }
    
    if (!sanitizedLocation) {
      return res.status(400).json({ 
        error: 'Location is required',
        field: 'location'
      });
    }
    
    if (!sanitizedCategory) {
      return res.status(400).json({ 
        error: 'Category is required',
        field: 'category'
      });
    }
    
    // Validate field lengths
    if (sanitizedName.length > MAX_DESTINATION_NAME_LENGTH) {
      return res.status(400).json({ 
        error: `Destination name is too long. Maximum ${MAX_DESTINATION_NAME_LENGTH} characters allowed (current: ${sanitizedName.length})`,
        field: 'name',
        maxLength: MAX_DESTINATION_NAME_LENGTH,
        currentLength: sanitizedName.length
      });
    }
    
    if (sanitizedLocation.length > MAX_DESTINATION_LOCATION_LENGTH) {
      return res.status(400).json({ 
        error: `Location is too long. Maximum ${MAX_DESTINATION_LOCATION_LENGTH} characters allowed (current: ${sanitizedLocation.length})`,
        field: 'location',
        maxLength: MAX_DESTINATION_LOCATION_LENGTH,
        currentLength: sanitizedLocation.length
      });
    }
    
    if (sanitizedCategory.length > MAX_DESTINATION_CATEGORY_LENGTH) {
      return res.status(400).json({ 
        error: `Category is too long. Maximum ${MAX_DESTINATION_CATEGORY_LENGTH} characters allowed (current: ${sanitizedCategory.length})`,
        field: 'category',
        maxLength: MAX_DESTINATION_CATEGORY_LENGTH,
        currentLength: sanitizedCategory.length
      });
    }
    
    if (sanitizedDescription.length > MAX_DESTINATION_DESCRIPTION_LENGTH) {
      return res.status(400).json({ 
        error: `Description is too long. Maximum ${MAX_DESTINATION_DESCRIPTION_LENGTH} characters allowed (current: ${sanitizedDescription.length})`,
        field: 'description',
        maxLength: MAX_DESTINATION_DESCRIPTION_LENGTH,
        currentLength: sanitizedDescription.length
      });
    }
    
    if (sanitizedImage && sanitizedImage.length > MAX_DESTINATION_IMAGE_URL_LENGTH) {
      return res.status(400).json({ 
        error: `Image URL is too long. Maximum ${MAX_DESTINATION_IMAGE_URL_LENGTH} characters allowed (current: ${sanitizedImage.length}). Please use a shorter image URL.`,
        field: 'image',
        maxLength: MAX_DESTINATION_IMAGE_URL_LENGTH,
        currentLength: sanitizedImage.length
      });
    }
    
    const destination = await sql`
      UPDATE "Destination"
      SET name = ${sanitizedName}, location = ${sanitizedLocation}, category = ${sanitizedCategory}, 
          description = ${sanitizedDescription}, image = ${sanitizedImage || null}, rating = ${normalizedRating}, 
          visited = ${visitedValue}, "updatedAt" = NOW()
      WHERE id = ${id} AND "userId" = ${req.user.userId}
      RETURNING *
    `;
    
    if (destination.length === 0) {
      return res.status(404).json({ error: 'Destination not found' });
    }
    
    res.json(destination[0]);
  } catch (error) {
    console.error('❌ Error updating destination:', error);
    
    // Check if it's a database constraint error
    if (error.message && error.message.includes('value too long for type character varying')) {
      const fieldMatch = error.message.match(/column "(\w+)"/i);
      const fieldName = fieldMatch ? fieldMatch[1] : 'unknown';
      
      return res.status(400).json({ 
        error: `The ${fieldName} field exceeds the maximum allowed length. Please shorten your input.`,
        field: fieldName,
        details: error.message
      });
    }
    
    res.status(400).json({ error: error.message || 'Failed to update destination' });
  }
});

app.delete('/api/destinations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const destination = await sql`
      DELETE FROM "Destination"
      WHERE id = ${id} AND "userId" = ${req.user.userId}
      RETURNING *
    `;
    
    if (destination.length === 0) {
      return res.status(404).json({ error: 'Destination not found' });
    }
    
    res.json({ message: 'Destination deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// TRIPS CRUD OPERATIONS
app.get('/api/trips', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching trips for userId:', req.user.userId);
    const trips = await sql`
      SELECT id, title, destination, "startDate", "endDate", budget, companions, status, image, itinerary, "createdAt", "updatedAt"
      FROM "Trip"
      WHERE "userId" = ${req.user.userId}
      ORDER BY "startDate" ASC
    `;

    // Fetch all activities for all trips using a JOIN (ensures only user's activities)
    let activities = [];
    if (trips.length > 0) {
      // Use JOIN to fetch activities - ensures security by joining through Trip table
      // Handle both integer and text trip IDs
      activities = await sql`
        SELECT a.id, a.title, a.description, a.location, a."startTime", a."endTime", COALESCE(a.cost, 0) as cost, a."tripId", a."createdAt", a."updatedAt"
        FROM "Activity" a
        INNER JOIN "Trip" t ON a."tripId" = t.id::text
        WHERE t."userId" = ${req.user.userId}
        ORDER BY a."startTime" ASC
      `;
    }

    // Group activities by tripId
    const activitiesByTripId = {};
    activities.forEach(act => {
      const tripId = act.tripId;
      if (!activitiesByTripId[tripId]) {
        activitiesByTripId[tripId] = [];
      }
      activitiesByTripId[tripId].push(act);
    });

    // Normalize trips and populate itinerary from Activity table
    const normalizedTrips = trips.map(trip => {
      try {
        const normalizedTrip = normalizeTripRecord(trip);
        const tripIdStr = String(trip.id);
        const tripActivities = activitiesByTripId[tripIdStr] || [];

        // Convert activities to itinerary format
        const itineraryItems = tripActivities.map(act => {
          try {
            const actStartTime = act.startTime ? new Date(act.startTime) : null;
            const tripStartDate = trip.startDate ? new Date(trip.startDate) : new Date();
            
            // Calculate day number (1-indexed)
            let dayNum = 1;
            if (actStartTime && !isNaN(actStartTime.getTime())) {
              const diffTime = actStartTime.getTime() - tripStartDate.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              dayNum = Math.max(1, diffDays + 1);
            }

            // Format time as HH:MM
            const timeStr = actStartTime && !isNaN(actStartTime.getTime())
              ? `${String(actStartTime.getHours()).padStart(2, '0')}:${String(actStartTime.getMinutes()).padStart(2, '0')}`
              : '';

            const activityCost = act.cost != null ? parseFloat(act.cost) : 0;
            return {
              id: act.id,
              day: dayNum,
              time: timeStr,
              activity: act.title || '',
              location: act.location || '',
              budget: isNaN(activityCost) ? 0 : activityCost,
              createdAt: act.createdAt ? new Date(act.createdAt).toISOString() : new Date().toISOString(),
            };
          } catch (actError) {
            console.warn('⚠️ Error processing activity:', actError, 'Activity:', act);
            return null;
          }
        }).filter(item => item !== null); // Remove any failed activity conversions

        // Calculate budget information - use original trip.budget before normalization
        const tripBudgetStr = trip.budget || '0';
        const tripBudgetNum = parseFloat(String(tripBudgetStr).replace(/[₱$,]/g, '')) || 0;
        const totalSpent = tripActivities.reduce((sum, act) => {
          try {
            const cost = act.cost != null ? parseFloat(act.cost) : 0;
            return sum + (isNaN(cost) ? 0 : cost);
          } catch (costError) {
            console.warn('⚠️ Error parsing activity cost:', costError, 'Activity:', act);
            return sum;
          }
        }, 0);
        const remainingBudget = tripBudgetNum - totalSpent;

        return {
          ...normalizedTrip,
          itinerary: itineraryItems, // Override itinerary with data from Activity table
          remainingBudget: remainingBudget,
          totalSpent: totalSpent,
        };
      } catch (tripError) {
        console.error('❌ Error processing trip:', tripError, 'Trip ID:', trip.id);
        // Return a minimal valid trip object to prevent complete failure
        return {
          id: trip.id,
          title: trip.title || 'Untitled Trip',
          destination: trip.destination || '',
          startDate: trip.startDate || new Date().toISOString(),
          endDate: trip.endDate || new Date().toISOString(),
          budget: '₱0',
          companions: trip.companions ?? 1,
          status: trip.status || 'upcoming',
          image: trip.image || DEFAULT_TRIP_IMAGE,
          itinerary: [],
          remainingBudget: 0,
          totalSpent: 0,
          createdAt: trip.createdAt || new Date().toISOString(),
          updatedAt: trip.updatedAt || new Date().toISOString(),
        };
      }
    });

    // Filter out any null/undefined trips (shouldn't happen, but safety check)
    const validTrips = normalizedTrips.filter(trip => trip && trip.id);
    
    console.log('📊 Found trips:', validTrips.length);
    console.log('📊 Total activities loaded:', activities.length);
    
    // Always return a valid response, even if empty
    res.status(200).json({ trips: validTrips });
  } catch (error) {
    console.error('❌ Error fetching trips:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Return 500 for server errors, 400 only for client errors
    const statusCode = error.message && error.message.includes('validation') ? 400 : 500;
    res.status(statusCode).json({ 
      error: error.message || 'Failed to load trips', 
      trips: [] 
    });
  }
});

app.post('/api/trips', authenticateToken, async (req, res) => {
  const logFile = path.join(__dirname, 'trip-creation.log');
  const timestamp = new Date().toISOString();
  
  // Write to file immediately
  fs.appendFileSync(logFile, `\n${'='.repeat(60)}\n${timestamp} - TRIP CREATION ENDPOINT HIT\n${'='.repeat(60)}\n`);
  
  console.log('='.repeat(50));
  console.log('🚨 TRIP CREATION ENDPOINT HIT!');
  console.log('='.repeat(50));
  
  try {
    fs.appendFileSync(logFile, `Request body: ${JSON.stringify(req.body)}\n`);
    fs.appendFileSync(logFile, `User ID: ${req.user.userId}\n`);
    
    console.log('📝 Full request body:', req.body);
    console.log('👤 Authenticated user:', req.user);
    
    const { title, destination, startDate, endDate, budget, companions, status, image, itinerary } = req.body;

    const sanitizedTitle = typeof title === 'string' ? title.trim() : '';
    const sanitizedDestination = typeof destination === 'string' ? destination.trim() : '';
    const sanitizedBudget = typeof budget === 'string' ? budget.trim() : '';
    const sanitizedImage = typeof image === 'string' ? image.trim() : '';

    if (!sanitizedTitle) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (sanitizedTitle.length > MAX_TRIP_TITLE_LENGTH) {
      return res.status(400).json({ error: `Title must be ${MAX_TRIP_TITLE_LENGTH} characters or less` });
    }
    if (!sanitizedDestination) {
      return res.status(400).json({ error: 'Destination is required' });
    }
    if (sanitizedDestination.length > MAX_TRIP_DESTINATION_LENGTH) {
      return res.status(400).json({ error: `Destination must be ${MAX_TRIP_DESTINATION_LENGTH} characters or less` });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }
    if (!sanitizedBudget) {
      return res.status(400).json({ error: 'Budget is required' });
    }
    if (sanitizedBudget.length > MAX_TRIP_BUDGET_LENGTH) {
      return res.status(400).json({ error: `Budget must be ${MAX_TRIP_BUDGET_LENGTH} characters or less` });
    }
    if (sanitizedImage && sanitizedImage.length > MAX_TRIP_IMAGE_LENGTH) {
      return res.status(400).json({ error: `Image data is too large (max ${MAX_TRIP_IMAGE_LENGTH.toLocaleString()} characters)` });
    }
    
    console.log('🆕 Creating trip for userId:', req.user.userId);
    console.log('📝 Trip data:', { title: sanitizedTitle, destination: sanitizedDestination, startDate, endDate, budget: sanitizedBudget, companions, status, imageLength: sanitizedImage.length, itinerary, userId: req.user.userId });
    
    console.log('🗄️ Executing SQL INSERT...');
    fs.appendFileSync(logFile, `Executing SQL INSERT...\n`);
    
    const numericBudget = parseBudgetInput(sanitizedBudget);
    const itineraryData = normalizeItinerary(itinerary);
    const companionsValue = Number.isFinite(Number(companions)) ? Number(companions) : 1;
    const tripStatus = status === 'planning' ? 'upcoming' : (status || 'upcoming');
    const tripImage = sanitizedImage || DEFAULT_TRIP_IMAGE;

    try {
      let trip;
      if (tripIdUsesText) {
        const tripId = randomUUID();
        trip = await sql`
          INSERT INTO "Trip" (id, title, destination, "startDate", "endDate", budget, companions, status, image, itinerary, "userId", "createdAt", "updatedAt")
          VALUES (${tripId}, ${sanitizedTitle}, ${sanitizedDestination}, ${startDate}, ${endDate}, ${numericBudget}, ${companionsValue}, ${tripStatus}, ${tripImage}, ${JSON.stringify(itineraryData)}, ${req.user.userId}, NOW(), NOW())
          RETURNING *
        `;
      } else {
        trip = await sql`
          INSERT INTO "Trip" (title, destination, "startDate", "endDate", budget, companions, status, image, itinerary, "userId", "createdAt", "updatedAt")
          VALUES (${sanitizedTitle}, ${sanitizedDestination}, ${startDate}, ${endDate}, ${numericBudget}, ${companionsValue}, ${tripStatus}, ${tripImage}, ${JSON.stringify(itineraryData)}, ${req.user.userId}, NOW(), NOW())
        RETURNING *
      `;
      }
      
      fs.appendFileSync(logFile, `✅ Trip inserted: ${JSON.stringify(trip[0])}\n`);
      console.log('📊 SQL INSERT result:', trip);
      console.log('✅ Trip created successfully:', trip[0]);
      
      // Verify the trip was actually saved by querying it back
      const verifyTrip = await sql`
        SELECT * FROM "Trip" WHERE id = ${trip[0].id}
      `;
      fs.appendFileSync(logFile, `✅ Verification query returned: ${JSON.stringify(verifyTrip)}\n`);
      console.log('🔍 Verification query result:', verifyTrip);
      
      if (verifyTrip.length === 0) {
        fs.appendFileSync(logFile, `❌ CRITICAL: Trip was not saved to database!\n`);
        console.error('❌ CRITICAL: Trip was not saved to database!');
        return res.status(500).json({ error: 'Trip creation failed - data not saved' });
      }
      
      const normalizedTrip = normalizeTripRecord(trip[0]);
      fs.appendFileSync(logFile, `✅ Sending response: ${JSON.stringify(normalizedTrip)}\n`);
      console.log('✅ Sending response:', normalizedTrip);
      res.status(201).json({ trip: normalizedTrip });
    } catch (sqlError) {
      fs.appendFileSync(logFile, `❌ SQL Error: ${sqlError.message}\n`);
      console.error('❌ SQL Error:', sqlError);
      console.error('❌ SQL Error message:', sqlError.message);
      console.error('❌ SQL Error code:', sqlError.code);
      return res.status(500).json({ error: `Database error: ${sqlError.message}` });
    }
    
  } catch (error) {
    fs.appendFileSync(logFile, `❌ General Error: ${error.message}\n`);
    console.error('❌ General Error creating trip:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(400).json({ error: error.message });
  }
  
  console.log('='.repeat(50));
  console.log('🚨 TRIP CREATION ENDPOINT FINISHED!');
  console.log('='.repeat(50));
  fs.appendFileSync(logFile, `Endpoint finished\n`);
});

app.put('/api/trips/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, destination, startDate, endDate, budget, companions, status, image, itinerary } = req.body;
    
    // Convert id to number for SERIAL column
    const tripId = tripIdUsesText ? id : parseInt(id);
    if (!tripIdUsesText && isNaN(tripId)) {
      console.log('❌ Invalid trip ID for update:', id);
      return res.status(400).json({ error: 'Invalid trip ID' });
    }
    
    console.log('✏️ UPDATE trip request');
    console.log('Trip ID:', tripId, 'User ID:', req.user.userId);
    
    const sanitizedTitle = typeof title === 'string' ? title.trim() : '';
    const sanitizedDestination = typeof destination === 'string' ? destination.trim() : '';
    const sanitizedBudget = typeof budget === 'string' ? budget.trim() : '';
    const sanitizedImage = typeof image === 'string' ? image.trim() : '';

    if (!sanitizedTitle) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (sanitizedTitle.length > MAX_TRIP_TITLE_LENGTH) {
      return res.status(400).json({ error: `Title must be ${MAX_TRIP_TITLE_LENGTH} characters or less` });
    }
    if (!sanitizedDestination) {
      return res.status(400).json({ error: 'Destination is required' });
    }
    if (sanitizedDestination.length > MAX_TRIP_DESTINATION_LENGTH) {
      return res.status(400).json({ error: `Destination must be ${MAX_TRIP_DESTINATION_LENGTH} characters or less` });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }
    if (!sanitizedBudget) {
      return res.status(400).json({ error: 'Budget is required' });
    }
    if (sanitizedBudget.length > MAX_TRIP_BUDGET_LENGTH) {
      return res.status(400).json({ error: `Budget must be ${MAX_TRIP_BUDGET_LENGTH} characters or less` });
    }
    if (sanitizedImage && sanitizedImage.length > MAX_TRIP_IMAGE_LENGTH) {
      return res.status(400).json({ error: `Image data is too large (max ${MAX_TRIP_IMAGE_LENGTH.toLocaleString()} characters)` });
    }

    const numericBudget = parseBudgetInput(sanitizedBudget);
    const itineraryData = normalizeItinerary(itinerary);
    const companionsValue = Number.isFinite(Number(companions)) ? Number(companions) : 1;
    const tripStatus = status === 'planning' ? 'upcoming' : (status || 'upcoming');
    const tripImage = sanitizedImage || DEFAULT_TRIP_IMAGE;
    
    const trip = await sql`
      UPDATE "Trip"
      SET title = ${sanitizedTitle}, destination = ${sanitizedDestination}, "startDate" = ${startDate}, "endDate" = ${endDate},
          budget = ${numericBudget}, companions = ${companionsValue}, status = ${tripStatus}, image = ${tripImage}, 
          itinerary = ${JSON.stringify(itineraryData)}, "updatedAt" = NOW()
      WHERE id = ${tripId} AND "userId" = ${req.user.userId}
      RETURNING *
    `;
    
    if (trip.length === 0) {
      console.log('❌ Trip not found for update');
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    console.log('✅ Trip updated successfully');
    res.json(normalizeTripRecord(trip[0]));
  } catch (error) {
    console.error('❌ Error updating trip:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/trips/:id/activities', authenticateToken, async (req, res) => {
  try {
    console.log('🆕 Creating activity - Request body:', JSON.stringify(req.body));
    console.log('🆕 Trip ID from params:', req.params.id);
    console.log('🆕 User ID:', req.user.userId);
    
    const { id } = req.params;
    const { day, time, activity, location, budget } = req.body || {};

    // Validate trip ID
    if (!id) {
      return res.status(400).json({ error: 'Trip ID is required' });
    }

    const tripIdRaw = tripIdUsesText ? id : parseInt(id);
    if (!tripIdUsesText && isNaN(tripIdRaw)) {
      return res.status(400).json({ error: `Invalid trip ID format: ${id}` });
    }

    // Convert tripId to string for Activity table (which uses TEXT)
    const tripIdStr = String(tripIdRaw);

    // Validate day
    if (day === undefined || day === null || day === '') {
      return res.status(400).json({ error: 'Day is required' });
    }
    const numericDay = Number(day);
    if (!Number.isInteger(numericDay) || numericDay < 1 || numericDay > 60) {
      return res.status(400).json({ error: 'Day must be an integer between 1 and 60' });
    }

    // Validate and sanitize time
    if (!time) {
      return res.status(400).json({ error: 'Time is required' });
    }
    const sanitizedTime = typeof time === 'string' ? time.trim() : String(time).trim();
    if (!sanitizedTime) {
      return res.status(400).json({ error: 'Time cannot be empty' });
    }

    // Validate time format (HH:MM or HH:MM:SS)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/;
    if (!timeRegex.test(sanitizedTime)) {
      return res.status(400).json({ 
        error: 'Invalid time format. Please use HH:MM format (e.g., 14:30)' 
      });
    }

    // Validate and sanitize activity name
    if (!activity) {
      return res.status(400).json({ error: 'Activity name is required' });
    }
    const sanitizedActivity = typeof activity === 'string' ? activity.trim() : String(activity).trim();
    if (!sanitizedActivity) {
      return res.status(400).json({ error: 'Activity name cannot be empty' });
    }
    if (sanitizedActivity.length > 500) {
      return res.status(400).json({ error: 'Activity name must be 500 characters or less' });
    }

    // Validate and sanitize location
    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }
    const sanitizedLocation = typeof location === 'string' ? location.trim() : String(location).trim();
    if (!sanitizedLocation) {
      return res.status(400).json({ error: 'Location cannot be empty' });
    }
    if (sanitizedLocation.length > 500) {
      return res.status(400).json({ error: 'Location must be 500 characters or less' });
    }
    
    // Parse and validate budget
    let activityBudget = 0;
    if (budget !== undefined && budget !== null && budget !== '') {
      const budgetStr = String(budget).trim();
      if (budgetStr) {
        activityBudget = parseFloat(budgetStr);
        if (isNaN(activityBudget)) {
          return res.status(400).json({ error: 'Budget must be a valid number' });
        }
        if (activityBudget < 0) {
          return res.status(400).json({ error: 'Budget cannot be negative' });
        }
        if (activityBudget > 999999999) {
          return res.status(400).json({ error: 'Budget is too large (maximum: ₱999,999,999)' });
        }
      }
    }

    // Fetch trip to verify ownership and get startDate and budget
    let trips;
    try {
      trips = await sql`
        SELECT id, "startDate", budget
        FROM "Trip"
        WHERE id = ${tripIdRaw} AND "userId" = ${req.user.userId}
        LIMIT 1
      `;
    } catch (dbError) {
      console.error('❌ Database error fetching trip:', dbError);
      return res.status(500).json({ error: 'Failed to fetch trip information' });
    }

    if (trips.length === 0) {
      return res.status(404).json({ error: 'Trip not found or you do not have permission to add activities to this trip' });
    }

    const trip = trips[0];

    // Validate trip startDate exists
    if (!trip.startDate) {
      return res.status(400).json({ error: 'Trip start date is missing. Please update the trip first.' });
    }

    // Calculate remaining budget if activity has a budget
    if (activityBudget > 0) {
      try {
        // Parse trip budget (it's stored as a formatted string like "₱50,000" or a number)
        const tripBudgetStr = trip.budget || '0';
        const tripBudgetNum = parseFloat(String(tripBudgetStr).replace(/[₱$,]/g, '')) || 0;
        
        // Calculate total spent on activities for this trip
        const existingActivities = await sql`
          SELECT COALESCE(SUM(cost), 0) as total_spent
          FROM "Activity"
          WHERE "tripId" = ${tripIdStr}
        `;
        const totalSpent = parseFloat(existingActivities[0]?.total_spent || 0);
        const remainingBudget = tripBudgetNum - totalSpent;
        
        // Validate that activity budget doesn't exceed remaining budget
        if (activityBudget > remainingBudget) {
          return res.status(400).json({ 
            error: `Activity budget (₱${activityBudget.toLocaleString()}) exceeds remaining trip budget (₱${remainingBudget.toLocaleString()})`,
            remainingBudget: remainingBudget,
            totalBudget: tripBudgetNum,
            totalSpent: totalSpent
          });
        }
      } catch (budgetError) {
        console.error('❌ Error calculating budget:', budgetError);
        // Don't fail the request if budget calculation fails, just log it
        console.warn('⚠️ Continuing without budget validation due to calculation error');
      }
    }

    // Calculate startTime: combine trip startDate + day offset + time
    let startDate;
    try {
      startDate = new Date(trip.startDate);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ error: 'Trip start date is invalid. Please update the trip first.' });
      }
      
      // Add day offset (Day 1 = same day, Day 2 = +1 day, etc.)
      startDate.setDate(startDate.getDate() + (numericDay - 1));
      
      // Parse time string (format: HH:MM or HH:MM:SS)
      const timeParts = sanitizedTime.split(':');
      if (timeParts.length < 2) {
        return res.status(400).json({ error: 'Invalid time format. Use HH:MM format (e.g., 14:30)' });
      }
      
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      
      if (isNaN(hours) || isNaN(minutes)) {
        return res.status(400).json({ error: 'Invalid time format. Hours and minutes must be numbers.' });
      }
      
      if (hours < 0 || hours > 23) {
        return res.status(400).json({ error: 'Hours must be between 0 and 23' });
      }
      
      if (minutes < 0 || minutes > 59) {
        return res.status(400).json({ error: 'Minutes must be between 0 and 59' });
      }
      
      startDate.setHours(hours, minutes, 0, 0);
      
      // Validate the final date is valid
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date/time combination. Please check your day and time values.' });
      }
    } catch (dateError) {
      console.error('❌ Error calculating start date:', dateError);
      return res.status(400).json({ error: 'Failed to calculate activity start time. Please check your day and time values.' });
    }

    // Generate activity ID
    const activityId = randomUUID();

    // Insert activity into Activity table with cost
    let newActivity;
    try {
      newActivity = await sql`
        INSERT INTO "Activity" (id, title, location, "startTime", cost, "tripId", "createdAt", "updatedAt")
        VALUES (${activityId}, ${sanitizedActivity}, ${sanitizedLocation}, ${startDate.toISOString()}, ${activityBudget}, ${tripIdStr}, NOW(), NOW())
        RETURNING *
      `;
    } catch (dbError) {
      console.error('❌ Database error inserting activity:', dbError);
      console.error('❌ Error details:', dbError.message);
      console.error('❌ Activity data:', { activityId, sanitizedActivity, sanitizedLocation, startDate: startDate.toISOString(), activityBudget, tripIdStr });
      return res.status(500).json({ 
        error: 'Failed to create activity in database',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    if (newActivity.length === 0) {
      return res.status(500).json({ error: 'Failed to create activity in database' });
    }

    // Fetch updated trip with all activities
    const updatedTrip = await sql`
      SELECT id, title, destination, "startDate", "endDate", budget, companions, status, image, itinerary, "createdAt", "updatedAt"
      FROM "Trip"
      WHERE id = ${tripIdRaw} AND "userId" = ${req.user.userId}
      LIMIT 1
    `;

    if (updatedTrip.length === 0) {
      return res.status(404).json({ error: 'Trip not found after activity creation' });
    }

    // Fetch all activities for this trip to populate itinerary
    const activities = await sql`
      SELECT id, title, description, location, "startTime", "endTime", COALESCE(cost, 0) as cost, "tripId", "createdAt", "updatedAt"
      FROM "Activity"
      WHERE "tripId" = ${tripIdStr}
      ORDER BY "startTime" ASC
    `;

    // Convert activities to itinerary format for backward compatibility
    const itineraryItems = activities.map(act => {
      try {
        const actStartTime = act.startTime ? new Date(act.startTime) : null;
        const tripStartDate = updatedTrip[0].startDate ? new Date(updatedTrip[0].startDate) : new Date();
        
        // Calculate day number (1-indexed)
        let dayNum = 1;
        if (actStartTime && !isNaN(actStartTime.getTime())) {
          const diffTime = actStartTime.getTime() - tripStartDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          dayNum = Math.max(1, diffDays + 1);
        }

        // Format time as HH:MM
        const timeStr = actStartTime && !isNaN(actStartTime.getTime())
          ? `${String(actStartTime.getHours()).padStart(2, '0')}:${String(actStartTime.getMinutes()).padStart(2, '0')}`
          : '';

        const activityCost = act.cost != null ? parseFloat(act.cost) : 0;
        return {
          id: act.id,
          day: dayNum,
          time: timeStr,
          activity: act.title || '',
          location: act.location || '',
          budget: isNaN(activityCost) ? 0 : activityCost,
          createdAt: act.createdAt ? new Date(act.createdAt).toISOString() : new Date().toISOString(),
        };
      } catch (actError) {
        console.warn('⚠️ Error processing activity:', actError, 'Activity:', act);
        return null;
      }
    }).filter(item => item !== null);

    // Calculate budget information for response
    const tripBudgetStr = updatedTrip[0].budget || '0';
    const tripBudgetNum = parseFloat(String(tripBudgetStr).replace(/[₱$,]/g, '')) || 0;
    const totalSpent = activities.reduce((sum, act) => {
      try {
        const cost = act.cost != null ? parseFloat(act.cost) : 0;
        return sum + (isNaN(cost) ? 0 : cost);
      } catch (costError) {
        console.warn('⚠️ Error parsing activity cost:', costError);
        return sum;
      }
    }, 0);
    const remainingBudget = tripBudgetNum - totalSpent;

    const tripWithActivities = {
      ...normalizeTripRecord(updatedTrip[0]),
      itinerary: itineraryItems,
      remainingBudget: remainingBudget,
      totalSpent: totalSpent,
    };

    console.log('✅ Activity created successfully:', activityId);
    console.log('💰 Budget update - Total:', tripBudgetNum, 'Spent:', totalSpent, 'Remaining:', remainingBudget);
    res.status(201).json({ trip: tripWithActivities });
  } catch (error) {
    console.error('❌ Error adding trip activity:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Request body:', JSON.stringify(req.body));
    console.error('❌ Trip ID:', req.params.id);
    
    // Return appropriate status code based on error type
    const statusCode = error.message && (
      error.message.includes('not found') || 
      error.message.includes('permission')
    ) ? 404 : 500;
    
    res.status(statusCode).json({ 
      error: error.message || 'Failed to add activity',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.delete('/api/trips/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ DELETE trip request');
    console.log('Trip ID:', id, 'Type:', typeof id);
    console.log('User ID:', req.user.userId);
    
    // Convert id to number for SERIAL column
    const tripId = tripIdUsesText ? id : parseInt(id);
    if (!tripIdUsesText && isNaN(tripId)) {
      console.log('❌ Invalid trip ID for deletion:', id);
      return res.status(400).json({ error: 'Invalid trip ID' });
    }
    
    console.log('Converted Trip ID:', tripId, 'Type:', typeof tripId);
    
    const trip = await sql`
      DELETE FROM "Trip"
      WHERE id = ${tripId} AND "userId" = ${req.user.userId}
      RETURNING *
    `;
    
    console.log('Delete result:', trip);
    
    if (trip.length === 0) {
      console.log('❌ Trip not found for deletion');
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    console.log('✅ Trip deleted successfully');
    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting trip:', error);
    res.status(400).json({ error: error.message });
  }
});

// PHOTOS CRUD OPERATIONS
app.get('/api/photos', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching photos for userId:', req.user.userId);
    const photos = await sql`
      SELECT id, "destinationId", url, caption, rating, "dateAdded", title, "createdAt", "updatedAt"
      FROM "Photo"
      WHERE "userId" = ${req.user.userId}
      ORDER BY "dateAdded" DESC, "createdAt" DESC
    `;

    const destinationRows = await sql`
      SELECT id, name
      FROM "Destination"
      WHERE "userId" = ${req.user.userId}
    `;

    const destinationMap = new Map(destinationRows.map(dest => [dest.id?.toString(), dest.name]));
    const normalizedPhotos = photos.map(photo => ({
      ...photo,
      destinationName: photo.destinationId != null
        ? destinationMap.get(photo.destinationId.toString()) || null
        : null
    }));

    console.log('📊 Found photos:', normalizedPhotos.length);
    res.json(normalizedPhotos);
  } catch (error) {
    const errorMessage = logPhotoError('GET /api/photos', error);
    console.error('❌ Error fetching photos:', error);
    res.status(400).json({ error: errorMessage || 'Failed to load photos' });
  }
});

app.post('/api/photos', authenticateToken, async (req, res) => {
  try {
    const { destinationId, url, caption, rating, title } = req.body;
    
    console.log('🆕 Creating photo for userId:', req.user.userId);
    console.log('📝 Photo data:', { destinationId, url, userId: req.user.userId });

    const destinationIdValue =
      destinationId === undefined || destinationId === null || destinationId === ''
        ? null
        : Number(destinationId);
    
    if (destinationIdValue !== null && Number.isNaN(destinationIdValue)) {
      return res.status(400).json({ error: 'Invalid destinationId' });
    }

    const sanitizedUrl = typeof url === 'string' ? url.trim() : '';
    const sanitizedCaption = typeof caption === 'string' ? caption.trim() : '';
    const ratingNumber = Number(rating);
    const normalizedRating = Number.isFinite(ratingNumber)
      ? Math.min(5, Math.max(1, Math.round(ratingNumber)))
      : NaN;
    const titleValue = (typeof title === 'string' ? title.trim() : '') || sanitizedCaption || 'Untitled Photo';

    if (!sanitizedUrl) {
      return res.status(400).json({ error: 'Photo URL is required' });
    }

    if (!sanitizedCaption) {
      return res.status(400).json({ error: 'Caption is required' });
    }

    if (Number.isNaN(normalizedRating)) {
      return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
    }
    
    const photo = await sql`
      INSERT INTO "Photo" ("destinationId", url, caption, rating, title, "userId")
      VALUES (${destinationIdValue}, ${sanitizedUrl}, ${sanitizedCaption}, ${normalizedRating}, ${titleValue}, ${req.user.userId})
      RETURNING *
    `;
    
    console.log('✅ Photo created:', photo[0]);
    res.status(201).json(photo[0]);
  } catch (error) {
    const errorMessage = logPhotoError('POST /api/photos', error);
    console.error('❌ Error creating photo:', error);
    res.status(400).json({ error: errorMessage });
  }
});

app.put('/api/photos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { destinationId, url, caption, rating, title } = req.body;
    
    const photo = await sql`
      UPDATE "Photo"
      SET "destinationId" = ${destinationId}, url = ${url}, caption = ${caption}, 
          rating = ${rating}, title = ${title}, "updatedAt" = NOW()
      WHERE id = ${id} AND "userId" = ${req.user.userId}
      RETURNING *
    `;
    
    if (photo.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    res.json(photo[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/photos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const photo = await sql`
      DELETE FROM "Photo"
      WHERE id = ${id} AND "userId" = ${req.user.userId}
      RETURNING *
    `;
    
    if (photo.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get reports and analytics
app.get('/api/reports/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = 'year' } = req.query;

    // Verify user access
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log('📊 Generating reports for user:', userId, 'timeframe:', timeframe);

    // Calculate date range based on timeframe
    let dateFilter = null;
    const now = new Date();
    if (timeframe === 'month') {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeframe === 'year') {
      dateFilter = new Date(now.getFullYear(), 0, 1);
    }

    // Get destinations statistics
    const destinations = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE visited = true) as visited,
        AVG(rating) as avg_rating,
        category
      FROM "Destination"
      WHERE "userId" = ${userId}
      GROUP BY category
    `;

    const allDestinations = await sql`
      SELECT id, name, location, category, rating, visited, "createdAt"
      FROM "Destination"
      WHERE "userId" = ${userId}
    `;
    
    // Filter destinations by timeframe if specified (based on creation date)
    let filteredDestinations = allDestinations;
    if (dateFilter) {
      filteredDestinations = allDestinations.filter(d => {
        const destDate = new Date(d.createdAt);
        return destDate >= dateFilter;
      });
    }

    // Use filtered destinations for calculations if timeframe is set
    const destinationsForStats = dateFilter ? filteredDestinations : allDestinations;
    const totalDestinations = destinationsForStats.length;
    const visitedDestinations = destinationsForStats.filter(d => d.visited).length;
    const visitProgress = totalDestinations > 0 ? Math.round((visitedDestinations / totalDestinations) * 100) : 0;
    const avgRating = destinationsForStats.length > 0
      ? (destinationsForStats.reduce((sum, d) => sum + parseFloat(d.rating || 0), 0) / destinationsForStats.length).toFixed(1)
      : '0.0';

    // Get trips statistics
    let trips;
    if (dateFilter) {
      trips = await sql`
        SELECT 
          id,
          title,
          destination,
          budget,
          status,
          "startDate",
          "endDate",
          "createdAt"
        FROM "Trip"
        WHERE "userId" = ${userId}
          AND "createdAt" >= ${dateFilter}
        ORDER BY "createdAt" DESC
      `;
    } else {
      trips = await sql`
        SELECT 
          id,
          title,
          destination,
          budget,
          status,
          "startDate",
          "endDate",
          "createdAt"
        FROM "Trip"
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC
      `;
    }

    const completedTrips = trips.filter(t => t.status === 'completed').length;
    const upcomingTrips = trips.filter(t => t.status === 'upcoming').length;
    const tripProgress = trips.length > 0 ? Math.round((completedTrips / trips.length) * 100) : 0;

    // Calculate total budget
    const totalBudget = trips.reduce((sum, trip) => {
      const budget = parseBudgetInput(trip.budget);
      return sum + budget;
    }, 0);

    // Get monthly trips data based on timeframe
    let monthlyTripsData;
    let monthlyTrips;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (timeframe === 'month') {
      // For current month, show weeks
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      monthlyTripsData = await sql`
        SELECT 
          EXTRACT(DAY FROM "createdAt")::int as day_num,
          COUNT(*)::int as trips
        FROM "Trip"
        WHERE "userId" = ${userId}
          AND "createdAt" >= ${startOfMonth}
        GROUP BY EXTRACT(DAY FROM "createdAt")
        ORDER BY day_num
      `;
      
      // For month view, show weeks
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      monthlyTrips = Array.from({ length: 4 }, (_, i) => {
        const weekStart = i * 7 + 1;
        const weekEnd = Math.min((i + 1) * 7, daysInMonth);
        const weekTrips = monthlyTripsData
          .filter(m => m.day_num >= weekStart && m.day_num <= weekEnd)
          .reduce((sum, m) => sum + parseInt(m.trips), 0);
        return {
          month: `W${i + 1}`,
          trips: weekTrips,
        };
      });
    } else if (timeframe === 'year') {
      // For current year, show months
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      monthlyTripsData = await sql`
        SELECT 
          EXTRACT(MONTH FROM "createdAt")::int as month_num,
          COUNT(*)::int as trips
        FROM "Trip"
        WHERE "userId" = ${userId}
          AND "createdAt" >= ${startOfYear}
        GROUP BY EXTRACT(MONTH FROM "createdAt")
        ORDER BY month_num
      `;
      
      monthlyTrips = monthNames.map((month, index) => {
        const monthNum = index + 1;
        const found = monthlyTripsData.find(m => m.month_num === monthNum);
        return {
          month,
          trips: found ? parseInt(found.trips) : 0,
        };
      });
    } else {
      // For all time, show months aggregated across all years
      monthlyTripsData = await sql`
        SELECT 
          EXTRACT(MONTH FROM "createdAt")::int as month_num,
          COUNT(*)::int as trips
        FROM "Trip"
        WHERE "userId" = ${userId}
        GROUP BY EXTRACT(MONTH FROM "createdAt")
        ORDER BY month_num
      `;
      
      monthlyTrips = monthNames.map((month, index) => {
        const monthNum = index + 1;
        const found = monthlyTripsData.find(m => m.month_num === monthNum);
        return {
          month,
          trips: found ? parseInt(found.trips) : 0,
        };
      });
    }

    // Get category breakdown from filtered destinations
    const categoryGroups = {};
    destinationsForStats.forEach(dest => {
      const cat = dest.category || 'Uncategorized';
      categoryGroups[cat] = (categoryGroups[cat] || 0) + 1;
    });

    // Get photos statistics (filtered by timeframe if applicable)
    let photos;
    if (dateFilter) {
      photos = await sql`
        SELECT id, "destinationId", rating
        FROM "Photo"
        WHERE "userId" = ${userId}
          AND "createdAt" >= ${dateFilter}
      `;
    } else {
      photos = await sql`
        SELECT id, "destinationId", rating
        FROM "Photo"
        WHERE "userId" = ${userId}
      `;
    }

    // Get top destinations by rating (from filtered destinations)
    const topDestinations = destinationsForStats
      .sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0))
      .slice(0, 3)
      .map(dest => ({
        name: dest.name,
        location: dest.location,
        rating: parseFloat(dest.rating || 0),
      }));

    // Get unique locations (from filtered destinations)
    const uniqueLocations = new Set(destinationsForStats.map(d => d.location)).size;

    // Calculate achievements with real-time progress
    const achievements = [
      {
        title: 'First Trip',
        description: completedTrips >= 1 ? 'Completed your first journey' : 'Complete your first trip',
        earned: completedTrips >= 1,
        progress: Math.min(completedTrips, 1),
        maxProgress: 1,
      },
      {
        title: 'Explorer',
        description: visitedDestinations >= 5 
          ? `Visited ${visitedDestinations} destinations` 
          : `Visited ${visitedDestinations}/5 destinations`,
        earned: visitedDestinations >= 5,
        progress: visitedDestinations,
        maxProgress: 5,
      },
      {
        title: 'Photographer',
        description: photos.length >= 10 
          ? `Captured ${photos.length} photos` 
          : `Captured ${photos.length}/10 photos`,
        earned: photos.length >= 10,
        progress: photos.length,
        maxProgress: 10,
      },
      {
        title: 'Frequent Traveler',
        description: completedTrips >= 10 
          ? `Completed ${completedTrips} trips` 
          : `Complete 10 trips (${completedTrips}/10)`,
        earned: completedTrips >= 10,
        progress: completedTrips,
        maxProgress: 10,
      },
      {
        title: 'World Explorer',
        description: uniqueLocations >= 10 
          ? `Explored ${uniqueLocations} unique locations` 
          : `Explore 10 unique locations (${uniqueLocations}/10)`,
        earned: uniqueLocations >= 10,
        progress: uniqueLocations,
        maxProgress: 10,
      },
      {
        title: 'Budget Master',
        description: totalBudget >= 100000 
          ? `Spent ₱${(totalBudget / 1000).toFixed(0)}k on travels` 
          : `Spend ₱100k on travels (₱${(totalBudget / 1000).toFixed(0)}k/₱100k)`,
        earned: totalBudget >= 100000,
        progress: totalBudget,
        maxProgress: 100000,
      },
      {
        title: 'Bucket List Champion',
        description: visitProgress >= 100 
          ? `Visited 100% of your bucket list` 
          : `Visit all destinations (${visitProgress}%)`,
        earned: visitProgress >= 100 && totalDestinations > 0,
        progress: visitProgress,
        maxProgress: 100,
      },
      {
        title: 'Photo Enthusiast',
        description: photos.length >= 50 
          ? `Captured ${photos.length} amazing photos` 
          : `Capture 50 photos (${photos.length}/50)`,
        earned: photos.length >= 50,
        progress: photos.length,
        maxProgress: 50,
      },
    ];

    // Prepare response
    const reportData = {
      insights: [
        {
          title: 'Destinations Visited',
          value: `${visitedDestinations} / ${totalDestinations}`,
          description: totalDestinations > 0 
            ? `You've explored ${visitProgress}% of your bucket list`
            : 'Start adding destinations to your bucket list',
          progress: visitProgress,
        },
        {
          title: 'Trips Completed',
          value: completedTrips.toString(),
          description: upcomingTrips > 0
            ? `${upcomingTrips} more trip${upcomingTrips !== 1 ? 's' : ''} planned`
            : trips.length === 0
              ? 'No trips yet'
              : 'All trips completed!',
          progress: tripProgress,
        },
        {
          title: 'Total Budget',
          value: `₱${totalBudget.toLocaleString()}`,
          description: trips.length > 0 ? 'Across all trips' : 'No budget set yet',
          progress: 100,
        },
      ],
      monthlyTrips,
      categoryData: Object.entries(categoryGroups).map(([name, count]) => ({
        name,
        count,
      })),
      topDestinations,
      achievements,
      summary: {
        totalTrips: trips.length,
        uniqueLocations,
        photosCaptured: photos.length,
        avgRating,
      },
    };

    console.log('✅ Reports generated successfully');
    res.json(reportData);
  } catch (error) {
    console.error('❌ Get reports error:', error);
    res.status(400).json({ error: error.message || 'Failed to generate reports' });
  }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('🧪 Testing database connection...');
    const result = await sql`SELECT NOW() as current_time, version() as version`;
    console.log('✅ Database test result:', result[0]);
    
    // Test table creation
    const tableTest = await sql`
      SELECT COUNT(*) as trip_count FROM "Trip"
    `;
    console.log('📊 Trip count:', tableTest[0]);
    
    res.json({
      success: true,
      database_time: result[0].current_time,
      version: result[0].version,
      trip_count: tableTest[0].trip_count
    });
  } catch (error) {
    console.error('❌ Database test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test endpoint to verify server is running our code
app.get('/api/debug/test', (req, res) => {
  console.log('🧪 Test endpoint hit at:', new Date().toISOString());
  res.json({ 
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    serverVersion: 'enhanced-debug-v1'
  });
});

// View database snapshot (for development only)
app.get('/api/debug/data', async (req, res) => {
  try {
    const dbUsers = await sql`
      SELECT id, email, "firstName", "lastName", "createdAt"
      FROM "User"
      ORDER BY "createdAt" DESC
    `;

    const allDestinations = await sql`
      SELECT id, name, "userId", "createdAt"
      FROM "Destination"
      ORDER BY "createdAt" DESC
    `;

    const allTrips = await sql`
      SELECT id, title, "userId", "createdAt"
      FROM "Trip"
      ORDER BY "createdAt" DESC
    `;

    const allPhotos = await sql`
      SELECT id, title, "userId", "createdAt"
      FROM "Photo"
      ORDER BY "createdAt" DESC
    `;

    // Check for trips with null or empty userId
    const tripsWithNullUser = await sql`
      SELECT id, title, "userId"
      FROM "Trip"
      WHERE "userId" IS NULL OR "userId" = ''
    `;

    res.json({
      users: dbUsers,
      destinations: allDestinations,
      trips: allTrips,
      photos: allPhotos,
      tripsWithNullUser: tripsWithNullUser,
      userCount: dbUsers.length,
      destinationCount: allDestinations.length,
      tripCount: allTrips.length,
      photoCount: allPhotos.length,
      nullUserTripCount: tripsWithNullUser.length
    });
  } catch (error) {
    console.error('❌ Debug data fetch failed:', error);
    res.status(500).json({ error: 'Failed to load debug data' });
  }
});

// Check database connection and data
app.get('/api/debug/database', async (req, res) => {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const connectionTest = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database connection test:', connectionTest);
    
    // Check table exists
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'Trip'
    `;
    console.log('📋 Trip table exists:', tableCheck);
    
    // Count all trips
    const tripCount = await sql`SELECT COUNT(*) as count FROM "Trip"`;
    console.log('📊 Total trips in database:', tripCount);
    
    // Get all trips
    const allTrips = await sql`SELECT * FROM "Trip" ORDER BY "createdAt" DESC`;
    console.log('📋 All trips in database:', allTrips);
    
    res.json({
      connection: connectionTest[0],
      tableExists: tableCheck.length > 0,
      tripCount: tripCount[0].count,
      allTrips: allTrips,
      message: 'Database debug info'
    });
  } catch (error) {
    console.error('❌ Database debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clean up orphaned data (development only)
app.post('/api/debug/cleanup', async (req, res) => {
  try {
    // Delete trips without valid userId
    const deletedTrips = await sql`
      DELETE FROM "Trip"
      WHERE "userId" IS NULL OR "userId" = '' OR "userId" NOT IN (SELECT id FROM "User")
    `;

    // Delete destinations without valid userId
    const deletedDestinations = await sql`
      DELETE FROM "Destination"
      WHERE "userId" IS NULL OR "userId" = '' OR "userId" NOT IN (SELECT id FROM "User")
    `;

    // Delete photos without valid userId
    const deletedPhotos = await sql`
      DELETE FROM "Photo"
      WHERE "userId" IS NULL OR "userId" = '' OR "userId" NOT IN (SELECT id FROM "User")
    `;

    // Delete photos without valid destinationId
    const deletedOrphanedPhotos = await sql`
      DELETE FROM "Photo"
      WHERE "destinationId" NOT IN (SELECT id FROM "Destination")
    `;

    res.json({
      deletedTrips: deletedTrips.count,
      deletedDestinations: deletedDestinations.count,
      deletedPhotos: deletedPhotos.count,
      deletedOrphanedPhotos: deletedOrphanedPhotos.count,
      message: 'Cleanup completed'
    });
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

// TEST GEMINI API CONNECTION ENDPOINT (for debugging - no auth required for testing)
app.get('/api/test-gemini', async (req, res) => {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    
    const maskedKey = GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...${GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 4)}` : 'NOT SET';
    const keySource = process.env.GEMINI_API_KEY ? 'environment variable (.env)' : 'NOT SET';
    
    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim().length === 0) {
      return res.status(500).json({ 
        success: false,
        error: 'API key is missing or empty',
        keySource: 'none'
      });
    }
    
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
      
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say hello in one word' }] }]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
      
      return res.json({
        success: true,
        message: 'Gemini API is connected and working!',
        apiKey: maskedKey,
        keySource: keySource,
        model: GEMINI_MODEL,
        testResponse: text.substring(0, 200),
        timestamp: new Date().toISOString()
      });
    } catch (apiError) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API call failed',
        apiKey: maskedKey,
        keySource: keySource,
        details: apiError?.message || 'Unknown error',
        errorType: apiError?.name || 'Unknown'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Test endpoint error',
      details: error?.message || 'Unknown error'
    });
  }
});

// ============================================================
// HEALTH CHECK ENDPOINT (for online/offline status)
// ============================================================
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'online', 
    timestamp: new Date().toISOString(),
    service: 'AI Destination Finder'
  });
});

// ============================================================
// AI-POWERED SEARCH ENDPOINT
// ============================================================
app.post('/api/ai-search', authenticateToken, async (req, res) => {
  try {
    const { textQuery } = req.body;

    if (!textQuery || typeof textQuery !== 'string' || textQuery.trim().length === 0) {
      return res.status(400).json({ error: 'textQuery is required and must be a non-empty string' });
    }

    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.userId;

    // Initialize Gemini API
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    
    // Log API key status (masked for security)
    const maskedKey = GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...${GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 4)}` : 'NOT SET';
    const keySource = process.env.GEMINI_API_KEY ? 'environment variable (.env)' : 'NOT SET';
    console.log(`🔑 [Gemini API] Using API key: ${maskedKey} (from ${keySource})`);
    console.log(`🔑 [Gemini API] Model: ${GEMINI_MODEL}`);
    
    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim().length === 0) {
      console.error('❌ [Gemini API] ERROR: API key is missing or empty!');
      console.error('❌ [Gemini API] Please set GEMINI_API_KEY in your .env file');
      return res.status(500).json({ 
        error: 'AI service configuration error',
        details: 'Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file.'
      });
    }
    
    // Declare variables outside try block so they're accessible after
    let searchMode = 'internal';
    let llmResponse = null;
    
    try {
      console.log(`✅ [Gemini API] Using model: ${GEMINI_MODEL}`);

    // ULTIMATE SYSTEM PROMPT - Highly Intelligent Travel AI
    const SYSTEM_PROMPT = `You are TravelGenius AI - a world-class travel expert and destination curator with deep knowledge of global destinations, viral travel trends, hidden gems, and local secrets. You're enthusiastic, knowledgeable, and genuinely passionate about helping people discover amazing places!

🌟 YOUR PERSONALITY:
- Enthusiastic and inspiring - you LOVE travel!
- Knowledgeable like a seasoned travel blogger
- Friendly and conversational - like chatting with a well-traveled friend
- Detail-oriented - you provide rich, actionable information
- Trend-aware - you know what's viral on TikTok, Instagram, YouTube

🎯 CORE CAPABILITIES:

1. TRENDING DESTINATIONS (TikTok/Instagram/Viral)
When users ask about trending, viral, popular, or social media destinations:
- Provide 6-8 stunning destinations with DETAILED descriptions
- Include WHY it's trending and what makes it special
- Add insider tips, best times to visit, and photo spots
- Reference actual viral trends and hashtags

2. DESTINATION SEARCH
When users search for specific types of places:
- Understand intent even from vague queries
- Extract useful search filters
- Be smart about categorization

3. CONVERSATIONAL RESPONSES
For greetings and casual chat:
- Be warm and engaging
- Vary your responses (never repeat the same greeting)
- Always guide toward helping them discover destinations

4. RESPONSE QUALITY RULES:
✅ DO:
- Write vivid, exciting descriptions that inspire wanderlust
- Include specific details (best seasons, local tips, photo spots)
- Use emoji sparingly for emphasis 🌴✨
- Be genuinely helpful and informative

❌ NEVER:
- Give generic, boring responses
- Apologize for queries
- Mention technical errors
- Use robotic language
- Repeat yourself

5. JSON RESPONSE FORMAT:
All search responses must be valid JSON only. No markdown, no code blocks.
For trending: {"destinations": [...]}
For filters: {"category": "...", "locationContains": "...", "minRating": ..., "tags": [...]}

Remember: You're not just an AI - you're their personal travel curator who's genuinely excited to help them discover their next adventure!`;

    // Check if this is a request for trending/TikTok destinations
    const isTrendingSearch = textQuery.toLowerCase().includes('trending') || 
                            textQuery.toLowerCase().includes('tiktok') ||
                            textQuery.toLowerCase().includes('viral') ||
                            textQuery.toLowerCase().includes('popular') ||
                            textQuery.toLowerCase().includes('social media') ||
                            textQuery.toLowerCase().includes('discover');

    let prompt;

    if (isTrendingSearch) {
      // Mode: Fetch trending/TikTok destinations from AI
      searchMode = 'trending';
      prompt = `You are an expert travel curator and social media trend analyst. You have extensive knowledge of viral travel destinations trending on TikTok, Instagram, YouTube, and other platforms.

User Query: "${textQuery}"

🎯 YOUR MISSION: Suggest 6-8 absolutely stunning, trending travel destinations that are currently going viral on social media. Make each suggestion feel exciting and irresistible!

For each destination, provide DETAILED information:

1. **name**: Full destination name (e.g., "Cappadocia Hot Air Balloons, Turkey")
2. **location**: City/Region, Country (e.g., "Cappadocia, Turkey")
3. **description**: Write a DETAILED, captivating description (4-6 sentences) that includes:
   - Why it's currently trending/viral
   - The unique experience visitors can expect
   - Best time to visit or insider tips
   - What makes it Instagram/TikTok-worthy
   - Any famous influencers or creators who featured it
4. **imageUrl**: Use format: https://source.unsplash.com/600x400/?[destination-keywords]
5. **category**: One of "Museum", "Resort", "Restaurant", "Nature", "Attraction", "Adventure", "Cultural"
6. **sourcePlatform**: "TikTok", "Instagram", "YouTube", or "Trending"
7. **sourceUrl**: Realistic platform URL (e.g., "https://tiktok.com/@wanderlust/video/7234567890")
8. **sourceId**: Unique ID (e.g., "tiktok_wanderlust_7234567890")
9. **hashtags**: 5-7 trending hashtags including destination-specific and general travel tags
10. **rating**: A rating between 4.5 and 5.0 based on popularity

Make your descriptions VIVID and EXCITING! Use descriptive language that makes people want to book a flight immediately!

RESPOND WITH ONLY VALID JSON in this exact format:
{
  "destinations": [
    {
      "name": "Cappadocia Hot Air Balloons, Turkey",
      "location": "Cappadocia, Turkey",
      "description": "Wake up before dawn to witness hundreds of colorful hot air balloons rising over the surreal fairy chimneys and ancient cave dwellings of Cappadocia. This magical experience has taken TikTok by storm with over 2 billion views on #Cappadocia content. The otherworldly landscape of volcanic rock formations creates the most dreamy backdrop for photos. Pro tip: Book a sunrise balloon ride for the most magical lighting and fewer crowds. Influencers like @doyoutravel and @gypsea_lust have featured this destination, making it a bucket-list must!",
      "imageUrl": "https://source.unsplash.com/600x400/?cappadocia,balloon",
      "category": "Adventure",
      "sourcePlatform": "TikTok",
      "sourceUrl": "https://tiktok.com/@wanderlust/video/7234567890",
      "sourceId": "tiktok_wanderlust_7234567890",
      "hashtags": ["#cappadocia", "#turkey", "#hotairballoon", "#bucketlist", "#travelgoals", "#sunrise", "#dreamdestination"],
      "rating": 4.9
    }
  ]
}

Now create amazing, detailed destination suggestions!`;
    } else {
      // Mode: Search internal database with filters
      searchMode = 'internal';
      prompt = `You are a smart travel search assistant helping users find destinations from their saved collection.

User Query: "${textQuery}"

🎯 YOUR TASK: Analyze the user's search query and extract structured filters to find the best matching destinations.

Extract these filters from the query:
- **category**: Type of destination (must be one of: "Museum", "Resort", "Restaurant", "Nature", "Attraction", "Adventure", "Cultural" or null if not clear)
- **locationContains**: Any location/city/country mentioned (or null)
- **minRating**: If user mentions "best", "top rated", "highly rated" → use 4.0; if "good" → use 3.5 (or null)
- **tags**: Array of descriptive keywords from the query that could match destination descriptions

Be smart about interpreting intent:
- "romantic spots" → tags: ["romantic", "couples", "honeymoon"]
- "family friendly" → tags: ["family", "kids", "safe"]
- "adventure" → category: "Adventure", tags: ["adventure", "outdoor", "extreme"]
- "foodie paradise" → category: "Restaurant", tags: ["food", "cuisine", "culinary"]

RESPOND WITH ONLY VALID JSON:
{"category": "Resort", "locationContains": "Bali", "minRating": 4.0, "tags": ["beach", "relaxation"]}

Examples:
- "Find museums in Paris" -> {"category":"Museum","locationContains":"Paris","minRating":null,"tags":null}
- "Show me highly rated restaurants" -> {"category":"Restaurant","locationContains":null,"minRating":4.0,"tags":null}
- "Nature spots with good ratings" -> {"category":"Nature","locationContains":null,"minRating":4.0,"tags":null}
- "Places in Tokyo" -> {"category":null,"locationContains":"Tokyo","minRating":null,"tags":null}

Now analyze the user query and return ONLY the JSON object:`;
    }

      try {
        console.log(`🤖 [Gemini API] Calling API (mode: ${searchMode}) with query:`, textQuery);
        console.log(`📤 [Gemini API] Request payload length: ${prompt.length} characters`);
        
        // Call Gemini API using fetch
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
        
        const geminiPayload = {
          contents: [{
            parts: [{
              text: `${SYSTEM_PROMPT}\n\n${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2000,
            responseMimeType: "application/json"
          }
        };
        
        // Retry logic with exponential backoff
        let geminiResponse;
        let lastError;
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const fetchResponse = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(geminiPayload)
            });
            
            if (!fetchResponse.ok) {
              const errorData = await fetchResponse.json();
              throw new Error(errorData.error?.message || `HTTP ${fetchResponse.status}`);
            }
            
            geminiResponse = await fetchResponse.json();
            break; // Success
          } catch (apiError) {
            lastError = apiError;
            console.log(`⚠️ [Gemini API] Attempt ${attempt}/${maxRetries} failed:`, apiError?.message);
            
            if (apiError?.message?.includes('429') || apiError?.message?.includes('rate') || apiError?.message?.includes('quota')) {
              if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000;
                console.log(`⏳ [Gemini API] Rate limited. Waiting ${delay/1000}s before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            } else {
              throw apiError;
            }
          }
        }
        
        if (!geminiResponse) {
          throw lastError || new Error('Failed to get response from Gemini after retries');
        }
        
        const text = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        console.log('✅ [Gemini API] Successfully received response');
        console.log('📝 [Gemini API] Raw response length:', text.length, 'characters');
        console.log('📝 [Gemini API] Raw response preview:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
      
      // Parse JSON response - handle markdown code blocks if present
      let jsonText = text.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }
      
      // Clean up any leading/trailing whitespace or newlines
      jsonText = jsonText.trim();
      
      // Parse the JSON
      try {
        llmResponse = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('❌ Failed to parse Gemini JSON response:', parseError);
        console.error('Response text:', jsonText);
        // Fallback: try to extract JSON from the response
        if (searchMode === 'trending') {
          const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            llmResponse = JSON.parse(arrayMatch[0]);
          } else {
            llmResponse = [];
          }
        } else {
          const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            llmResponse = JSON.parse(jsonMatch[0]);
          } else {
            llmResponse = {
              category: null,
              locationContains: null,
              minRating: null,
              tags: null,
            };
          }
        }
      }
      
        // For trending mode, extract destinations array if it's wrapped in an object
        if (searchMode === 'trending' && llmResponse && typeof llmResponse === 'object' && !Array.isArray(llmResponse) && llmResponse.destinations) {
          llmResponse = llmResponse.destinations;
        }
        
        console.log('✅ [Gemini API] Parsed LLM response successfully:', {
          type: Array.isArray(llmResponse) ? 'array' : typeof llmResponse,
          length: Array.isArray(llmResponse) ? llmResponse.length : Object.keys(llmResponse || {}).length
        });
      } catch (error) {
        console.error('❌ [Gemini API] Error calling API:', error);
        console.error('❌ [Gemini API] Error name:', error?.name);
        console.error('❌ [Gemini API] Error message:', error?.message);
        
        // Check for specific Gemini API errors
        if (error?.message?.includes('API key') || error?.message?.includes('authentication') || error?.message?.includes('401')) {
          console.error('❌ [Gemini API] API KEY ERROR: Invalid or missing API key!');
          return res.status(500).json({ 
            error: 'AI service authentication failed',
            details: 'Invalid Gemini API key. Please check your API key configuration.'
          });
        }
        
        if (error?.message?.includes('quota') || error?.message?.includes('rate') || error?.message?.includes('429')) {
          console.error('❌ [Gemini API] QUOTA ERROR: API quota exceeded or rate limited!');
          return res.status(429).json({ 
            error: 'AI service quota exceeded',
            details: 'Gemini API quota has been exceeded. Please try again later.'
          });
        }
        
        // Re-throw to be caught by outer catch
        throw error;
      }
    } catch (initError) {
      // This catch handles initialization errors
      console.error('❌ [Gemini API] Initialization or execution error:', initError);
      console.error('❌ [Gemini API] Error details:', {
        message: initError?.message,
        name: initError?.name
      });
      return res.status(500).json({ 
        error: 'AI service error',
        details: initError?.message || 'Failed to process AI request'
      });
    }

    // Handle different response types based on search mode
    if (searchMode === 'trending') {
      // Trending mode: Return AI-suggested destinations
      const trendingDestinations = Array.isArray(llmResponse) ? llmResponse : [];
      
      // Normalize and validate trending destinations
      const normalizedTrending = trendingDestinations
        .filter((dest) => dest && dest.name && dest.location)
        .map((dest, index) => ({
          id: `trending_${Date.now()}_${index}`, // Temporary ID for frontend
          name: dest.name || 'Unknown Destination',
          location: dest.location || 'Unknown Location',
          category: dest.category || 'Attraction',
          description: dest.description || '',
          image: dest.imageUrl || dest.image || 'https://source.unsplash.com/400x300/?travel',
          rating: typeof dest.rating === 'number' ? dest.rating : 4.5,
          visited: false,
          isExternal: true,
          externalSourceId: dest.sourceId || `external_${Date.now()}_${index}`,
          externalSourcePlatform: dest.sourcePlatform || 'Trending',
          externalSourceUrl: dest.sourceUrl || '',
          hashtags: Array.isArray(dest.hashtags) ? dest.hashtags : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

      return res.json({
        searchMode: 'trending',
        aiFilters: null,
        results: normalizedTrending,
      });
    } else {
      // Internal mode: Search user's database with filters
      const aiFilters = {
        category:
          (llmResponse.category && typeof llmResponse.category === 'string' && llmResponse.category.trim() && llmResponse.category !== 'null')
            ? llmResponse.category.trim()
            : undefined,
        locationContains:
          (llmResponse.locationContains && typeof llmResponse.locationContains === 'string' && llmResponse.locationContains.trim() && llmResponse.locationContains !== 'null')
            ? llmResponse.locationContains.trim()
            : undefined,
        minRating:
          (llmResponse.minRating !== null && llmResponse.minRating !== undefined && typeof llmResponse.minRating === 'number' &&
          !isNaN(llmResponse.minRating) &&
          llmResponse.minRating >= 0 &&
          llmResponse.minRating <= 5)
            ? llmResponse.minRating
            : undefined,
        tags:
          (Array.isArray(llmResponse.tags) && llmResponse.tags.length > 0)
            ? llmResponse.tags.filter((tag) => tag !== null && tag !== undefined && typeof tag === 'string' && tag.trim() && tag !== 'null').map((tag) => tag.trim())
            : undefined,
      };
      
      console.log('🎯 Extracted filters:', aiFilters);

      // Fetch from user's database
      let allResults = await sql`
        SELECT id, name, location, category, description, image, rating, visited, "createdAt", "updatedAt", 
               "isExternal", "externalSourceId", "externalSourcePlatform", "externalSourceUrl"
        FROM "Destination"
        WHERE "userId" = ${userId}
        ORDER BY rating DESC, "createdAt" DESC
      `;

      // Apply filters in memory
      let results = allResults.filter((dest) => {
        if (aiFilters.category && dest.category !== aiFilters.category) return false;
        if (aiFilters.locationContains && !dest.location.toLowerCase().includes(aiFilters.locationContains.toLowerCase())) return false;
        if (aiFilters.minRating !== undefined) {
          const rating = typeof dest.rating === 'number' ? dest.rating : parseFloat(dest.rating) || 0;
          if (rating < aiFilters.minRating) return false;
        }
        return true;
      });

      // Handle tags search if present
      if (aiFilters.tags && aiFilters.tags.length > 0) {
        results = results.filter((dest) => {
          const desc = (dest.description || '').toLowerCase();
          const name = (dest.name || '').toLowerCase();
          return aiFilters.tags.some((tag) => 
            desc.includes(tag.toLowerCase()) || name.includes(tag.toLowerCase())
          );
        });
      }

      // Normalize results - ensure rating is a number
      const normalizedResults = (results || []).map((dest) => ({
        ...dest,
        rating: typeof dest.rating === 'number' 
          ? dest.rating 
          : typeof dest.rating === 'string' 
          ? parseFloat(dest.rating) || 0 
          : 0,
      }));

      // Return response
      return res.json({
        searchMode: 'internal',
        aiFilters,
        results: normalizedResults,
      });
    }
  } catch (error) {
    console.error('❌ Error in AI search:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      error: error.message || 'Failed to process AI search',
      details: error.details || 'An unexpected error occurred',
    });
  }
});

// SAVE EXTERNAL DESTINATION ENDPOINT
app.post('/api/destinations/external', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      location, 
      category, 
      description, 
      image, 
      rating,
      externalSourceId,
      externalSourcePlatform,
      externalSourceUrl,
      hashtags
    } = req.body;

    if (!name || !location || !category) {
      return res.status(400).json({ error: 'Name, location, and category are required' });
    }

    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.userId;

    // Check for duplicates: same externalSourceId or same name+location for this user
    let existingDestination = null;
    
    if (externalSourceId) {
      const bySourceId = await sql`
        SELECT id, name, location, "externalSourceId"
        FROM "Destination"
        WHERE "userId" = ${userId} AND "externalSourceId" = ${externalSourceId}
        LIMIT 1
      `;
      if (bySourceId.length > 0) {
        existingDestination = bySourceId[0];
      }
    }

    // Also check by name + location if no sourceId match
    if (!existingDestination) {
      const byNameLocation = await sql`
        SELECT id, name, location
        FROM "Destination"
        WHERE "userId" = ${userId} 
          AND LOWER(name) = LOWER(${name.trim()})
          AND LOWER(location) = LOWER(${location.trim()})
        LIMIT 1
      `;
      if (byNameLocation.length > 0) {
        existingDestination = byNameLocation[0];
      }
    }

    // If duplicate exists, return success with existing destination
    if (existingDestination) {
      const fullDestination = await sql`
        SELECT id, name, location, category, description, image, rating, visited, 
               "isExternal", "externalSourceId", "externalSourcePlatform", "externalSourceUrl",
               "createdAt", "updatedAt"
        FROM "Destination"
        WHERE id = ${existingDestination.id}
      `;
      return res.json({
        destination: fullDestination[0],
        isDuplicate: true,
        message: 'Destination already saved',
      });
    }

    // Sanitize inputs
    const sanitizedName = typeof name === 'string' ? name.trim() : '';
    const sanitizedLocation = typeof location === 'string' ? location.trim() : '';
    const sanitizedCategory = typeof category === 'string' ? category.trim() : '';
    const sanitizedDescription = typeof description === 'string' ? description.trim() : '';
    const sanitizedImage = typeof image === 'string' ? image.trim() : '';
    const ratingValue = Number(rating);
    const normalizedRating = Number.isFinite(ratingValue) && ratingValue >= 0 && ratingValue <= 5
      ? Math.round(ratingValue * 100) / 100
      : 4.5;

    // Validate field lengths
    if (sanitizedName.length > MAX_DESTINATION_NAME_LENGTH) {
      return res.status(400).json({ 
        error: `Destination name is too long. Maximum ${MAX_DESTINATION_NAME_LENGTH} characters allowed`,
        field: 'name',
      });
    }
    
    if (sanitizedLocation.length > MAX_DESTINATION_LOCATION_LENGTH) {
      return res.status(400).json({ 
        error: `Location is too long. Maximum ${MAX_DESTINATION_LOCATION_LENGTH} characters allowed`,
        field: 'location',
      });
    }

    // Insert new external destination
    const destination = await sql`
      INSERT INTO "Destination" (
        name, location, category, description, image, rating, "userId",
        "isExternal", "externalSourceId", "externalSourcePlatform", "externalSourceUrl"
      )
      VALUES (
        ${sanitizedName}, 
        ${sanitizedLocation}, 
        ${sanitizedCategory}, 
        ${sanitizedDescription || null}, 
        ${sanitizedImage || null}, 
        ${normalizedRating}, 
        ${userId},
        true,
        ${externalSourceId || null},
        ${externalSourcePlatform || null},
        ${externalSourceUrl || null}
      )
      RETURNING id, name, location, category, description, image, rating, visited,
                "isExternal", "externalSourceId", "externalSourcePlatform", "externalSourceUrl",
                "createdAt", "updatedAt"
    `;
    
    console.log('✅ External destination saved:', destination[0]);
    res.status(201).json({
      destination: destination[0],
      isDuplicate: false,
      message: 'Destination saved successfully',
    });
  } catch (error) {
    console.error('❌ Error saving external destination:', error);
    res.status(400).json({ error: error.message || 'Failed to save destination' });
  }
});

// GET SAVED EXTERNAL DESTINATIONS
app.get('/api/destinations/saved', authenticateToken, async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.userId;

    const destinations = await sql`
      SELECT id, name, location, category, description, image, rating, visited,
             "isExternal", "externalSourceId", "externalSourcePlatform", "externalSourceUrl",
             "createdAt", "updatedAt"
      FROM "Destination"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
    `;

    // Normalize rating
    const normalizedDestinations = destinations.map((dest) => ({
      ...dest,
      rating: typeof dest.rating === 'number' 
        ? dest.rating 
        : typeof dest.rating === 'string' 
        ? parseFloat(dest.rating) || 0 
        : 0,
    }));

    res.json(normalizedDestinations);
  } catch (error) {
    console.error('❌ Error fetching saved destinations:', error);
    res.status(400).json({ error: error.message });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    
    // Serve React app for all non-API routes
    app.get('*', (req, res) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
    
    console.log('📦 Serving static files from:', distPath);
  }
}

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('📡 Using direct PostgreSQL connection');
  console.log(`🔗 API available at: http://localhost:${PORT}/api`);
  console.log(`🔍 Debug endpoint: http://localhost:${PORT}/api/debug/data`);
});

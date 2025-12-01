# AI Prompt: Settings Functions with Backend Database Integration

## Context
I have a Travel Itinerary Management App built with:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js with PostgreSQL
- **Database**: PostgreSQL with Prisma ORM
- **Current User Model**: id, email, password, firstName, lastName, createdAt, updatedAt

## Task: Implement Comprehensive Settings System

Create a complete settings management system with backend API endpoints and frontend components that allow users to manage their profile, preferences, and app settings.

## Requirements

### 1. Database Schema Updates
First, update the Prisma schema to include user settings:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String?
  lastName  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  trips     Trip[]
  
  // New settings fields
  profile   UserProfile?
  preferences UserPreferences?
  notifications UserNotifications?
  privacy   UserPrivacy?
}

model UserProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  avatar      String?
  bio         String?
  phone       String?
  dateOfBirth DateTime?
  location    String?
  website     String?
  socialLinks Json?    // { twitter, instagram, linkedin, facebook }
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model UserPreferences {
  id           String   @id @default(cuid())
  userId       String   @unique
  theme        String   @default("light") // light, dark, system
  language     String   @default("en")
  timezone     String   @default("UTC")
  currency     String   @default("USD")
  dateFormat   String   @default("MM/DD/YYYY")
  timeFormat   String   @default("12h") // 12h, 24h
  weekStart    String   @default("sunday") // sunday, monday
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model UserNotifications {
  id                    String   @id @default(cuid())
  userId                String   @unique
  emailNotifications    Boolean  @default(true)
  pushNotifications     Boolean  @default(true)
  tripReminders         Boolean  @default(true)
  destinationAlerts     Boolean  @default(true)
  weatherAlerts         Boolean  @default(true)
  priceAlerts           Boolean  @default(true)
  newsletter            Boolean  @default(false)
  marketingEmails       Boolean  @default(false)
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model UserPrivacy {
  id              String   @id @default(cuid())
  userId          String   @unique
  profileVisibility String @default("public") // public, friends, private
  showEmail       Boolean  @default(false)
  showPhone       Boolean  @default(false)
  showLocation    Boolean  @default(true)
  showBirthDate   Boolean  @default(false)
  allowFriendRequests Boolean @default(true)
  dataSharing     Boolean  @default(false)
  analyticsTracking Boolean @default(true)
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### 2. Backend API Endpoints

Create the following API endpoints in `server/index.js`:

#### Profile Settings Endpoints
- `GET /api/settings/profile` - Get user profile
- `PUT /api/settings/profile` - Update user profile
- `POST /api/settings/profile/avatar` - Upload profile picture

#### Preferences Endpoints
- `GET /api/settings/preferences` - Get user preferences
- `PUT /api/settings/preferences` - Update user preferences

#### Notifications Endpoints
- `GET /api/settings/notifications` - Get notification settings
- `PUT /api/settings/notifications` - Update notification settings

#### Privacy Endpoints
- `GET /api/settings/privacy` - Get privacy settings
- `PUT /api/settings/privacy` - Update privacy settings

#### Account Management Endpoints
- `PUT /api/settings/account/email` - Update email
- `PUT /api/settings/account/password` - Update password
- `DELETE /api/settings/account` - Delete account

### 3. Frontend Components

Create the following React components in `src/components/settings/`:

#### SettingsPage.tsx
Main settings page with navigation tabs

#### ProfileSettings.tsx
- Profile picture upload
- Personal information editing
- Social links management
- Bio and location

#### PreferencesSettings.tsx
- Theme selection (light/dark/system)
- Language selection
- Timezone selection
- Currency selection
- Date/time format preferences

#### NotificationSettings.tsx
- Email notification toggles
- Push notification toggles
- Trip reminder settings
- Alert preferences

#### PrivacySettings.tsx
- Profile visibility options
- Information sharing controls
- Data privacy settings
- Account deletion option

#### AccountSettings.tsx
- Email change
- Password change
- Account deletion
- Export data

### 4. Implementation Details

#### Backend Implementation Requirements:
1. **Authentication**: All endpoints must use the existing `authenticateToken` middleware
2. **Validation**: Input validation for all fields
3. **Error Handling**: Comprehensive error messages
4. **File Upload**: Handle profile picture uploads with proper validation
5. **Database Transactions**: Use transactions for multi-table updates
6. **Security**: Hash passwords properly, validate inputs

#### Frontend Implementation Requirements:
1. **Forms**: Use react-hook-form for form management
2. **UI Components**: Use existing Radix UI components
3. **State Management**: Proper state management with loading states
4. **Validation**: Client-side validation matching backend
5. **User Experience**: Toast notifications for success/error states
6. **Responsive Design**: Mobile-friendly design

#### File Structure:
```
src/
├── components/settings/
│   ├── SettingsPage.tsx
│   ├── ProfileSettings.tsx
│   ├── PreferencesSettings.tsx
│   ├── NotificationSettings.tsx
│   ├── PrivacySettings.tsx
│   └── AccountSettings.tsx
├── hooks/
│   └── useSettings.ts
├── types/
│   └── settings.ts
└── api/
    └── settings.ts
```

### 5. Features to Include

#### Profile Settings:
- Profile picture upload (with crop functionality)
- Personal information editing
- Social media links
- Bio and location

#### Preferences:
- Theme switching (light/dark/system)
- Multi-language support
- Timezone handling
- Currency conversion
- Date/time formatting

#### Notifications:
- Email notifications
- Push notifications (if applicable)
- Trip reminders
- Weather alerts
- Price alerts

#### Privacy:
- Profile visibility controls
- Data sharing preferences
- Analytics tracking opt-out
- Account deletion

#### Account Management:
- Secure email change
- Password change with current password verification
- Account deletion with confirmation
- Data export functionality

### 6. Technical Considerations

#### Security:
- Rate limiting for sensitive operations
- CSRF protection
- Input sanitization
- Secure file uploads
- Password strength requirements

#### Performance:
- Lazy loading of settings sections
- Optimistic updates where appropriate
- Efficient database queries
- Image optimization for avatars

#### Accessibility:
- ARIA labels for all form inputs
- Keyboard navigation
- Screen reader support
- High contrast mode support

#### Internationalization:
- Support for multiple languages
- Localized date/time formats
- Currency formatting
- Timezone handling

### 7. Testing Requirements

#### Backend Tests:
- Unit tests for all endpoints
- Integration tests with database
- Security tests for authentication
- Validation tests for inputs

#### Frontend Tests:
- Component tests for all settings components
- Form validation tests
- User interaction tests
- Accessibility tests

### 8. Deployment Considerations

#### Environment Variables:
- File upload storage path
- Email service configuration
- Image processing settings
- Rate limiting configuration

#### Database Migrations:
- Create migration scripts for new tables
- Handle existing user data migration
- Rollback procedures

## Expected Deliverables

1. **Updated Prisma Schema** with all new models
2. **Complete Backend API** with all endpoints implemented
3. **Frontend Components** for all settings sections
4. **Type Definitions** for TypeScript
5. **API Client Functions** for frontend-backend communication
6. **Form Validation** and error handling
7. **File Upload System** for profile pictures
8. **Comprehensive Tests** for both frontend and backend
9. **Documentation** for API endpoints and components

## Success Criteria

- Users can update their profile information
- Users can manage their preferences (theme, language, etc.)
- Users can control their notification settings
- Users can manage their privacy settings
- Users can securely change email/password
- Users can delete their account
- All settings persist in the database
- Proper error handling and user feedback
- Responsive and accessible UI
- Secure implementation following best practices

Please implement this comprehensive settings system with proper error handling, validation, and user experience considerations.

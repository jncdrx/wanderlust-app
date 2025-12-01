# Database Schema Adjustment Guide

## Problem: VARCHAR(500) Limit for Destination Image Field

If you're experiencing errors like "value too long for type character varying(500)" when creating or updating destinations, it's likely because the `image` field in the `Destination` table has a `VARCHAR(500)` constraint, but base64-encoded images or long image URLs exceed this limit.

## Current Schema Limits

The `Destination` table has the following field length constraints:

- `name`: VARCHAR(255)
- `location`: VARCHAR(255)
- `category`: VARCHAR(100)
- `description`: TEXT (unlimited, but frontend limits to 10,000 characters)
- `image`: VARCHAR(500) ⚠️ **This is the most common issue**
- `rating`: DECIMAL(3,2)

## Solution Options

### Option 1: Increase VARCHAR Limit (Recommended for Image URLs)

If you're storing image URLs (not base64 data), you can increase the VARCHAR limit:

```sql
-- Increase image field to VARCHAR(2000) for longer URLs
ALTER TABLE "Destination" 
ALTER COLUMN image TYPE VARCHAR(2000);
```

### Option 2: Change to TEXT Type (Recommended for Base64 Images)

If you're storing base64-encoded images, change the field to TEXT to allow unlimited length:

```sql
-- Change image field to TEXT for base64 data
ALTER TABLE "Destination" 
ALTER COLUMN image TYPE TEXT;
```

### Option 3: Use External Image Storage (Best Practice)

Instead of storing base64 images in the database, consider:
1. Upload images to a cloud storage service (AWS S3, Cloudinary, etc.)
2. Store only the image URL in the database
3. This keeps your database smaller and faster

## Step-by-Step Migration Instructions

### Using Prisma (Recommended)

1. **Update the Prisma schema** (`prisma/schema.prisma`):

```prisma
model Destination {
  id          Int      @id @default(autoincrement())
  name        String   @db.VarChar(255)
  location    String   @db.VarChar(255)
  category    String   @db.VarChar(100)
  description String?  @db.Text
  image       String?  @db.Text  // Changed from VarChar(500) to Text
  rating      Decimal  @default(4.5) @db.Decimal(3, 2)
  visited     Boolean  @default(false)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

2. **Create a migration**:

```bash
npx prisma migrate dev --name increase_destination_image_length
```

3. **Apply the migration**:

```bash
npx prisma migrate deploy
```

### Using Direct SQL

1. **Connect to your PostgreSQL database**:

```bash
psql $DATABASE_URL
```

2. **Run the migration SQL**:

```sql
-- For TEXT type (recommended for base64)
ALTER TABLE "Destination" 
ALTER COLUMN image TYPE TEXT;

-- OR for increased VARCHAR limit
ALTER TABLE "Destination" 
ALTER COLUMN image TYPE VARCHAR(2000);
```

3. **Verify the change**:

```sql
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'Destination' AND column_name = 'image';
```

### Update Backend Constants

After changing the database schema, update the validation constants in `server/index.js`:

```javascript
// Update this constant to match your new limit
const MAX_DESTINATION_IMAGE_LENGTH = 2000; // or remove limit if using TEXT
```

If using TEXT type, you can remove the length check or set a very high limit:

```javascript
const MAX_DESTINATION_IMAGE_LENGTH = 1000000; // 1MB of base64 data
```

### Update Frontend Constants

Update the frontend validation in `src/components/AddDestinationModal.tsx`:

```typescript
// Update to match backend limit
const MAX_DESTINATION_IMAGE_LENGTH = 2000; // or your chosen limit
```

## Testing the Migration

1. **Test with a long image URL**:
   - Try creating a destination with an image URL longer than 500 characters
   - Should succeed after migration

2. **Test with base64 image**:
   - Upload a small image (under 2MB)
   - Should work if using TEXT type

3. **Verify existing data**:
   ```sql
   SELECT id, name, LENGTH(image) as image_length 
   FROM "Destination" 
   WHERE image IS NOT NULL 
   ORDER BY image_length DESC;
   ```

## Rollback Instructions

If you need to rollback the migration:

```sql
-- Rollback to VARCHAR(500)
ALTER TABLE "Destination" 
ALTER COLUMN image TYPE VARCHAR(500);
```

**Warning**: This will fail if any existing records have image data longer than 500 characters. You'll need to truncate those first:

```sql
-- Truncate existing long images
UPDATE "Destination" 
SET image = LEFT(image, 500) 
WHERE LENGTH(image) > 500;

-- Then rollback
ALTER TABLE "Destination" 
ALTER COLUMN image TYPE VARCHAR(500);
```

## Best Practices

1. **Validate on Frontend**: Always validate image size before upload
2. **Validate on Backend**: Never trust frontend validation alone
3. **Use External Storage**: For production apps, use cloud storage for images
4. **Compress Images**: Compress images before storing to reduce size
5. **Set Reasonable Limits**: Even with TEXT, set practical limits (e.g., 2MB file size)

## Troubleshooting

### Error: "value too long for type character varying(500)"

**Cause**: Data exceeds the current VARCHAR(500) limit.

**Solution**: 
1. Follow the migration steps above
2. Update validation constants in both frontend and backend
3. Restart your server

### Error: "column does not exist"

**Cause**: Table or column name mismatch (PostgreSQL is case-sensitive).

**Solution**: Use double quotes around table/column names: `"Destination"` and `"image"`

### Error: "relation does not exist"

**Cause**: Table hasn't been created yet.

**Solution**: Run the database initialization in `server/index.js` or create the table manually.

## Additional Resources

- [PostgreSQL ALTER TABLE Documentation](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Prisma Migrations Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Base64 Encoding Size Calculator](https://www.base64-image.de/)


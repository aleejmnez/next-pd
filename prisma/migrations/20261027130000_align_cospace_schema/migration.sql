-- Recupera los precios COP sembrados mientras la columna seguía siendo Float.
UPDATE "spaces" SET "pricePerHour" = 8000 WHERE "name" = 'Escritorio flexible';
UPDATE "spaces" SET "pricePerHour" = 35000 WHERE "name" = 'Sala de reuniones ejecutiva';
UPDATE "spaces" SET "pricePerHour" = 10000 WHERE "name" = 'Cabina acústica';
UPDATE "spaces" SET "pricePerHour" = 22000 WHERE "name" = 'Oficina privada';
UPDATE "spaces" SET "pricePerHour" = 45000 WHERE "name" = 'Sala colaborativa';
UPDATE "spaces" SET "pricePerHour" = 7000 WHERE "name" = 'Puesto en zona compartida';

ALTER TABLE "bookings" DROP CONSTRAINT "bookings_spaceId_fkey";
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_userId_fkey";

ALTER TABLE "refresh_tokens" RENAME COLUMN "token" TO "tokenHash";
ALTER INDEX "refresh_tokens_token_key" RENAME TO "refresh_tokens_tokenHash_key";

ALTER TABLE "bookings" DROP COLUMN "deletedAt";
ALTER TABLE "bookings" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "bookings"
  ALTER COLUMN "totalPrice" TYPE INTEGER
  USING ROUND("totalPrice")::INTEGER;

ALTER TABLE "refresh_tokens" DROP COLUMN "deletedAt";
ALTER TABLE "spaces" DROP COLUMN "deletedAt";
ALTER TABLE "spaces"
  ALTER COLUMN "pricePerHour" TYPE INTEGER
  USING ROUND("pricePerHour")::INTEGER;
ALTER TABLE "users" DROP COLUMN "deletedAt";

CREATE INDEX "spaces_isActive_idx" ON "spaces"("isActive");

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_spaceId_fkey"
  FOREIGN KEY ("spaceId") REFERENCES "spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

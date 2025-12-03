-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('MOBILE', 'DESKTOP', 'TABLET', 'BOT', 'UNKNOWN');

-- AlterTable
ALTER TABLE "PageView" ADD COLUMN     "device" "DeviceType" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "userAgent" TEXT;


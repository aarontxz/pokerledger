-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "action" TEXT NOT NULL DEFAULT 'stack_update',
ADD COLUMN     "oldStack" INTEGER,
ALTER COLUMN "newStack" DROP NOT NULL;

-- AlterTable
ALTER TABLE "BuyIn" ADD COLUMN     "deviceId" TEXT;

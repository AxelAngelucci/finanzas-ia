-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('free', 'active', 'expired');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'free',
ADD COLUMN     "revenuecat_id" TEXT,
ADD COLUMN     "trial_ends_at" TIMESTAMP(3);

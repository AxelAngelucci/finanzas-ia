-- CreateTable
CREATE TABLE "commitments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "emoji" VARCHAR(8) NOT NULL DEFAULT '📅',
    "amount" INTEGER NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "day_of_month" INTEGER NOT NULL,
    "installment_current" INTEGER,
    "installment_total" INTEGER,
    "last_paid_month" VARCHAR(7),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commitments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

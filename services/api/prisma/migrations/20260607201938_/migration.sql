-- CreateEnum
CREATE TYPE "AgentTone" AS ENUM ('amigable', 'formal', 'estricto');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('light', 'dark', 'system');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('expense', 'income', 'saving');

-- CreateEnum
CREATE TYPE "TransactionChannel" AS ENUM ('app', 'wa_text', 'wa_audio');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('Alimentacion', 'Transporte', 'Alquiler', 'Salud', 'Entretenimiento', 'Trabajo', 'Tecnologia', 'Ropa', 'Educacion', 'Ahorro', 'Sueldo', 'Freelance', 'Otros');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "income_monthly" INTEGER NOT NULL DEFAULT 0,
    "wa_phone" TEXT,
    "wa_verified" BOOLEAN NOT NULL DEFAULT false,
    "wa_link_token" TEXT,
    "wa_link_token_exp" TIMESTAMP(3),
    "agent_tone" "AgentTone" NOT NULL DEFAULT 'amigable',
    "theme" "Theme" NOT NULL DEFAULT 'system',
    "budget_alert_pct" INTEGER NOT NULL DEFAULT 80,
    "rollover_enabled" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_done" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" VARCHAR(120) NOT NULL,
    "category" "TransactionCategory" NOT NULL,
    "note" VARCHAR(500),
    "date" DATE NOT NULL,
    "channel" "TransactionChannel" NOT NULL DEFAULT 'app',
    "raw_text" TEXT,
    "ai_confidence" DOUBLE PRECISION,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" "TransactionCategory" NOT NULL,
    "limit_amount" INTEGER NOT NULL,
    "month" VARCHAR(7) NOT NULL,
    "rollover" BOOLEAN NOT NULL DEFAULT false,
    "alert_threshold" INTEGER NOT NULL DEFAULT 80,
    "alert_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "emoji" VARCHAR(4) NOT NULL,
    "target_amount" INTEGER NOT NULL,
    "saved_amount" INTEGER NOT NULL DEFAULT 0,
    "target_date" DATE NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL,
    "day_of_charge" INTEGER NOT NULL,
    "next_date" DATE NOT NULL,
    "category" "TransactionCategory" NOT NULL,
    "ignored" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insights" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "week_key" VARCHAR(8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_wa_phone_key" ON "users"("wa_phone");

-- CreateIndex
CREATE INDEX "transactions_user_id_date_idx" ON "transactions"("user_id", "date");

-- CreateIndex
CREATE INDEX "transactions_user_id_deleted_at_idx" ON "transactions"("user_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_user_id_category_month_key" ON "budgets"("user_id", "category", "month");

-- CreateIndex
CREATE UNIQUE INDEX "insights_user_id_week_key_key" ON "insights"("user_id", "week_key");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

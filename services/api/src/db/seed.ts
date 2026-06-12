import 'dotenv/config';
import { prisma } from './client';
import bcrypt from 'bcryptjs';

async function main() {
  const password_hash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'test@finanzas-ia.app' },
    update: {},
    create: {
      email: 'test@finanzas-ia.app',
      password_hash,
      name: 'Usuario Test',
      income_monthly: 50000_00,
      agent_tone: 'amigable',
      onboarding_done: true,
    },
  });

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  await prisma.transaction.createMany({
    data: [
      { user_id: user.id, amount: 50000_00, type: 'income', description: 'Sueldo', category: 'Sueldo', date: new Date(now.getFullYear(), now.getMonth(), 1), channel: 'app' },
      { user_id: user.id, amount: 4500_00, type: 'expense', description: 'Nafta', category: 'Transporte', date: new Date(), channel: 'app' },
      { user_id: user.id, amount: 12000_00, type: 'expense', description: 'Supermercado', category: 'Alimentacion', date: new Date(), channel: 'app' },
      { user_id: user.id, amount: 890_00, type: 'expense', description: 'Netflix', category: 'Entretenimiento', date: new Date(), channel: 'app' },
    ],
    skipDuplicates: true,
  });

  await prisma.budget.upsert({
    where: { user_id_category_month: { user_id: user.id, category: 'Alimentacion', month } },
    update: {},
    create: { user_id: user.id, category: 'Alimentacion', limit_amount: 30000_00, month },
  });

  await prisma.budget.upsert({
    where: { user_id_category_month: { user_id: user.id, category: 'Transporte', month } },
    update: {},
    create: { user_id: user.id, category: 'Transporte', limit_amount: 15000_00, month },
  });

  console.log('Seed completado. Usuario de prueba: test@finanzas-ia.app / password123');
}

main().catch(console.error).finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@voltway.app' },
    update: {},
    create: { name: 'Platform Admin', email: 'admin@voltway.app', passwordHash, role: 'ADMIN' },
  });

  const operator = await prisma.user.upsert({
    where: { email: 'operator@voltway.app' },
    update: {},
    create: { name: 'Delhi Charge Co.', email: 'operator@voltway.app', passwordHash, role: 'OPERATOR' },
  });

  await prisma.user.upsert({
    where: { email: 'rider@voltway.app' },
    update: {},
    create: { name: 'Demo Rider', email: 'rider@voltway.app', passwordHash, role: 'RIDER' },
  });

  console.log(`Seeded users: admin=${admin.email}, operator=${operator.email}, rider=rider@voltway.app`);
  console.log('Password for all demo accounts: password123');

  // Two-wheeler stations: no public live API covers this segment yet, so it's
  // hand-seeded here. Car stations are meant to be imported for real via
  // POST /api/stations/import/open-charge-map — these two are just a fallback
  // so the app has something to show before that import is run.
  const stations = [
    {
      name: 'DLF Cyber Hub Two-Wheeler Bay',
      address: 'DLF Cyber Hub, Gurugram, Haryana',
      latitude: 28.4949,
      longitude: 77.0891,
      vehicleTypes: ['BIKE'],
      connectors: ['BHARAT_AC001'],
      compatibleBrands: ['Ather', 'Ola Electric', 'Bajaj Chetak', 'TVS iQube'],
      powerKw: 3.3,
      pricePerKwh: 9,
      operatorId: operator.id,
    },
    {
      name: 'Connaught Place Scooter Point',
      address: 'Connaught Place, New Delhi',
      latitude: 28.6315,
      longitude: 77.2167,
      vehicleTypes: ['BIKE'],
      connectors: ['BHARAT_AC001', 'TYPE2'],
      compatibleBrands: ['Hero Vida', 'Ather', 'TVS iQube'],
      powerKw: 2.2,
      pricePerKwh: 8,
      operatorId: operator.id,
    },
    {
      name: 'Nehru Place Fast Charge Hub',
      address: 'Nehru Place, New Delhi',
      latitude: 28.5493,
      longitude: 77.2517,
      vehicleTypes: ['CAR'],
      connectors: ['CCS2', 'TYPE2'],
      compatibleBrands: ['Tata', 'MG', 'Hyundai', 'BYD'],
      powerKw: 60,
      pricePerKwh: 18,
      operatorId: operator.id,
    },
  ] as const;

  for (const s of stations) {
    await prisma.station.upsert({
      where: { externalId: `seed-${s.name}` },
      update: {},
      create: { ...s, externalId: `seed-${s.name}` },
    });
  }

  console.log(`Seeded ${stations.length} starter stations.`);
  console.log('Tip: log in as the operator and call POST /api/stations/import/open-charge-map');
  console.log('with your city\'s coordinates to pull in real nearby car charging stations.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

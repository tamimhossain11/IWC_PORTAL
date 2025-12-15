const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('admin123', 12);
  const superAdmin = await prisma.admin.upsert({
    where: { email: 'admin@iwc.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@iwc.com',
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ Super Admin created:', superAdmin.email);

  // Create Document Admin
  const docAdminPassword = await bcrypt.hash('docadmin123', 12);
  const docAdmin = await prisma.admin.upsert({
    where: { email: 'docadmin@iwc.com' },
    update: {},
    create: {
      name: 'Document Admin',
      email: 'docadmin@iwc.com',
      password: docAdminPassword,
      role: 'DOCUMENT_ADMIN',
    },
  });

  console.log('✅ Document Admin created:', docAdmin.email);

  // Create sample team
  const sampleTeam = await prisma.team.upsert({
    where: { teamId: 'TEAM001' },
    update: {},
    create: {
      teamId: 'TEAM001',
      teamName: 'Sample Team Alpha',
      paymentId: 'PAY001',
      regId: 'REG001',
      createdBy: superAdmin.id,
    },
  });

  console.log('✅ Sample team created:', sampleTeam.teamName);

  // Create sample team members
  const member1Password = await bcrypt.hash('member123', 12);
  const member1 = await prisma.teamMember.upsert({
    where: { email: 'leader@team001.com' },
    update: {},
    create: {
      teamId: sampleTeam.id,
      name: 'John Doe',
      email: 'leader@team001.com',
      password: member1Password,
      role: 'LEADER',
    },
  });

  const member2Password = await bcrypt.hash('member123', 12);
  const member2 = await prisma.teamMember.upsert({
    where: { email: 'member@team001.com' },
    update: {},
    create: {
      teamId: sampleTeam.id,
      name: 'Jane Smith',
      email: 'member@team001.com',
      password: member2Password,
      role: 'MEMBER',
    },
  });

  console.log('✅ Sample team members created');
  console.log('   - Team Leader:', member1.email);
  console.log('   - Team Member:', member2.email);

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📝 Default Login Credentials:');
  console.log('Super Admin: admin@iwc.com / admin123');
  console.log('Document Admin: docadmin@iwc.com / docadmin123');
  console.log('Team Leader: leader@team001.com / member123');
  console.log('Team Member: member@team001.com / member123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

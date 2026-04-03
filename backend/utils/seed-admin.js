/**
 * seed-admin.js
 * Run once to:
 *  1. Ensure the Roles table has the two required rows (id=1 Admin, id=2 User)
 *  2. Promote the first registered user (or a specific email) to Admin
 *
 * Usage:
 *   node seed-admin.js
 *   node seed-admin.js --email your@email.com
 */

const { sequelize, Role, User } = require('../models');

async function seed() {
  await sequelize.authenticate();
  console.log('DB connected.\n');

  // --- 1. Seed roles ---
  const roles = [
    { id: 1, name: 'admin' },
    { id: 2, name: 'user' },
  ];

  for (const role of roles) {
    const now = new Date();
    const [r, created] = await Role.findOrCreate({
      where: { id: role.id },
      defaults: { name: role.name, createdAt: now, updatedAt: now },
    });
    console.log(`Role ${r.id} "${r.name}" — ${created ? 'created' : 'already exists'}`);
  }

  // --- 2. Promote user to admin ---
  // Pick email from CLI arg or fall back to the first registered user
  const emailArg = process.argv.find(a => a.startsWith('--email='))?.split('=')[1]
    || process.argv[process.argv.indexOf('--email') + 1];

  let user;
  if (emailArg) {
    user = await User.unscoped().findOne({ where: { email: emailArg } });
    if (!user) {
      console.error(`\nNo user found with email: ${emailArg}`);
      process.exit(1);
    }
  } else {
    // Fall back: promote the very first user in the DB
    user = await User.unscoped().findOne({ order: [['createdAt', 'ASC']] });
    if (!user) {
      console.error('\nNo users found in the database. Register first, then re-run this script.');
      process.exit(1);
    }
  }

  await user.update({ RoleId: 1 });
  console.log(`\n✅ User "${user.email}" is now an Admin (RoleId = 1).`);

  await sequelize.close();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

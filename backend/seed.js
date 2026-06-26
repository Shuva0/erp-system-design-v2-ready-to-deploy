// Run with: npm run seed
// Creates the first admin account so you have a way to log in and start
// creating services/users from the UI.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await User.findOne({ email: 'admin@yourcompany.com' });
  if (existing) {
    console.log('Admin already exists.');
    process.exit(0);
  }

  await User.create({
    name: 'Admin',
    email: 'admin@yourcompany.com',
    password: 'ChangeThisPassword123!',
    role: 'admin',
    authProvider: 'local',
  });

  console.log('Admin user created: admin@yourcompany.com / ChangeThisPassword123!');
  process.exit(0);
}

seed();

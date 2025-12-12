/**
 * Script to create first admin user
 * Usage: node src/database/createAdmin.js
 */

require('dotenv').config();
const readline = require('readline');
const AdminUser = require('../models/AdminUser');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAdmin() {
  try {
    console.log('\n=== Create Admin User ===\n');

    const username = await question('Username: ');
    const email = await question('Email: ');
    const password = await question('Password: ');
    const fullName = await question('Full Name (optional): ');

    if (!username || !email || !password) {
      console.error('\n❌ Error: Username, email and password are required');
      rl.close();
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await AdminUser.findByUsername(username);
    if (existingUser) {
      console.error(`\n❌ Error: User with username "${username}" already exists`);
      rl.close();
      process.exit(1);
    }

    const existingEmail = await AdminUser.findByEmail(email);
    if (existingEmail) {
      console.error(`\n❌ Error: User with email "${email}" already exists`);
      rl.close();
      process.exit(1);
    }

    // Create user
    const user = await AdminUser.create({
      username,
      email,
      password,
      full_name: fullName || null,
      role: 'admin',
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('\nUser details:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Username: ${user.username}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Full Name: ${user.full_name || 'N/A'}`);
    console.log('\n🔐 You can now login with these credentials\n');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    rl.close();
    process.exit(1);
  }
}

createAdmin();

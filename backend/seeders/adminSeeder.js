const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const User = require('../models/User');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdminClean = async () => {
  try {
    await connectDB();

    const adminEmail = 'admin@eduverse.com';
    const adminPassword = 'Admin@123';

    // 1. Delete existing admin user to prevent duplicate or double-hashed records
    await User.deleteOne({ email: adminEmail });

    // 2. Create Admin user passing plain text password (pre-save hook handles hashing ONCE)
    const adminUser = await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'Admin',
      status: 'Active',
      isApproved: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });

    console.log('----------------------------------------------------');
    console.log('✅ Admin user re-created cleanly!');
    console.log(` 👤 Name: ${adminUser.name}`);
    console.log(` 📧 Email: ${adminUser.email}`);
    console.log(` 🔑 Password: ${adminPassword}`);
    console.log(` 🛡️  Role: ${adminUser.role}`);
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Admin Seeder Error:', error.message);
    process.exit(1);
  }
};

seedAdminClean();

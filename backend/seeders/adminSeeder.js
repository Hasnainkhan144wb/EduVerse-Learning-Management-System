const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const User = require('../models/User');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdminUser = async () => {
  try {
    // Connect to MongoDB database
    await connectDB();

    const adminEmail = 'admin@eduverse.com';
    const adminPassword = 'Admin@EduVerse2026';

    // 1. Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`[Admin Seeder] Admin user already exists: ${adminEmail}`);
      process.exit(0);
    }

    // 2. Create Admin user (password hashing automatically handled by User schema pre-save hook)
    const adminUser = await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'Admin',
      isApproved: true,
    });

    console.log('----------------------------------------------------');
    console.log('✅ [Admin Seeder] Default Admin user created successfully!');
    console.log(` 👤 Name: ${adminUser.name}`);
    console.log(` 📧 Email: ${adminUser.email}`);
    console.log(` 🔑 Password: ${adminPassword}`);
    console.log(` 🛡️  Role: ${adminUser.role}`);
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ [Admin Seeder Error]:', error.message);
    process.exit(1);
  }
};

seedAdminUser();

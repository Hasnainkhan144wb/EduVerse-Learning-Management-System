const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');

const resetAdminAccount = async () => {
  try {
    await connectDB();
    console.log('⚡ Connected to MongoDB for Emergency Admin Reset...');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // 1. Generate clean bcrypt hash for 'Admin@123'
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);

    // 2. Direct raw MongoDB upsert (Bypasses Mongoose hooks completely)
    const result = await usersCollection.updateOne(
      { email: 'admin@eduverse.com' },
      {
        $set: {
          name: 'System Admin',
          email: 'admin@eduverse.com',
          password: hashedPassword,
          role: 'Admin',
          status: 'Active',
          isApproved: true,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    console.log('----------------------------------------------------');
    console.log('✅ Admin account forcefully updated/created in MongoDB!');
    console.log(' 👤 Name: System Admin');
    console.log(' 📧 Email: admin@eduverse.com');
    console.log(' 🔑 Password: Admin@123');
    console.log(' 🛡️  Role: Admin');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('❌ Reset Error:', err);
    process.exit(1);
  }
};

resetAdminAccount();

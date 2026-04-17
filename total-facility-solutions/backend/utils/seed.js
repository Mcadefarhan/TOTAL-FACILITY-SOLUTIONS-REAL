const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@totalfacility.com';
    const existing = await User.findOne({ email: adminEmail });
    if (existing) return;

    await User.create({
      name: process.env.ADMIN_NAME || 'Super Admin',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
      isVerified: true,
      status: 'active',
      isApprovedByAdmin: true,
    });

    console.log('✅ Admin account created:', adminEmail);
  } catch (error) {
    if (error.code !== 11000) {
      console.error('❌ Admin seed failed:', error.message);
    }
  }
};

module.exports = { seedAdmin };

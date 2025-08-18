// test-setup.js
// Run this file with: node test-setup.js

require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testing Workforce Management System Setup...\n');

// 1. Check Environment Variables
console.log('📋 Environment Variables:');
console.log('MONGODB_URI:', process.env.MONGODB_URI || 'NOT SET (will use default)');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET ✅' : 'NOT SET ❌');
console.log('PORT:', process.env.PORT || '5000 (default)');
console.log();

// 2. Test Database Connection
console.log('🔗 Testing Database Connection...');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workforce-management';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Database connected successfully!');
    
    // 3. Test Employee Model
    console.log('\n📊 Testing Employee Model...');
    try {
      const Employee = require('./models/Employee');
      console.log('✅ Employee model loaded successfully');
      
      // Check if any employees exist
      const count = await Employee.countDocuments();
      console.log(`📈 Current employees in database: ${count}`);
      
      if (count > 0) {
        const sample = await Employee.findOne().select('-password');
        console.log('👤 Sample employee:', {
          id: sample._id,
          name: `${sample.firstName} ${sample.lastName}`,
          email: sample.email,
          role: sample.role
        });
      }
    } catch (error) {
      console.log('❌ Employee model error:', error.message);
    }
    
    // 4. Test Auth Middleware
    console.log('\n🔐 Testing Auth Middleware...');
    try {
      const { auth } = require('./middleware/auth');
      console.log('✅ Auth middleware loaded successfully');
    } catch (error) {
      console.log('❌ Auth middleware error:', error.message);
    }
    
    // 5. Test Routes
    console.log('\n🛣️ Testing Routes...');
    try {
      const authRoutes = require('./routes/auth');
      console.log('✅ Auth routes loaded successfully');
    } catch (error) {
      console.log('❌ Auth routes error:', error.message);
    }
    
    try {
      const employeeRoutes = require('./routes/employees');
      console.log('✅ Employee routes loaded successfully');
    } catch (error) {
      console.log('❌ Employee routes error:', error.message);
    }
    
    console.log('\n✅ Setup test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. If you see any ❌ errors above, those need to be fixed first');
    console.log('2. Start your server with: npm start or node server.js');
    console.log('3. Test the API endpoint: http://localhost:5000/api/test');
    console.log('4. Try signup/login from your frontend');
    
    process.exit(0);
  })
  .catch(error => {
    console.log('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure MongoDB is running:');
    console.log('   - Windows: net start MongoDB');
    console.log('   - macOS: brew services start mongodb-community');
    console.log('   - Linux: sudo systemctl start mongod');
    console.log('2. Check your MongoDB connection string');
    console.log('3. Try connecting with: mongosh or mongo');
    
    process.exit(1);
  });
require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize } = require('../models');
const m = require('../models');

async function setUserPassword(email, newPassword) {
  try {
    // Find the user
    const user = await m.User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'password']
    });

    if (!user) {
      console.log(`User with email ${email} not found`);
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password
    await user.update({ password: hashedPassword });
    
    console.log(`Successfully updated password for ${email}`);
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
}

// Get command line arguments
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.log('Usage: node set-user-password.js <email> <new-password>');
  process.exit(1);
}

// Run the password update
setUserPassword(email, password);

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Users');
    
    // Only add columns if they don't exist
    const addColumnIfNotExists = async (columnName, options) => {
      if (!tableInfo[columnName]) {
        await queryInterface.addColumn('Users', columnName, options);
      }
    };

    await addColumnIfNotExists('firstName', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('lastName', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('googleId', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('emailVerified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await addColumnIfNotExists('status', {
      type: Sequelize.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    });

    await addColumnIfNotExists('lastLoginAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add unique index for googleId — use try/catch for cross-DB compatibility
    try {
      await queryInterface.addIndex('Users', ['googleId'], {
        name: 'users_google_id',
        unique: true,
        where: { googleId: { [Sequelize.Op.ne]: null } }
      });
    } catch (e) {
      // Index already exists — safe to ignore
      console.log('Index users_google_id already exists, skipping.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Safe removal - only remove if column exists
    const removeColumnIfExists = async (columnName) => {
      const tableInfo = await queryInterface.describeTable('Users');
      if (tableInfo[columnName]) {
        await queryInterface.removeColumn('Users', columnName);
      }
    };
    await removeColumnIfExists('firstName');
    await removeColumnIfExists('lastName');
    await removeColumnIfExists('googleId');
    await removeColumnIfExists('emailVerified');
    await removeColumnIfExists('status');
    await removeColumnIfExists('lastLoginAt');
    
   
  }
};
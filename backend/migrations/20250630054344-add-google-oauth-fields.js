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

    // Add unique index for googleId if it doesn't exist
    const [results] = await queryInterface.sequelize.query(`
      SELECT COUNT(*) as index_count
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = '${queryInterface.sequelize.config.database}'
      AND TABLE_NAME = 'Users'
      AND INDEX_NAME = 'users_google_id'
    `);

    if (results[0].index_count === 0) {
      await queryInterface.addIndex('Users', ['googleId'], {
        name: 'users_google_id',
        unique: true,
        where: { googleId: { [Sequelize.Op.ne]: null } }
      });
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
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('salesData', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      drug: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      actual_sales: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      hour: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      weekday_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('salesData', ['drug'], {
      name: 'salesData_drug_idx'
    });
    await queryInterface.addIndex('salesData', ['date'], {
      name: 'salesData_date_idx'
    });
    await queryInterface.addIndex('salesData', ['year'], {
      name: 'salesData_year_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // First remove indexes
    await queryInterface.removeIndex('salesData', 'salesData_drug_idx');
    await queryInterface.removeIndex('salesData', 'salesData_date_idx');
    await queryInterface.removeIndex('salesData', 'salesData_year_idx');
    
    // Then drop the table
    await queryInterface.dropTable('salesData');
  }
};

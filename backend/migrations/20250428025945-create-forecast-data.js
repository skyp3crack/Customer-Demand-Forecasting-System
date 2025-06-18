'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('forecastData', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      drug: {
        type: Sequelize.STRING,
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      predicted_sales: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      model_version: {
        type: Sequelize.STRING
      },
      forecast_type: {
        type: Sequelize.ENUM('daily', 'monthly'),
        allowNull: false,
        defaultValue: 'daily'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add unique constraint
    await queryInterface.addIndex('forecastData', 
      ['drug', 'date', 'forecast_type'], 
      {
        unique: true,
        name: 'forecast_unique_constraint'
      }
    );

    // Add other indexes for performance
    await queryInterface.addIndex('forecastData', ['date']);
    await queryInterface.addIndex('forecastData', ['drug']);
    await queryInterface.addIndex('forecastData', ['forecast_type']);
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('forecastData', ['forecast_type']);
    await queryInterface.removeIndex('forecastData', ['drug']);
    await queryInterface.removeIndex('forecastData', ['date']);
    
    await queryInterface.dropTable('forecastData');
  }
};
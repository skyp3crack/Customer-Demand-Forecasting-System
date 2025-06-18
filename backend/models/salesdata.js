'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class SalesData extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define associations here if needed
    }
  }
  
  SalesData.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    drug: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    actual_sales: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    hour: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    weekday_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'salesData',
    tableName: 'salesData',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        name: 'salesData_drug_idx',
        fields: ['drug']
      },
      {
        name: 'salesData_date_idx',
        fields: ['date']
      },
      {
        name: 'salesData_year_idx',
        fields: ['year']
      }
    ]
  });

  return SalesData;
};
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class forecastData extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  forecastData.init({
    drug: {
      type: DataTypes.STRING,
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    predicted_sales: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    forecast_type: {
      type: DataTypes.ENUM('daily', 'monthly'),
      allowNull: false,
      defaultValue: 'daily'
    },
    model_version: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'forecastData',
    tableName: 'forecastData',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    underscored: false
  });
  return forecastData;
};

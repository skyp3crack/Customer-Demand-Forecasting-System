'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ActivityLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  ActivityLog.init({
    activity: DataTypes.STRING,
    details: DataTypes.TEXT,
    ip_address: DataTypes.STRING,
    user_agent: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'ActivityLog',
  });
  return ActivityLog;
};
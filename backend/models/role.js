const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {}
  Role.init({
    name: DataTypes.STRING,
    // Explicitly define the timestamp fields to match your database
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'createdAt' // Explicitly set the column name
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updatedAt' // Explicitly set the column name
    }
  }, {
    sequelize,
    modelName: 'Role',
    timestamps: false, // Disable timestamps
    // Explicitly tell Sequelize to use the same field names as the database
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });
  return Role;
};

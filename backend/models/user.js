const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      this.belongsTo(models.Role);
      this.hasMany(models.RefreshToken, {
        foreignKey: 'userId',
        as: 'refreshTokens',
        onDelete: 'CASCADE'
      });
    }
  }
  User.init({
    name: DataTypes.STRING,
    password: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    image: DataTypes.TEXT,
    reset_token: DataTypes.STRING,
    verifiedAt: DataTypes.DATE,
    RoleId: DataTypes.INTEGER,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'User',
    underscored: false
  });
  return User;
};

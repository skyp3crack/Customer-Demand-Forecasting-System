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
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    name: DataTypes.STRING,
    password: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null for Google-authenticated users
    },
    phone: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    image: DataTypes.TEXT,
    reset_token: DataTypes.STRING,
    verifiedAt: DataTypes.DATE,
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    lastLoginAt: DataTypes.DATE,
    RoleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2 // Default role ID for regular users
    }
  }, {
    sequelize,
    modelName: 'User',
    underscored: false,
    timestamps: true,
    defaultScope: {
      attributes: {
        exclude: ['password', 'reset_token', 'googleId'] // Don't return sensitive data by default
      }
    },
    scopes: {
      withSensitiveData: {
        attributes: { include: ['password', 'reset_token', 'googleId'] }
      }
    }
  });
  return User;
};
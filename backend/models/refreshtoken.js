'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class RefreshToken extends Model {
    static associate(models) {
      // Define association to User
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE'
      });
    }

    // Instance method to check if token is expired
    isExpired() {
      return this.expiresAt < new Date();
    }

    // Instance method to revoke the token
    async revoke(replacedByToken = null) {
      this.revoked = true;
      if (replacedByToken) {
        this.replacedByToken = replacedByToken;
      }
      await this.save();
    }
  }

  RefreshToken.init({
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    revoked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    replacedByToken: {
      type: DataTypes.STRING,
      allowNull: true
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
    modelName: 'RefreshToken',
    tableName: 'RefreshTokens',
    timestamps: true,
    underscored: false,  // Explicitly set to false since we're using camelCase
    indexes: [
      {
        fields: ['token'],
        unique: true
      },
      {
        fields: ['userId']
      }
    ]
  });

  return RefreshToken;
};
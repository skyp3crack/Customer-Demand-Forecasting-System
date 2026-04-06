require('dotenv').config();

module.exports = {
  development: {
    dialect: 'mysql',
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    logging: process.env.APPLICATION_DEBUG === 'true' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
    },
    dialectOptions: {
      decimalNumbers: true,
    },
  },
  test: {
    dialect: 'mysql',
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
      decimalNumbers: true,
    },
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  },
};

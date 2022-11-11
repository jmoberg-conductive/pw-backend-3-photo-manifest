const KNEX_LIB = require('knex');
const mysql = require('mysql');

const config = {
  production_read_replica: {
    client: 'mysql',
    connection: {
      host: process.env.DATABASE_URL_RO,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME
    },
    pool: { min: 0, max: 10 }
  },
  production_write_replica: {
    client: 'mysql',
    connection: {
      host: process.env.DATABASE_URL,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME
    },
    pool: { min: 0, max: 10 }
  },
  dev: {
    client: 'mysql',
    connection: {
      host: process.env.DATABASE_URL,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME
    },
    pool: { min: 0, max: 10 }
  }
};

// We use read replica for web ui reports
const KNEX_READ = KNEX_LIB(process.env.APP_STAGE === 'production' ? config.production_read_replica : config.dev);
const KNEX = KNEX_LIB(process.env.APP_STAGE === 'production' ? config.production_write_replica : config.dev);

module.exports = {
  KNEX,
  KNEX_READ
};
const { USER_TABLE_NAME } = require('../db-tables');

const getUserByUsername = async (KNEX, username) => {
  try {
    if (!username) {
      console.log('Username is not provided');
      return null;
    }
    const result = await KNEX(USER_TABLE_NAME)
      .where('userName', username)
      .first();
    return result && result.id ? result.id : null;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getUserByUsername
}
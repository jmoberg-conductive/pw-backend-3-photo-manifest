const { UPLOAD_STATUS_TABLE_NAME } = require('../db-tables');

const createUploadStatus = async (KNEX, status) => {
  try {
    await KNEX(UPLOAD_STATUS_TABLE_NAME).insert(status);
  } catch (error) {
    throw error;
  }
}

const updateUploadStatus = async (KNEX, status) => {
  try {
    await KNEX(UPLOAD_STATUS_TABLE_NAME)
      .where('id', status.id)
      .update(status)
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createUploadStatus,
  updateUploadStatus
}
const UUID = require('uuid/v1');
const { PHOTO_TABLE_NAME } = require('../db-tables');

const getAllPhotosNames = async (KNEX) => {
  try {
    let data = await KNEX('name').from(PHOTO_TABLE_NAME);
    return data.map(item => item.name);
  } catch (error) {
    throw error;
  }
}

const addPhoto = async (KNEX, photoData, callback) => {
  const { workOrderId, photoType, file, name } = photoData;
  return new Promise((resolve, reject) => {
    try {
      KNEX.transaction(trx => {
        const data = {
          id: UUID(),
          name,
          owner: 'System',
          visibility: 'public',
          file,
          photoType,
          workOrderId
        };
        KNEX(PHOTO_TABLE_NAME)
          .transacting(trx)
          .insert(data)
          .then(async () => {
            await callback();
          })
          .then(() => {
            trx.commit();
            console.log(`A new photo has been added id: ${data.id} name: ${data.name}`);
            resolve();
          })
          .catch((error) => {
            trx.rollback(error);
            reject(error);
          });
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  getAllPhotosNames,
  addPhoto
}
const { INVENTORY_TABLE_NAME } = require('../db-tables');

const getAllInventoriesByProjectId = async (KNEX, projectId) => {
  try {
    const inventories = await KNEX(INVENTORY_TABLE_NAME)
      .select(['assetNumber', 'mfgSerialNumber'])
      .where('projectId', projectId)
    return inventories;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getAllInventoriesByProjectId
}
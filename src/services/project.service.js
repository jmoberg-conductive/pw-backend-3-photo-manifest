const { PROJECT_TABLE_NAME } = require('../db-tables');

const getProjectIdByBucketName = async (KNEX, bucketName) => {
  try {
    if (!bucketName) {
      console.log('Bucket name is not provided');
      return null;
    }
    const result = await KNEX(PROJECT_TABLE_NAME)
      .where('projectBucket', bucketName)
      .first();
    return result && result.id ? result.id : null;
  } catch (error) {
    throw error;
  }
}

const getProjectBucketNameByProjectId = async (KNEX, projectId) => {
  try {
    if (!projectId) {
      console.log('Project id is not provided');
      return null;
    }
    const result = await KNEX(PROJECT_TABLE_NAME)
      .where('id', projectId)
      .first();
    return result && result.projectBucket ? result.projectBucket : null;
  } catch (error) {
    throw error;
  }
}

const getProjectConfigByProjectId = async (KNEX, projectId) => {
  try {
    if (!projectId) {
      console.log('Project id is not provided');
      return null;
    }
    const result = await KNEX(PROJECT_TABLE_NAME)
      .select('projectConfiguration')
      .where('id', projectId)
      .first();
    return result && result.projectConfiguration ? JSON.parse(result.projectConfiguration) : null;
  } catch (error) {
    throw error;
  }
}

const getProjectById = async (KNEX, projectId) => {
  try {
    if (!projectId) {
      console.log('Project id is not provided');
      return null;
    }
    const result = await KNEX(PROJECT_TABLE_NAME)
      .select([
        'projectShortCode',
        'projectConfiguration',
        'projectBucket',
        'projectTimeZone',
        'tenantId'
      ])
      .where('id', projectId)
      .first();
    return result;
  } catch (error) {
    throw error;
  }
}

const getAllProjects = async (KNEX, tenantId) => {
  try {
    const result = await KNEX(PROJECT_TABLE_NAME).where('tenantId', tenantId);
    return result;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getProjectIdByBucketName,
  getProjectBucketNameByProjectId,
  getProjectConfigByProjectId,
  getProjectById,
  getAllProjects
}
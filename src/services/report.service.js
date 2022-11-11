const { QUERY_TYPES } = require('./query/query.types');
const { buildQuery } = require('./query/query.builder');

const getExceptionReportData = async (KNEX, projectId, fromDate, toDate) => {
  try {
    if (!projectId) throw 'Error. Missing params projectId';
    if (!fromDate || !toDate) throw 'Error. Missing params fromDate/toDate';
    const dateFormatPattern = new RegExp('^[0-9]{4}-[0-9]{2}-[0-9]{2}$');
    if (!dateFormatPattern.test(fromDate) || !dateFormatPattern.test(toDate)) throw 'Error. Date format is invalid';
    const result = await KNEX.raw(buildQuery(QUERY_TYPES.GET_EXCEPTION_REPORT_DATA)({ projectId, fromDate, toDate }));
    return result ? result : null;
  } catch (error) {
    throw error;
  }
}

const getConditionReportData = async (KNEX, projectId, fromDate, toDate) => {
  try {
    if (!projectId) throw 'Error. Missing params projectId';
    if (!fromDate || !toDate) throw 'Error. Missing params fromDate/toDate';
    const dateFormatPattern = new RegExp('^[0-9]{4}-[0-9]{2}-[0-9]{2}$');
    if (!dateFormatPattern.test(fromDate) || !dateFormatPattern.test(toDate)) throw 'Error. Date format is invalid';
    const result = await KNEX.raw(buildQuery(QUERY_TYPES.GET_CONDITION_REPORT_DATA)({ projectId, fromDate, toDate }));
    return result ? result : null;
  } catch (error) {
    throw error;
  }
}

const getMeterDeployAssignmentsReportData = async (KNEX, projectId) => {
  try {
    if (!projectId) throw 'Error. Missing params projectId';
    const result = await KNEX.raw(buildQuery(QUERY_TYPES.GET_METER_DEPLOY_ASSIGNMENTS_REPORT_DATA)({ projectId }));
    return result ? result : null;
  } catch (error) {
    throw error;
  }
}

const getWaterMeterDeployAssignmentsReportData = async (KNEX, projectId) => {
  try {
    if (!projectId) throw 'Error. Missing params projectId';
    const result = await KNEX.raw(buildQuery(QUERY_TYPES.GET_WATER_METER_DEPLOY_ASSIGNMENTS_REPORT_DATA)({ projectId }));
    return result ? result : null;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getExceptionReportData,
  getConditionReportData,
  getMeterDeployAssignmentsReportData,
  getWaterMeterDeployAssignmentsReportData
}
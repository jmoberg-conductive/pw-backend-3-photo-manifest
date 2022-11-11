const { QUERY_TYPES } = require('./query/query.types');
const { buildQuery } = require('./query/query.builder');
const { WORKORDER_TABLE_NAME, WORKORDER_METER_DEPLOY_TABLE_NAME } = require('../db-tables');

const customFilters = {
  'Custom: Needs Appointment': 'Custom: Needs Appointment',
  'Custom: Needs Site Test': 'Custom: Needs Site Test'
}

const listWorkOrdersByWorkOrderType = async (knex, args) => {
  try {
    let search = args.search || '';
    let multipleValuesSearch = args.multipleValuesSearch || [];
    let filter = args.filter || '';

    let statusFilterSql = '';
    let districtFilterSql = '';
    let substationFilterSql = '';
    let circuitFilterSql = '';
    let cycleFilterSql = '';
    let routeFilterSql = '';
    let bookFilterSql = '';
    let formFilterSql = '';
    let userFilterSql = '';
    let needsAppointmentFilterSql = '';
    let needsSiteTestFilterSql = '';

    const getFilterValue = (filter) => {
      return filter.split(':')[1].substring(1);
    }

    if (filter) {
      for (let i = 0; i < filter.length; i++) {
        // needsAppointmentFilterSql
        if (filter[i] === customFilters['Custom: Needs Appointment']) {
          needsAppointmentFilterSql += "WorkOrder.workOrderNeedsAppointment = 1";
        }
        // needsSiteTestFilterSql
        if (filter[i] === customFilters['Custom: Needs Site Test']) {
          needsSiteTestFilterSql += "WorkOrder.workOrderNeedsSiteTest = 1";
        }
        // statusFilterSql
        if (filter[i].startsWith('Status:')) {
          statusFilterSql += statusFilterSql ? ` or WorkOrder.workOrderStatus = '${getFilterValue(filter[i])}'` : `WorkOrder.workOrderStatus = '${getFilterValue(filter[i])}'`;
        }
        // districtFilterSql
        if (filter[i].startsWith('District:')) {
          districtFilterSql += districtFilterSql ? ` or WorkOrder.districtCode = '${getFilterValue(filter[i])}'` : `WorkOrder.districtCode = '${getFilterValue(filter[i])}'`;
        }
        // substationFilterSql
        if (filter[i].startsWith('Substation:')) {
          substationFilterSql += substationFilterSql ? ` or WorkOrder.substationCode = '${getFilterValue(filter[i])}'` : `WorkOrder.substationCode = '${getFilterValue(filter[i])}'`;
        }
        // substationFilterSql
        if (filter[i].startsWith('Circuit:')) {
          circuitFilterSql += circuitFilterSql ? ` or WorkOrder.circuitCode = '${getFilterValue(filter[i])}'` : `WorkOrder.circuitCode = '${getFilterValue(filter[i])}'`;
        }
        // substationFilterSql
        if (filter[i].startsWith('Cycle:')) {
          cycleFilterSql += cycleFilterSql ? ` or WorkOrder.billingCycleCode = '${getFilterValue(filter[i])}'` : `WorkOrder.billingCycleCode = '${getFilterValue(filter[i])}'`;
        }
        // substationFilterSql
        if (filter[i].startsWith('Route:')) {
          routeFilterSql += routeFilterSql ? ` or WorkOrder.routeCode = '${getFilterValue(filter[i])}'` : `WorkOrder.routeCode = '${getFilterValue(filter[i])}'`;
        }
        // substationFilterSql
        if (filter[i].startsWith('Book:')) {
          bookFilterSql += bookFilterSql ? ` or WorkOrder.bookCode = '${getFilterValue(filter[i])}'` : `WorkOrder.bookCode = '${getFilterValue(filter[i])}'`;
        }
        // substationFilterSql
        if (filter[i].startsWith('Form Factor:')) {
          formFilterSql += formFilterSql ? ` or WorkOrderMeterDeploy.meterFormFactor = '${getFilterValue(filter[i])}'` : `WorkOrderMeterDeploy.meterFormFactor = '${getFilterValue(filter[i])}'`;
        }
        // userFilterSql
        if (filter[i].startsWith('User:')) {
          userFilterSql += userFilterSql ? ` or workOrderAssignments like '%${getFilterValue(filter[i])}%'` : `workOrderAssignments like '%${getFilterValue(filter[i])}%'`;
        }
      }
    }

    if (needsAppointmentFilterSql) {
      needsAppointmentFilterSql = ` and ${needsAppointmentFilterSql}`;
    }
    if (needsSiteTestFilterSql) {
      needsSiteTestFilterSql = ` and ${needsSiteTestFilterSql}`;
    }
    if (statusFilterSql) {
      statusFilterSql = ` and (${statusFilterSql})`;
    }
    if (districtFilterSql) {
      districtFilterSql = ` and (${districtFilterSql})`;
    }
    if (substationFilterSql) {
      substationFilterSql = ` and (${substationFilterSql})`;
    }
    if (circuitFilterSql) {
      circuitFilterSql = ` and (${circuitFilterSql})`;
    }
    if (cycleFilterSql) {
      cycleFilterSql = ` and (${cycleFilterSql})`;
    }
    if (routeFilterSql) {
      routeFilterSql = ` and (${routeFilterSql})`;
    }
    if (bookFilterSql) {
      bookFilterSql = ` and (${bookFilterSql})`;
    }
    if (formFilterSql) {
      formFilterSql = ` and (${formFilterSql})`;
    }

    const filterRawSql = needsAppointmentFilterSql + needsSiteTestFilterSql + statusFilterSql + districtFilterSql + substationFilterSql + circuitFilterSql + cycleFilterSql + routeFilterSql + bookFilterSql + formFilterSql;

    if (multipleValuesSearch.length > 0) {
      search = " AND (";
      multipleValuesSearch.forEach((value, index) => {
        search = search + `WorkOrderMeterDeploy.oldMeterNumber like '%${value}%' or WorkOrderMeterDeploy.newMeterNumber like '%${value}%' or WorkOrder.street like '%${value}%' or WorkOrder.customerName like '%${value}%' or WorkOrderMeterDeploy.newMeterAssetNumber like '%${value}%' or WorkOrder.workOrderNumber like '%${value}%'${index !== multipleValuesSearch.length - 1 ? 'or ' : ')'}`;
      })
    } else if (search != '') {
      search = " AND (WorkOrderMeterDeploy.oldMeterNumber like '%" + search + "%' or WorkOrderMeterDeploy.newMeterNumber like '%" + search + "%' or WorkOrder.street like '%" + search + "%' or WorkOrder.customerName like '%" + search + "%' or WorkOrder.workOrderNumber like '%" + search + "%' or WorkOrderMeterDeploy.newMeterAssetNumber like '%" + search + "%')";
    }

    // TODO: Implement switch on workOrderType, defaults to MeterDeploy
    let result = {};

    let queryResult = await knex.raw(
      `
        select 
        SQL_CALC_FOUND_ROWS
        WorkOrder.id, 
        WorkOrder.workOrderType, 
        WorkOrder.workOrderNumber, 
        WorkOrder.workOrderStatus, 
        WorkOrder.workOrderNeedsAppointment, 
        WorkOrder.workOrderNeedsSiteTest, 
        WorkOrder.workOrderFlaggedAsCNC, 
        WorkOrder.workOrderFlaggedAs3strike, 
        WorkOrder.workOrderFlaggedAsAdHoc, 
        WorkOrder.workOrderIsInBlackOut, 
        WorkOrder.workOrderFlaggedAsDamaged, 
        WorkOrder.workOrderFlaggedAsPlated, 
        WorkOrder.workOrderFlaggedAsEscalated, 
        WorkOrder.districtCode, 
        WorkOrder.substationCode, 
        WorkOrder.circuitCode, 
        WorkOrder.billingCycleCode, 
        WorkOrder.routeCode, 
        WorkOrder.bookCode, 
        WorkOrder.street, 
        WorkOrder.latitude, 
        WorkOrder.longitude, 
        WorkOrder.workOrderAttemptNumber, 
        WorkOrder.workOrderLastVisitDate, 
        WorkOrder.workOrderGroups, 
        WorkOrder.accountNumber, 
        WorkOrder.customerName, 
        WorkOrderMeterDeploy.oldMeterNumber, 
        WorkOrderMeterDeploy.newMeterNumber, 
        WorkOrderMeterDeploy.meterFormFactor, 
        WorkOrderMeterDeploy.newMeterAssetNumber, 
        group_concat(User.userName separator ' | ') as workOrderAssignments,
        (select User.userName from User where User.id = WorkOrder.workOrderResourceUserId) as technician
        from WorkOrder  
        left join WorkOrderMeterDeploy on WorkOrder.id = WorkOrderMeterDeploy.workOrderId 
        left join ProjectUserWorkOrder on WorkOrder.id = ProjectUserWorkOrder.workOrderId 
        left join User on ProjectUserWorkOrder.userId = User.id 
        where WorkOrder.latitude between -90 and 90 and WorkOrder.longitude between -180 and 180 and WorkOrder.projectId = '${args.project}' ${filterRawSql} ${search} 
        group by WorkOrder.id
        ${userFilterSql.length > 0 ? `having ${userFilterSql}` : ''} order by workOrderLastVisitDate DESC, workOrderNumber ASC;
      `
    );

    result.items = queryResult && queryResult[0] ? queryResult[0] : [];

    if (result.items) {
      for (let i = 0; i < result.items.length; i++) {
        if (result.items[i].workOrderReasonCodes) {
          result.items[i].workOrderReasonCodes = JSON.parse(result.items[i].workOrderReasonCodes);
        }
        if (result.items[i].workOrderSiteConditions) {
          result.items[i].workOrderSiteConditions = JSON.parse(result.items[i].workOrderSiteConditions);
        }
        if (result.items[i].workOrderGroups) {
          result.items[i].workOrderGroups = JSON.parse(result.items[i].workOrderGroups);
        }
        if (result.items[i].customDataFields) {
          result.items[i].customDataFields = JSON.parse(result.items[i].customDataFields);
        }
      }
    }

    queryResult = await knex.select(knex.raw('FOUND_ROWS() as resultCount')).first();
    const { resultCount = 0 } = queryResult;
    result.resultCount = resultCount;

    return Promise.resolve(result);
  } catch (error) {
    throw error;
  }
}

const resetAllBlackOutFlagsByProjectId = async (KNEX, projectId) => {
  try {
    await KNEX.raw(buildQuery(QUERY_TYPES.RESET_ALL_BLACKOUT_FLAGS_BY_PROJECT_ID)({ projectId }));
  } catch (error) {
    throw error;
  }
}

const setBlackOutFlagByProjectIdAndDate = async (KNEX, projectId, date) => {
  try {
    await KNEX.raw(buildQuery(QUERY_TYPES.SET_BLACKOUT_FLAGS_BY_PROJECT_ID_AND_DATE)({ projectId, date }));
  } catch (error) {
    throw error;
  }
}

const batchInsertWorkOrderAndMeterDeploy = (KNEX, data) => {
  return new Promise((resolve, reject) => {
    const workOrders = data[WORKORDER_TABLE_NAME];
    const workOrdersMeterDeploy = data[WORKORDER_METER_DEPLOY_TABLE_NAME];
    if (workOrders && workOrders.length > 0 && workOrdersMeterDeploy && workOrdersMeterDeploy.length > 0) {
      if (workOrders.length === workOrdersMeterDeploy.length) {
        KNEX.transaction(tr => {
          return KNEX.batchInsert(WORKORDER_TABLE_NAME, workOrders)
            .transacting(tr)
        })
          .then(() => {
            KNEX.transaction(tr => {
              return KNEX.batchInsert(WORKORDER_METER_DEPLOY_TABLE_NAME, workOrdersMeterDeploy)
                .transacting(tr)
            })
              .then(() => { resolve() })
              .catch((error) => { reject(error) });
          })
          .catch((error) => { reject(error) });
      } else {
        reject('Error. Invalid data');
      }
    } else {
      reject('Error. Invalid data');
    }
  });
}

const updateWorkOrderStatusTransaction = async (KNEX, workOrder, trx) => {
  try {
    const id = workOrder.id;
    if (!id) throw 'Error. Missing params work order id';
    return KNEX(WORKORDER_TABLE_NAME)
      .where('id', id)
      .update({ workOrderStatus: 'Closed', workOrderClosedDate: new Date() })
      .transacting(trx)
  } catch (error) {
    throw error;
  }
}

const updateWorkOrderAndMeterDeployExchangedByUtilityTransaction = async (KNEX, workOrder, trx) => {
  try {
    const id = workOrder.id;
    delete workOrder['id'];
    if (!id) throw 'Error. Missing params work order id';
    return KNEX(WORKORDER_TABLE_NAME)
      .leftJoin(WORKORDER_METER_DEPLOY_TABLE_NAME, 'WorkOrder.id', 'WorkOrderMeterDeploy.workOrderId')
      .where('id', id)
      .update({
        workOrderLastVisitDate: new Date(),
        workOrderIsDeleted: true,
        workOrderDeletedDate: new Date(),
        workOrderStatus: 'Closed',
        workOrderClosedDate: new Date(),
        workOrderReasonCodes: '["Exchanged by Utility"]'
      })
      .transacting(trx)
  } catch (error) {
    throw error;
  }
}

const updateWorkOrderAndMeterDeployTransaction = async (KNEX, workOrder, trx) => {
  try {
    const id = workOrder.id;
    delete workOrder['id'];
    if (!id) throw 'Error. Missing params work order id';
    return KNEX(WORKORDER_TABLE_NAME)
      .leftJoin(WORKORDER_METER_DEPLOY_TABLE_NAME, 'WorkOrder.id', 'WorkOrderMeterDeploy.workOrderId')
      .where('id', id)
      .update(workOrder)
      .transacting(trx)
  } catch (error) {
    throw error;
  }
}

const updateWorkOrderAsExportedTransaction = async (KNEX, workOrder, trx) => {
  try {
    const id = workOrder.id;
    if (!id) throw 'Error. Missing params work order id';
    return KNEX(WORKORDER_TABLE_NAME)
      .where('id', id)
      .update({ workOrderPhotosExportedDate: new Date(), workOrderPhotosExported: true })
      .transacting(trx)
  } catch (error) {
    throw error;
  }
}

const getAllWorkOrdersByProjectId = async (KNEX, projectId) => {
  const data = await KNEX(WORKORDER_TABLE_NAME)
    .select(['WorkOrder.id', 'WorkOrder.locationId', 'WorkOrder.workOrderStatus', 'WorkOrderMeterDeploy.oldMeterNumber', 'WorkOrder.customDataFields'])
    .leftJoin(WORKORDER_METER_DEPLOY_TABLE_NAME, 'WorkOrder.id', 'WorkOrderMeterDeploy.workOrderId')
    .where('projectId', projectId)
  return data ? data : null;
}

const getAllLatestWorkOrdersByProjectId = async (KNEX, projectId, primaryKey) => {
  const data = await KNEX(WORKORDER_TABLE_NAME)
    .select(['WorkOrder.id', 'WorkOrder.locationId', 'WorkOrder.workOrderStatus', 'WorkOrderMeterDeploy.oldMeterNumber'])
    .leftJoin(WORKORDER_METER_DEPLOY_TABLE_NAME, 'WorkOrder.id', 'WorkOrderMeterDeploy.workOrderId')
    .where('projectId', projectId)
    .orderBy('createdDate')
  return data ? data : null;
}

const getAllWorkOrdersByProjectIdAndStatusNotClosed = async (KNEX, projectId) => {
  const data = await KNEX(WORKORDER_TABLE_NAME)
    .select(['WorkOrder.id', 'WorkOrder.locationId', 'WorkOrder.workOrderStatus', 'WorkOrderMeterDeploy.oldMeterNumber', 'WorkOrder.customDataFields'])
    .leftJoin(WORKORDER_METER_DEPLOY_TABLE_NAME, 'WorkOrder.id', 'WorkOrderMeterDeploy.workOrderId')
    .whereNot('workOrderStatus', 'Closed')
    .andWhere('projectId', projectId)
  return data ? data : null;
}

const getAllWorkOrdersByProjectIdAndStatusClosed = async (KNEX, projectId) => {
  const data = await KNEX.raw(
    `select wo1.id, workOrderNumber, workOrderClosedDate, oldMeterNumber, locationId, workOrderStatus, sub.round
    from WorkOrder wo1
    left join (select id, locationId as loc, count(*) as round from WorkOrder where projectId = '${projectId}' group by locationId) sub on sub.loc = wo1.locationId
    left join WorkOrderMeterDeploy on wo1.id = WorkOrderMeterDeploy.workOrderId
    where projectId = '${projectId}'
    order by workOrderClosedDate;`
  );
  return data && data[0].length > 0 ? data[0] : null;
}

const getClosedAndNotExportedWorkOrdersCount = async (KNEX, projectId) => {
  try {
    const data = await KNEX(WORKORDER_TABLE_NAME)
      .where('projectId', projectId)
      .andWhere('workOrderStatus', 'Closed')
      .andWhere('workOrderPhotosExported', false)
      .andWhere('workOrderIsDeleted', false)
      .count('id as result')
      .first()
    return data && data.result ? data.result : 0;
  } catch (error) {
    throw error;
  }
}

const getAllClosedAndNotExportedWorkOrdersPhotos = async (KNEX, projectId) => {
  try {
    const data = await KNEX.raw(`SELECT distinct locationId, recordLocator, photoType, newMeterNumber, newMeterAssetNumber, oldMeterNumber, accountNumber, customerName, Photo.name, WorkOrder.id, WorkOrder.workOrderReasonCodes FROM (SELECT * FROM peakworkflowdb.WorkOrder WHERE projectId = '${projectId}' AND workOrderPhotosExported = false AND workOrderStatus = 'Closed' AND workOrderIsDeleted = false order by workOrderLastVisitDate limit 1000) as WorkOrder LEFT JOIN peakworkflowdb.Photo on Photo.workOrderId = WorkOrder.id LEFT JOIN peakworkflowdb.WorkOrderMeterDeploy on WorkOrderMeterDeploy.workOrderId = WorkOrder.id;`);
    return data[0];
  } catch (error) {
    throw error;
  }
}

const getWorkOrdersWaterMeterDeployCount = async (KNEX, projectId) => {
  try {
    const data = await KNEX(WORKORDER_TABLE_NAME)
      .count('workOrderType as count')
      .where('projectId', projectId)
      .andWhere('workOrderType', 'WaterMeterDeploy')
      .first();
    return data.count;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  resetAllBlackOutFlagsByProjectId,
  setBlackOutFlagByProjectIdAndDate,
  batchInsertWorkOrderAndMeterDeploy,
  updateWorkOrderStatusTransaction,
  updateWorkOrderAndMeterDeployTransaction,
  updateWorkOrderAndMeterDeployExchangedByUtilityTransaction,
  getAllWorkOrdersByProjectIdAndStatusNotClosed,
  getAllWorkOrdersByProjectIdAndStatusClosed,
  getAllWorkOrdersByProjectId,
  getClosedAndNotExportedWorkOrdersCount,
  getAllClosedAndNotExportedWorkOrdersPhotos,
  updateWorkOrderAsExportedTransaction,
  getAllLatestWorkOrdersByProjectId,
  getWorkOrdersWaterMeterDeployCount,
  listWorkOrdersByWorkOrderType
}
const AWS = require('aws-sdk');
const UUID = require('uuid/v1');
const GEO_JSON = require('geojson');
const {
  WORKORDER_TABLE_NAME,
  WORKORDER_METER_DEPLOY_TABLE_NAME,
  INVENTORY_TABLE_NAME,
  USER_TABLE_NAME,
  USER_ROLE_TABLE_NAME,
  PROJECT_USER_TABLE_NAME,
} = require('./db-tables');
const XML2JS = require('xml2js').parseString;
const { createCsv } = require('./csv-builder');
const ZLIB = require('zlib');
const { KNEX, KNEX_READ } = require('./knexfile');
const { getAllInventoriesByProjectId } = require('./services/inventory.service');
const { parseCSV } = require('./csv-parser');
const {
  resetAllBlackOutFlagsByProjectId,
  setBlackOutFlagByProjectIdAndDate,
  batchInsertWorkOrderAndMeterDeploy,
  updateWorkOrderStatusTransaction,
  updateWorkOrderAndMeterDeployTransaction,
  getAllWorkOrdersByProjectIdAndStatusNotClosed,
  getAllWorkOrdersByProjectIdAndStatusClosed,
  getAllWorkOrdersByProjectId,
  getAllLatestWorkOrdersByProjectId,
  updateWorkOrderAndMeterDeployExchangedByUtilityTransaction,
  getClosedAndNotExportedWorkOrdersCount,
  getAllClosedAndNotExportedWorkOrdersPhotos,
  updateWorkOrderAsExportedTransaction,
  getWorkOrdersWaterMeterDeployCount
} = require('./services/workOrder.service');
const { getUserByUsername } = require('./services/user.service');
const {
  getProjectIdByBucketName,
  getProjectBucketNameByProjectId,
  getProjectConfigByProjectId,
  getProjectById,
  getAllProjects,
} = require('./services/project.service');
const { getTodaysDate } = require('./helpers/date');
const { DATE_FORMATS } = require('./helpers/date.types');
const { UTC_DATE_FORMATS } = require('./helpers/utcDate.types');
const { formatUTCDate } = require('./helpers/utcDate');
const {
  getExceptionReportData,
  getConditionReportData,
  getMeterDeployAssignmentsReportData,
  getWaterMeterDeployAssignmentsReportData
} = require('./services/report.service');
const photoService = require('./services/photo.service');
const uploadStatusService = require('./services/uploadStatus.service');
const MULTIPART_PARSER = require('lambda-multipart-parser');
const READLINE = require('readline');
const PHOTO_MANIFEST_BUILDER = require('./photo-manifest-builder');
const NISC_PHOTO_MANIFEST_BUILDER = require('./photo-manifest-builder/indexV2');
const moment = require('moment-timezone');
const { listWorkOrdersByWorkOrderType } = require('./services/workOrder.service');

let PROJECT_DATA_MAPPER = require('./project-data-maps');
PROJECT_DATA_MAPPER = PROJECT_DATA_MAPPER[process.env.APP_STAGE];

const COMMON_BUCKET = process.env.APP_STAGE === 'production' ? process.env.COMMON_BUCKET_PRODUCTION : process.env.COMMON_BUCKET_DEV;

const S3 = new AWS.S3();
const SNS = new AWS.SNS();

const getFile = (event) => {
  return {
    bucket: event.Records[0].s3.bucket.name,
    filename: event.Records[0].s3.object.key.split('+').join(' ')
  };
};

const getQueryData = (row, columnMappings, tableSpecialColumnsHandler) => {
  let record = {};
  Object.keys(columnMappings).forEach(columnName => {
    if (columnName === 'customDataFields') {
      columnMappings[columnName].forEach(customColumn => {
        if (row[customColumn] !== null && row[customColumn] !== undefined) {
          record[columnName] = [...record[columnName] || [], { key: customColumn, type: 'String', value: row[customColumn] }];
        }
      });
      if (!record.hasOwnProperty(columnName)) {
        record[columnName] = [];
      }
    } else if (row[columnMappings[columnName]]) {
      if (columnName === 'locationId' || columnName === 'oldMeterNumber') {
        record[columnName] = row[columnMappings[columnName]] + '';
      } else {
        record[columnName] = row[columnMappings[columnName]];
      }
    }
  });
  if (tableSpecialColumnsHandler) {
    record = tableSpecialColumnsHandler(record, row);
  }
  return record;
}

const batchUpdate = (workOrders, callback) => {
  return new Promise((resolve, reject) => {
    KNEX.transaction(trx => {
      const queries = workOrders.map((workOrder) => {
        return callback(KNEX, workOrder, trx);
      });
      Promise.all(queries)
        .then(() => {
          trx.commit();
          resolve();
        })
        .catch((error) => {
          trx.rollback();
          resolve(error);
        });
    })
      .then()
      .catch(error => reject(error));
  });
}

const syncCustomDataFields = (oldWorkOrder, columnName, queryData) => {
  let result = [...(JSON.parse(oldWorkOrder[columnName]) || [])];
  queryData[columnName].forEach(newItem => {
    const oldResultIndex = result.findIndex(oldItem => oldItem.key === newItem.key);
    if (oldResultIndex > -1) {
      result.splice(oldResultIndex, 1);
    }
    result.push(newItem);
  });
  return result;
}

const getUpdatableColumns = ({ queryData, canUpdateOnSync, oldWorkOrder }) => {
  const columns = {};
  const newRecordColumns = Object.keys(queryData);
  for (let columnName of canUpdateOnSync) {
    if (columnName === 'customDataFields') {
      if (Object.keys(queryData).indexOf(columnName)) {
        const newCustomDataFields = syncCustomDataFields(oldWorkOrder, columnName, queryData);
        if (newCustomDataFields.length > 0) {
          columns[columnName] = JSON.stringify(newCustomDataFields);
        }
        continue;
      }
    } else if (newRecordColumns.indexOf(columnName) > -1) {
      columns[columnName] = queryData[columnName];
    }
  };
  return columns;
}

const onImportFinished = async (file, success) => {
  await S3.copyObject({
    Bucket: file.bucket,
    CopySource: `${file.bucket}/${file.filename}`,
    Key: `Automated Data From Utility/${success ? 'Processed Files' : 'Failed Files'}/${file.filename.split('/')[1].split('.')[0]}`
  }).promise();
  await S3.deleteObject({
    Bucket: file.bucket,
    Key: `Automated Data From Utility/${file.filename.split('/')[1]}`
  }).promise();
}

const filterInventoriesByAssetNumberOrMfgSerialNumber = (inventories, value) => {
  return inventories.filter(inventory => inventory['assetNumber'] === value || inventory['mfgSerialNumber'] === value);
}

const applyDataMapping = (csvData, workOrderTableColumnMappings, workOrderTableSpecialColumnsHandler, workOrderMeterDeployTableColumnMappings, workOrderMeterDeployTableSpecialColumnsHandler) => {
  const result = [];
  for (let i = 0; i < csvData.length; i++) {
    const csvDataRow = csvData[i];
    const workOrderQueryData = getQueryData(csvDataRow, workOrderTableColumnMappings, workOrderTableSpecialColumnsHandler);
    const workOrderMeterDeployQueryData = getQueryData(csvDataRow, workOrderMeterDeployTableColumnMappings, workOrderMeterDeployTableSpecialColumnsHandler);
    result.push({ workOrderQueryData, workOrderMeterDeployQueryData });
  }
  return result;
}

const getFileLineCount = ({ bucket, filename }) => {
  const file = S3.getObject({ Bucket: bucket, Key: filename }).createReadStream();
  const readlineStream = READLINE.createInterface({ input: file, terminal: false });
  return new Promise((resolve, reject) => {
    let totalLineCount = 0;
    readlineStream.on('line', (line) => {
      totalLineCount += 1;
    });
    readlineStream.on('close', () => {
      resolve(totalLineCount - 1);
    });
  });
}

getWorkOrdersByPrimaryKey = async (callback, projectId, primaryKey) => {
  const dbWorkOrders = await callback(KNEX, projectId, primaryKey);
  const result = {};
  dbWorkOrders.forEach(workOrder => result[workOrder[primaryKey]] = workOrder);
  return result;
}

setWorkOrderRoundNumber = (workOrderNumber, oldMeterNumber, round) => {
  if (workOrderNumber.indexOf('|') > -1) {
    const prependValue = workOrderNumber.split(' ').join('').split('|')[1];
    return `${oldMeterNumber}-R${round} | ${prependValue}`;
  }
  return `${workOrderNumber}-R${round}`;
}

const importInventoriesToDatabase = async ({ bucket, filename }, projectId, fileType) => {
  try {
    // file inventories
    let inventories = fileType === 'csv' ?
      await parseCSV({ bucket, filename })
      :
      await parseXML({ Bucket: bucket, Key: filename });

    const inventoriesFileCountMessage = `inventory file line count: ${inventories.length || 0}`;

    console.log(inventoriesFileCountMessage);

    // fetch all inventories from db
    const dbInventories = {};
    let results = await getAllInventoriesByProjectId(KNEX, projectId);
    results.forEach(inventory => dbInventories[inventory.mfgSerialNumber] = inventory);

    // filter only new inventories
    inventories = inventories.filter(inventory => {
      if (!dbInventories[inventory.mfgSerialNumber]) {
        return inventory;
      }
    });
    inventories = inventories.map(inventory => {
      return { id: UUID(), projectId, ...inventory }
    });
    await inventoriesBatchInsert({
      [INVENTORY_TABLE_NAME]: inventories
    });

    const newInventoriesCountMessage = `new inventory imported count: ${inventories.length || 0}`;
    console.log(newInventoriesCountMessage);

    filename = filename.split('/');
    filename = filename[filename.length - 1];

    return `File: ${filename}; ${inventoriesFileCountMessage}; ${newInventoriesCountMessage}`
  } catch (error) {
    throw error;
  }
}

const xmlParser = async (event) => {
  try {
    const projectId = await getProjectIdByBucketName(KNEX, event.bucket);
    console.log(`*** XML PARSING HAS BEEN TRIGGERD FOR PROJECT ID: ${projectId}`);
    const keys = event.keys;
    for (let key of keys) {
      console.log(`Parsing file: ${key}`);
      await importInventoriesToDatabase({ bucket: event.bucket, filename: key }, projectId);
    }
  } catch (error) {
    console.log(error, error.stack);
  }
};

const importInventoriesHandler = async (event) => {
  try {
    var file = getFile(event);
    var projectId = await getProjectIdByBucketName(KNEX, file.bucket);
  } catch (error) {
    console.log(error);
  }

  const importStatuses = {
    Pending: 'Pending',
    Error: 'Error',
    Finished: 'Finished'
  };
  const currentImportStatus = {
    id: UUID(),
    status: importStatuses.Pending,
    message: '',
    projectId
  };

  try {
    await uploadStatusService.createUploadStatus(KNEX, currentImportStatus);
    console.log(`Bucket: ${file.bucket} Filename: ${file.filename}`);
    const fileType = file.filename.includes('.csv') ? 'csv' : 'xml';
    console.log(`File type: ${fileType}`);
    const message = await importInventoriesToDatabase(file, projectId, fileType);
    currentImportStatus.status = importStatuses.Finished;
    currentImportStatus.message = message;
    await uploadStatusService.updateUploadStatus(KNEX, currentImportStatus);
  } catch (error) {
    currentImportStatus.status = importStatuses.Error;
    currentImportStatus.message = 'An unexpected error occurred';
    await uploadStatusService.updateUploadStatus(KNEX, currentImportStatus);
    console.log(error);
  }
}

const handleExchangedByUtility = async (event) => {
  const file = getFile(event);
  try {
    const projetBucketName = file.bucket;
    console.log(`Has been triggered from project bucket : ${projetBucketName}`);

    const csvData = await parseCSV(file).catch((error) => {
      throw error;
    });

    const fileLineCount = await getFileLineCount(file);
    if (fileLineCount !== csvData.length) {
      console.log(`File lines count: ${fileLineCount}`);
      console.log(`Parsed lines count: ${csvData.length}`);
      throw `File: ${file.filename} is invalid`;
    }

    const skipExchangedByUtility = PROJECT_DATA_MAPPER[projetBucketName].shouldSkipExchangedByUtility ?
      PROJECT_DATA_MAPPER[projetBucketName].shouldSkipExchangedByUtility(csvData)
      :
      false;

    console.log(`skipExchangedByUtility: ${skipExchangedByUtility}`);

    if (!skipExchangedByUtility) {
      // Get table info
      const workOrderTable = PROJECT_DATA_MAPPER[projetBucketName].tables[WORKORDER_TABLE_NAME];
      const workOrderMeterDeployTable = PROJECT_DATA_MAPPER[projetBucketName].tables[WORKORDER_METER_DEPLOY_TABLE_NAME];

      // Get table special columns handler
      const workOrderTableSpecialColumnsHandler = PROJECT_DATA_MAPPER[projetBucketName].tables[WORKORDER_TABLE_NAME].tableSpecialColumnsHandler;
      const workOrderMeterDeployTableSpecialColumnsHandler = PROJECT_DATA_MAPPER[projetBucketName].tables[WORKORDER_METER_DEPLOY_TABLE_NAME].tableSpecialColumnsHandler;

      // Get table column mappings
      const workOrderTableColumnMappings = workOrderTable.columnMappings;
      const workOrderMeterDeployTableColumnMappings = workOrderMeterDeployTable.columnMappings;

      const projectId = await getProjectIdByBucketName(KNEX, projetBucketName);

      console.log(`Project ID: ${projectId}`);

      const primaryKey = PROJECT_DATA_MAPPER[projetBucketName].primaryKey;

      const dbWorkOrdersById = await getWorkOrdersByPrimaryKey(getAllLatestWorkOrdersByProjectId, projectId, primaryKey);

      const inboundWorkOrders = applyDataMapping(
        csvData,
        workOrderTableColumnMappings,
        workOrderTableSpecialColumnsHandler,
        workOrderMeterDeployTableColumnMappings,
        workOrderMeterDeployTableSpecialColumnsHandler
      );

      const dbWorkOrdersByStatus = {};

      for (let id of Object.keys(dbWorkOrdersById)) {
        if (dbWorkOrdersById[id].workOrderStatus === 'Open' || dbWorkOrdersById[id].workOrderStatus === 'InProgress' || dbWorkOrdersById[id].workOrderStatus === 'Assigned') {
          dbWorkOrdersByStatus[id] = dbWorkOrdersById[id];
        }
      }

      const inboundWorkOrdersById = {};
      inboundWorkOrders.forEach(({ workOrderQueryData, workOrderMeterDeployQueryData }) => {
        const workOrder = { ...workOrderQueryData, ...workOrderMeterDeployQueryData };
        const id = workOrder[primaryKey];
        inboundWorkOrdersById[id] = workOrder;
      });

      const exchangedByUtility = [];

      Object.keys(dbWorkOrdersByStatus).forEach(dbWorkOrderId => {
        const workOrder = inboundWorkOrdersById[dbWorkOrderId];
        if (!workOrder) {
          const dbWorkOrder = dbWorkOrdersByStatus[dbWorkOrderId];
          exchangedByUtility.push(dbWorkOrder);
        }
      });

      console.log(`Exchanged By Utility: ${exchangedByUtility.length}`);

      await batchUpdate(exchangedByUtility, updateWorkOrderAndMeterDeployExchangedByUtilityTransaction);
    }

    await new Promise((resolve, reject) => {
      SNS.publish({
        TopicArn: process.env.NODE_ENV === 'dev' ? process.env.SNS_DEV : process.env.SNS_PRODUCTION,
        Message: JSON.stringify({ file })
      }, (error, data) => {
        if (error) {
          reject(error);
        }
        resolve(data);
      })
    });

  } catch (error) {
    console.log(error);
    await onImportFinished(file, false);
  }
}

const removeDuplicates = (data, primaryKey) => {
  const temp = {};
  const reversedList = data.reverse();
  reversedList.forEach(item => temp[item[primaryKey]] = item);
  return Object.values(temp);
}

const importDataToMySQL = async (event) => {
  // Get file info
  const { file } = JSON.parse(event.Records[0].Sns.Message);
  try {
    const projetBucketName = file.bucket;
    const filename = file.filename;
    console.log(`*** IMPORT HAS BEEN TRIGGERED FOR ${projetBucketName}/${filename} ***`);

    // Extract data from file
    let csvData = await parseCSV(file).catch((error) => {
      throw error;
    });
    const dataCount = csvData.length;
    console.log(`Number of rows: ${dataCount}`);

    // Get table info
    const workOrderTable = PROJECT_DATA_MAPPER[projetBucketName].tables[WORKORDER_TABLE_NAME];
    const workOrderMeterDeployTable = PROJECT_DATA_MAPPER[projetBucketName].tables[WORKORDER_METER_DEPLOY_TABLE_NAME];

    const skipImport = PROJECT_DATA_MAPPER[projetBucketName].shouldSkipExchangedByUtility ?
      PROJECT_DATA_MAPPER[projetBucketName].shouldSkipExchangedByUtility(csvData)
      :
      false;

    console.log(`Skip import: ${skipImport}`);

    // Get table special columns handler
    const workOrderTableSpecialColumnsHandler = PROJECT_DATA_MAPPER[projetBucketName].tables[WORKORDER_TABLE_NAME].tableSpecialColumnsHandler;
    const workOrderMeterDeployTableSpecialColumnsHandler = PROJECT_DATA_MAPPER[projetBucketName].tables[WORKORDER_METER_DEPLOY_TABLE_NAME].tableSpecialColumnsHandler;

    const getWorkOrderId = PROJECT_DATA_MAPPER[projetBucketName].getWorkOrderId;

    // Get table column mappings
    const workOrderTableColumnMappings = workOrderTable.columnMappings;
    const workOrderMeterDeployTableColumnMappings = workOrderMeterDeployTable.columnMappings;

    const projectId = await getProjectIdByBucketName(KNEX, projetBucketName);
    const projectConfig = await getProjectConfigByProjectId(KNEX, projectId);

    const reuse = projectConfig && projectConfig.hasOwnProperty('reuse') ? projectConfig.reuse : false;
    console.log(`Re-use case: ${reuse}`);

    // Store file rows for batch insert
    let workOrdersRecords = [];
    let workOrdersMeterDeployRecords = [];

    // Store file rows for update
    let forUpdate = [];

    const inventories = await getAllInventoriesByProjectId(KNEX, projectId);

    const primaryKey = PROJECT_DATA_MAPPER[projetBucketName].primaryKey;

    let dbWorkOrdersByPrimaryKey;
    let dbClosedWorkOrdersByPrimaryKey;

    if (reuse) {
      dbWorkOrdersByPrimaryKey = await getWorkOrdersByPrimaryKey(getAllWorkOrdersByProjectIdAndStatusNotClosed, projectId, primaryKey);
      dbClosedWorkOrdersByPrimaryKey = await getWorkOrdersByPrimaryKey(getAllWorkOrdersByProjectIdAndStatusClosed, projectId, primaryKey);
    } else {
      dbWorkOrdersByPrimaryKey = await getWorkOrdersByPrimaryKey(getAllWorkOrdersByProjectId, projectId, primaryKey);
    }

    let reuseWorkOrdersCount = 0;

    csvData = removeDuplicates(csvData, primaryKey === 'locationId' ? workOrderTableColumnMappings.locationId : workOrderMeterDeployTableColumnMappings.oldMeterNumber);
    console.log(`duplicates: ${dataCount - csvData.length}`);

    for (let i = 0; i < csvData.length; i++) {
      const csvDataRow = csvData[i];
      const workOrderQueryData = getQueryData(csvDataRow, workOrderTableColumnMappings, workOrderTableSpecialColumnsHandler);
      const workOrderMeterDeployQueryData = getQueryData(csvDataRow, workOrderMeterDeployTableColumnMappings, workOrderMeterDeployTableSpecialColumnsHandler);
      const { oldMeterNumber } = workOrderMeterDeployQueryData;
      const filteredInventories = filterInventoriesByAssetNumberOrMfgSerialNumber(inventories, oldMeterNumber);
      if (filteredInventories.length === 0) {
        let workOrder = await getWorkOrderId(dbWorkOrdersByPrimaryKey, { ...workOrderQueryData, ...workOrderMeterDeployQueryData }, projectId);
        if (workOrder && workOrder.id) {
          if (workOrder.workOrderStatus === 'Open' || workOrder.workOrderStatus === 'Assigned' || workOrder.workOrderStatus === 'InProgress') {
            const workOrderColumns = getUpdatableColumns({
              queryData: workOrderQueryData,
              canUpdateOnSync: workOrderTable.canUpdateOnSync,
              oldWorkOrder: workOrder
            });
            const workOrderMeterDeployColumns = getUpdatableColumns({
              queryData: workOrderMeterDeployQueryData,
              canUpdateOnSync: workOrderMeterDeployTable.canUpdateOnSync,
              oldWorkOrder: workOrder
            });
            const data = { id: workOrder.id, ...workOrderColumns, ...workOrderMeterDeployColumns };
            forUpdate.push(data);
          }
        } else {
          if (reuse) {
            workOrder = await getWorkOrderId(dbClosedWorkOrdersByPrimaryKey, { ...workOrderQueryData, ...workOrderMeterDeployQueryData }, projectId);
            if (workOrder && workOrder.workOrderClosedDate) {
              const workOrderClosedDate = new Date(workOrder.workOrderClosedDate);
              workOrderClosedDate.setDate(workOrderClosedDate.getDate() + 5);
              if (workOrderClosedDate > new Date()) {
                continue;
              }
              workOrderQueryData['workOrderNumber'] = setWorkOrderRoundNumber(workOrder.workOrderNumber, workOrder.oldMeterNumber, workOrder.round + 1);
              reuseWorkOrdersCount = reuseWorkOrdersCount + 1;
            }
          }
          // Store workorder on list for batch insert
          workOrderQueryData['id'] = UUID();
          workOrderQueryData['projectId'] = projectId;
          if (workOrderQueryData.hasOwnProperty('customDataFields')) {
            workOrderQueryData.customDataFields = JSON.stringify(workOrderQueryData.customDataFields);
          }
          workOrdersRecords.push(workOrderQueryData);
          // Store meterdeploy on list for batch insert
          workOrderMeterDeployQueryData['meterDeployId'] = UUID();
          workOrderMeterDeployQueryData['workOrderId'] = workOrderQueryData['id'];
          workOrdersMeterDeployRecords.push(workOrderMeterDeployQueryData);
        }
      }
    }

    if (workOrdersRecords.length > 0 && !skipImport) {
      console.log(`reuseWorkOrders: ${reuseWorkOrdersCount}`);
      console.log(`workOrdersRecords: ${workOrdersRecords.length}`);
      console.log(`workOrdersMeterDeployRecords: ${workOrdersMeterDeployRecords.length}`);
      await batchInsertWorkOrderAndMeterDeploy(KNEX, {
        [WORKORDER_TABLE_NAME]: workOrdersRecords,
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: workOrdersMeterDeployRecords
      });
    }
    console.log(`forUpdate: ${forUpdate.length}`);
    if (forUpdate.length > 0) {
      await batchUpdate(forUpdate, updateWorkOrderAndMeterDeployTransaction);
    }
    await onImportFinished(file, true);
    console.log(`*** IMPORT HAS BEEN SUCCESSFULLY FINISHED  ***`);
  } catch (error) {
    console.log(`*** AN ERROR HAS OCCURRED WHILE IMPORTING THE FILE ${file.bucket}/${file.filename} ***`);
    console.log(error);
    await onImportFinished(file, false);
  }
};

const getWorkOrdersByProjectId = async (projectId) => {
  let data = await KNEX.raw(`select WorkOrder.id, workOrderNumber, latitude, longitude, workOrderStatus, districtCode, routeCode, substationCode, billingCycleCode, circuitCode, workOrderNeedsAppointment, workOrderNeedsSiteTest, workOrderFlaggedAsAdHoc, workOrderIsInBlackOut, workOrderFlaggedAs3strike, workOrderFlaggedAsCNC, group_concat( User.userName SEPARATOR ' | ') AS 'workOrderAssignments' from peakworkflowdb.WorkOrder left join peakworkflowdb.ProjectUserWorkOrder on WorkOrder.id = ProjectUserWorkOrder.workOrderId left join peakworkflowdb.User on User.id = ProjectUserWorkOrder.userId where WorkOrder.projectId = '${projectId}' and latitude between -90 and 90 and longitude between -180 and 180 group by workOrderNumber order by WorkOrder.id;`);
  const workOrdersWithAssignments = data ? data[0] : null;
  data = await KNEX.raw(`select workOrderNumber, WorkOrder.id, userName as technician from peakworkflowdb.WorkOrder left join peakworkflowdb.User on User.id = workOrderResourceUserId where WorkOrder.projectId = '${projectId}' and latitude between -90 and 90 and longitude between -180 and 180 group by workOrderNumber order by WorkOrder.id;`);
  const workOrdersWithTechnicians = data ? data[0] : null;
  let results = [];
  if (workOrdersWithAssignments.length > 0 && workOrdersWithTechnicians.length > 0) {
    for (let i = 0; i < workOrdersWithAssignments.length; i++) {
      const workOrder = workOrdersWithAssignments[i];
      workOrder['technician'] = workOrdersWithTechnicians[i].technician;
      results.push(workOrder);
    }
  }
  return results;
}

const gzipPromise = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      ZLIB.gzip(data, (_, result) => resolve(result));
    } catch (error) {
      console.log(error);
      reject();
    }
  })
}

const createGeoJsonFile = async (event) => {
  var body = JSON.parse(event.body);
  let { projectId, filter, search } = body;

  let workOrders;
  let workOrdersMap = {};

  if (projectId) {
    if (filter || search) {
      const data = await listWorkOrdersByWorkOrderType(KNEX, { search, filter, project: projectId }).catch(error => { console.log('No data') });
      workOrders = data && data.items ? data.items : [];
    } else {
      workOrders = await getWorkOrdersByProjectId(projectId);
    }
    workOrders = workOrders.forEach(({
      workOrderNumber,
      latitude,
      longitude,
      workOrderStatus,
      workOrderIsInBlackOut,
      workOrderFlaggedAsCNC,
      workOrderFlaggedAs3strike,
      workOrderFlaggedAsAdHoc,
      id,
      workOrderNeedsAppointment,
      workOrderNeedsSiteTest,
      routeCode,
      substationCode,
      billingCycleCode,
      circuitCode,
      districtCode,
      technician,
      workOrderAssignments
    }) => {
      workOrdersMap[id] = {
        workOrderNumber,
        workOrderStatus,
        workOrderIsInBlackOut,
        workOrderFlaggedAsCNC,
        workOrderFlaggedAs3strike,
        workOrderFlaggedAsAdHoc,
        lat: latitude,
        lng: longitude,
        id,
        workOrderNeedsAppointment,
        workOrderNeedsSiteTest,
        routeCode,
        substationCode,
        billingCycleCode,
        circuitCode,
        districtCode,
        technician,
        workOrderAssignments
      }
    });

    // fetch all technicians for this project
    data = await KNEX(PROJECT_USER_TABLE_NAME)
      .select(['userName', 'fullName', 'workOrderLastVisitDate', 'lastWorkOrder', 'avatar'])
      .leftJoin('User', 'ProjectUser.userId', 'User.id')
      .leftJoin('UserRole', 'UserRole.userId', 'User.id')
      .leftJoin('Role', 'Role.id', 'UserRole.roleId')
      .leftJoin('WorkOrder', 'lastWorkOrder', 'WorkOrder.id')
      .where('ProjectUser.projectId', projectId)
      .andWhere('role', 'Technician')

    data.forEach(({ workOrderLastVisitDate, lastWorkOrder, fullName, avatar }) => {
      if (workOrderLastVisitDate) {
        const workOrder = workOrdersMap[lastWorkOrder];
        if (workOrder) {
          workOrdersMap[lastWorkOrder].technicianFullName = fullName;
          workOrdersMap[lastWorkOrder].workOrderLastVisitDate = workOrderLastVisitDate;
          workOrdersMap[lastWorkOrder].avatar = avatar;
        }
      }
    });

    const geoJson = JSON.stringify(GEO_JSON.parse(Object.values(workOrdersMap), { Point: ['lat', 'lng'] }));
    const gzGeoJson = await gzipPromise(geoJson);
    const projectBucketName = await getProjectBucketNameByProjectId(KNEX, projectId);
    const params = {
      Body: gzGeoJson,
      Bucket: projectBucketName,
      Key: 'Automated Data From Utility/Processed Files/mapData.geojson',
      ContentEncoding: 'gzip'
    };
    await S3.putObject(params).promise();
    return createResponse(200, `GeoJson has been created for project ${projectId}`);
  }
  return createResponse(400, 'Missing params projectId');
}

const getPreSignedUrl = ({ Bucket, Key }) => {
  try {
    const signedUrlExpireSeconds = 60;
    const url = S3.getSignedUrl('getObject', {
      Bucket,
      Key,
      Expires: signedUrlExpireSeconds
    });
    return url;
  } catch (error) {
    console.log(error);
    return createResponse(500, 'Internal error');
  }
}

const getMapDataPreSignedUrl = async (event) => {
  try {
    const projectId = event.pathParameters.projectId;
    if (projectId) {
      const projectBucketName = await getProjectBucketNameByProjectId(KNEX, projectId);
      if (projectBucketName) {
        const key = 'Automated Data From Utility/Processed Files/mapData.geojson';
        const signedUrlExpireSeconds = 60;
        const url = S3.getSignedUrl('getObject', {
          Bucket: projectBucketName,
          Key: key,
          Expires: signedUrlExpireSeconds
        });
        return createResponse(200, url);
      }
    }
    return createResponse(400, 'Missing params projectId');
  } catch (error) {
    console.log(error);
    return createResponse(500, 'Internal error');
  }
}

const getInventoryUploadUrl = async (event) => {
  try {
    const projectId = event.pathParameters.projectId;
    const fileName = decodeURI(event.pathParameters.fileName);
    if (projectId) {
      const projectBucketName = await getProjectBucketNameByProjectId(KNEX, projectId);
      if (projectBucketName) {
        const key = `Manual Data From Utility/Uploaded Files/${fileName}`;
        const signedUrlExpireSeconds = 60;
        const url = S3.getSignedUrl('putObject', {
          Bucket: projectBucketName,
          Key: key,
          Expires: signedUrlExpireSeconds,
          ContentType: `${fileName.includes('csv') ? 'text/csv' : 'text/xml'}`
        });
        console.log(url);
        return createResponse(200, url);
      }
    }
    return createResponse(400, 'Missing params projectId');
  } catch (error) {
    console.log(error);
    return createResponse(500, 'Internal error');
  }
}

const getWorkOrderDetailsImagePreSignedUrl = async (event) => {
  try {
    const imagesPaths = event.queryStringParameters ? JSON.parse(event.queryStringParameters.imagesPaths) : [];
    if (imagesPaths.length > 0) {
      const signedUrlExpireSeconds = 60;
      const urls = imagesPaths.map(imagePath => {
        const imagePathData = imagePath.split('/');
        return S3.getSignedUrl('getObject', {
          Bucket: imagePathData[0],
          Key: `${imagePathData[1]}/${imagePathData[2]}`,
          Expires: signedUrlExpireSeconds
        });
      })
      return createResponse(200, urls);
    }
    return createResponse(400, 'Missing query params imagesPaths');
  } catch (error) {
    console.log(error);
    return createResponse(500, 'Internal error');
  }
}

const createResponse = (statusCode, response = '') => {
  return {
    statusCode,
    body: JSON.stringify(response),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
  }
};

const generateReports = async (event) => {
  const projectId = event.projectId;
  const {
    projectShortCode = null,
    projectBucket = null
  } = await getProjectById(KNEX, projectId);
  const data = await KNEX.raw(
    `SELECT distinct WorkOrder.id, 
        WorkOrder.accountNumber, 
        WorkOrder.customerName,
        WorkOrder.districtCode,
        WorkOrder.workOrderNumber,
        WorkOrder.street,
        WorkOrder.city,
        WorkOrder.stateCode,
        WorkOrder.zipCode,
        WorkOrder.routeCode,
        WorkOrderMeterDeploy.oldMeterNumber,
        WorkOrderMeterDeploy.oldMeterKwhReading, 
        WorkOrderMeterDeploy.oldMeterKwReading, 
        WorkOrderMeterDeploy.meterReadingDate, 
        WorkOrderMeterDeploy.newMeterNumber, 
        Inventory.assetNumber,
        Inventory.form,
        WorkOrderMeterDeploy.newMeterKwhReading, 
        WorkOrderMeterDeploy.newMeterKwReading, 
        WorkOrderMeterDeploy.newMeterReadingDate,
        WorkOrderMeterDeploy.demandCode,
        WorkOrder.workOrderNeedsSiteTest,
        WorkOrder.longitude, 
        WorkOrder.latitude, 
        WorkOrder.capturedLongitude,
        WorkOrder.capturedLatitude,
        WorkOrder.locationId,
        WorkOrder.mapNumber,
        WorkOrder.billingCycleCode,
        WorkOrderMeterDeploy.hasDisconnectedSwitch,
        WorkOrderMeterDeploy.billingMultiplier,
        WorkOrderMeterDeploy.serviceDescription,
        WorkOrderMeterDeploy.serviceType,
        WorkOrderMeterDeploy.ReadSequence,
        WorkOrderMeterDeploy.meterFormFactor,
        WorkOrderMeterDeploy.meterClass,
        WorkOrderMeterDeploy.meterType,
        WorkOrder.workOrderReasonCodes AS 'Reason',
        User.userName AS 'Installer ID',
        Comment.content AS 'Installer Comments',
        WorkOrder.workOrderLastVisitDate,
        WorkOrder.workOrderSiteConditions AS 'Condition',
        WorkOrder.workOrderFlaggedAs3strike,
        WorkOrder.workOrderFlaggedAsPlated,
        WorkOrder.workOrderFlaggedAsDamaged,
        WorkOrder.workOrderFlaggedAsAdHoc,
        WorkOrder.workOrderFlaggedAsCNC,
        WorkOrderMeterDeploy.newRadioNumber,
        WorkOrderMeterDeploy.newMeterDial,
        WorkOrderMeterDeploy.meterReadNotes,
        WorkOrderMeterDeploy.newRegisterNumber
    FROM WorkOrder
    LEFT JOIN WorkOrderMeterDeploy on WorkOrderMeterDeploy.workOrderId = WorkOrder.id
    left join Inventory on WorkOrderMeterDeploy.newMeterNumber = Inventory.mfgSerialNumber
    LEFT JOIN Comment on WorkOrder.id = Comment.workOrderId
    LEFT JOIN User on Comment.userId = User.Id
    where WorkOrder.projectId ='${projectId}'
    and workOrderStatus = 'Completed'
    group by WorkOrder.id;`
  );
  const workOrdersWithStatusCompleted = data[0];
  const workOrderReportsBuilder = PROJECT_DATA_MAPPER[projectBucket].reportsBuilder;
  workOrderReportsBuilder.setShortCode(projectShortCode);
  workOrdersWithStatusCompleted.forEach(workOrder => {
    workOrderReportsBuilder.add(workOrder);
  });
  const workOrderReports = await workOrderReportsBuilder.getAllReports();
  for (let i = 0; i < workOrderReports.length; i++) {
    await workOrderReports[i].upload();
  }
  await batchUpdate(workOrdersWithStatusCompleted, updateWorkOrderStatusTransaction);
}

requireNewDateFormat = (columnName) => {
  return columnName === 'meterReadingDate' ||
    columnName === 'workOrderLastVisitDate' ||
    columnName === 'newMeterReadingDate' ||
    columnName === 'shippedDate' ||
    columnName === 'assetReceivedDate' ||
    columnName === 'assetDeployedDate' ||
    columnName === 'assetTransferredDate' ||
    columnName === 'contentDate' ||
    columnName === 'Visit Time (CDT)' ||
    columnName === 'workOrderClosedDate' ||
    columnName === 'workOrderDeletedDate' ||
    columnName === 'Comment Date';
}

const getCSVData = (data, projectTimeZone) => {
  let csvData = [];
  const csvColumns = Object.keys(data[0]);
  data.forEach(dataItem => {
    let row = [];
    csvColumns.forEach(columnName => {
      if (dataItem[columnName] && requireNewDateFormat(columnName)) {
        if (projectTimeZone) {
          if (columnName === 'Visit Time (CDT)') {
            dataItem[columnName] = moment(dataItem[columnName]).tz('America/Chicago').format('hh:mm:ss A');
          } else {
            dataItem[columnName] = moment(dataItem[columnName]).tz(projectTimeZone).format('MM/DD/YYYY hh:mm:ss A');
          }
        } else {
          dataItem[columnName] = formatUTCDate(dataItem[columnName], UTC_DATE_FORMATS['MM/dd/YYYY']);
        }
      }
      dataItem[columnName] === null || dataItem[columnName] === undefined ? row.push('') : row.push(dataItem[columnName]);
    });
    csvData.push(row);
  });
  return csvData;
}

const uploadCSVReport = async (csv, { Bucket, Key }) => {
  try {
    const params = {
      Body: Buffer.from(csv, 'binary'),
      Bucket,
      Key
    };
    await S3.putObject(params).promise();
  } catch (error) {
    throw error;
  }
}

const exportReportByType = async (event) => {
  try {
    const projectId = event.pathParameters.projectId;
    const reportType = event.pathParameters.reportType;
    const fromDate = event.pathParameters.fromDate;
    const toDate = event.pathParameters.toDate;

    const {
      projectBucket = null,
      projectTimeZone = null,
      projectShortCode = null
    } = await getProjectById(KNEX_READ, projectId);

    if (!projectId) {
      return createResponse(400, 'Missing params projectId');
    }
    if (!fromDate || !toDate) {
      return createResponse(400, 'Missing params fromDate/toDate');
    }
    if (!reportType) {
      return createResponse(400, 'Missing params reportType');
    }
    let data = null;
    let filename = null;
    if (reportType === 'exceptions') {
      data = await getExceptionReportData(KNEX_READ, projectId, fromDate, toDate);
      filename = `${projectShortCode ? `${projectShortCode}-` : ''}Exceptions-Report-${fromDate.split('-').join('')}-${toDate.split('-').join('')}.csv`;
    } else if (reportType === 'conditions') {
      data = await getConditionReportData(KNEX_READ, projectId, fromDate, toDate);
      filename = `${projectShortCode ? `${projectShortCode}-` : ''}Conditions-Report-${fromDate.split('-').join('')}-${toDate.split('-').join('')}.csv`;
    } else {
      return createResponse(400, `Report with type: ${reportType} does not exsist`);
    }
    const workOrders = data[0];
    if (workOrders.length > 0) {
      const csvData = getCSVData(workOrders, projectTimeZone);
      if (csvData.length > 0) {
        const csv = await createCsv(Object.keys(workOrders[0]), csvData);
        await uploadCSVReport(csv, { Bucket: projectBucket, Key: `Data To Utility/Temporary Files/${filename}` });
        const url = getPreSignedUrl({ Bucket: projectBucket, Key: `Data To Utility/Temporary Files/${filename}` });
        return createResponse(200, url);
      }
    }
    return createResponse(400, `No data found for period from ${fromDate} to ${toDate}`);
  } catch (error) {
    console.log(error);
  }
}

const exportInventoryReport = async (event) => {
  try {
    const projectId = event.pathParameters.projectId;
    const assetNumber = event.pathParameters.assetNumber;
    let assetDeployed = event.pathParameters.assetDeployed;

    if (assetDeployed) {
      if (assetDeployed !== 'yes' && assetDeployed !== 'no' && assetDeployed !== 'all') {
        return createResponse(400, 'The value for assetDeployed param can be yes/no/all');
      }
    }

    const assetDeployedMappings = {
      no: 'false',
      yes: 'true',
      all: null
    };
    assetDeployed = assetDeployedMappings[assetDeployed];

    if (!projectId) {
      return createResponse(400, 'Missing params projectId');
    }

    const {
      projectBucket = null,
      projectTimeZone = null,
      projectShortCode = null
    } = await getProjectById(KNEX_READ, projectId);

    const SELECT_ALL_FROM_INVENTORY_WHERE_PROJECT_ID = `SELECT * FROM Inventory WHERE projectId = '${projectId}'`;
    const AND_ASSET_DEPLOYED = assetDeployed ? ` AND assetDeployed = ${assetDeployed}` : '';
    const AND_ASSET_NUMBER_LIKE = assetNumber ? ` AND assetNumber LIKE '%${assetNumber}%'` : '';
    const ORDER_BY_ASSET_NUMBER = ' ORDER BY assetNumber;';

    const data = await KNEX_READ.raw(SELECT_ALL_FROM_INVENTORY_WHERE_PROJECT_ID + AND_ASSET_DEPLOYED + AND_ASSET_NUMBER_LIKE + ORDER_BY_ASSET_NUMBER);
    const workOrders = data[0];

    if (workOrders.length > 0) {
      const csvData = getCSVData(workOrders, projectTimeZone);
      if (csvData.length > 0) {
        const csv = await createCsv(Object.keys(workOrders[0]), csvData);
        const filename = `${projectShortCode ? `${projectShortCode}-` : ''}Inventory-Report.csv`;
        await uploadCSVReport(csv, { Bucket: projectBucket, Key: `Data To Utility/Temporary Files/${filename}` });
        const url = getPreSignedUrl({ Bucket: projectBucket, Key: `Data To Utility/Temporary Files/${filename}` });
        return createResponse(200, url);
      }
    }
    return createResponse(400, 'No data found');
  } catch (error) {
    console.log(error);
    return createResponse(500, error);
  }
}

const exportWorkOrdersReport = async (event) => {
  try {
    const projectId = event.pathParameters.projectId;
    const appointmentsOnly = JSON.parse(event.pathParameters.appointmentsOnly);
    const withComments = JSON.parse(event.pathParameters.withComments);
    const workOrderStatus = event.pathParameters.workOrderStatus;
    const fromDate = event.pathParameters.fromDate;
    const toDate = event.pathParameters.toDate;
    const availableWorkOrderStatus = ['Open', 'Assigned', 'InProgress', 'InReview', 'Escalated', 'Completed', 'Closed', 'All'];

    const {
      projectBucket = null,
      projectTimeZone = null,
      projectShortCode = null
    } = await getProjectById(KNEX_READ, projectId);

    if (!projectId) {
      return createResponse(400, 'Missing params projectId');
    }
    if (!workOrderStatus) {
      return createResponse(400, 'Missing params workOrderStatus');
    }
    if (availableWorkOrderStatus.indexOf(workOrderStatus) === -1) {
      return createResponse(400, 'Work Order Status is incorrect. Status can be: Open, Assigned, InProgress, InReview, Escalated, Completed, Closed, All');
    }

    let data = null;
    const count = await getWorkOrdersWaterMeterDeployCount(KNEX_READ, projectId);

    // water meter deploy template
    if (count > 0) {
      data = await KNEX_READ.raw(`SELECT WorkOrder.workOrderNumber, WorkOrder.workOrderLastVisitDate, WorkOrder.workOrderStatus, WorkOrder.workOrderClosedDate, WorkOrder.workOrderFlaggedAsCNC as workOrderFlaggedAsRTC, WorkOrder.workOrderFlaggedAs3strike as workOrderFlaggedAsRTU, WorkOrder.workOrderFlaggedAsDamaged, WorkOrder.workOrderFlaggedAsAdHoc as workOrderFlaggedAsNoRadioInstall, WorkOrder.workOrderFlaggedAsPlated as workOrderFlaggedAsNoMeterInstall, WorkOrder.workOrderFlaggedAsEscalated, WorkOrder.workOrderIsInBlackOut, WorkOrder.workOrderNeedsAppointment, WorkOrder.workOrderNeedsSiteTest, WorkOrder.workOrderAttemptNumber, WorkOrder.workOrderReasonCodes, WorkOrder.workOrderSiteConditions, User.userName AS 'technician', WorkOrder.workOrderGroups, WorkOrder.districtCode, WorkOrder.substationCode, WorkOrder.billingCycleCode, WorkOrder.routeCode, WorkOrder.bookCode, WorkOrder.accountNumber, WorkOrder.customerContactedOnSite, WorkOrder.customerName, WorkOrder.homePhoneNumber, WorkOrder.mobilePhoneNumber, WorkOrder.businessPhoneNumber, WorkOrder.street, WorkOrder.city, WorkOrder.stateCode, WorkOrder.locationId, WorkOrder.mapNumber, WorkOrder.latitude, WorkOrder.longitude, WorkOrder.capturedGpsPositionSource, WorkOrder.capturedLatitude, WorkOrder.capturedLongitude, WorkOrder.capturedGpsHorizontalAccuracy, capturedGpsVerticalAccuracy, WorkOrder.capturedGpsAltitude, WorkOrder.workOrderIsDeleted, WorkOrder.workOrderDeletedDate, WorkOrderMeterDeploy.oldMeterNumber, WorkOrderMeterDeploy.oldMeterKwhLastReading as oldMeterLastReading, WorkOrderMeterDeploy.oldMeterKwhReading as oldMeterOutReading, WorkOrderMeterDeploy.newMeterNumber, WorkOrderMeterDeploy.newMeterKwhReading as newMeterInReading, WorkOrderMeterDeploy.newMeterDial, WorkOrderMeterDeploy.meterReadingDate, WorkOrderMeterDeploy.newMeterReadingDate, WorkOrderMeterDeploy.newRadioNumber, WorkOrderMeterDeploy.newRegisterNumber, WorkOrderMeterDeploy.newRadioValidated, WorkOrderMeterDeploy.newLidSize, WorkOrderMeterDeploy.meterStatus, WorkOrderMeterDeploy.meterType, WorkOrderMeterDeploy.meterFormFactor as oldMeterSize, Inventory.form as newMeterSize, WorkOrderMeterDeploy.meterClass as lineSize, WorkOrderMeterDeploy.serviceType as lineType, WorkOrderMeterDeploy.meterVoltage as lidSize, WorkOrderMeterDeploy.billingMultiplier, WorkOrderMeterDeploy.meterReadNotes, WorkOrderMeterDeploy.serviceDescription, WorkOrderMeterDeploy.ReadSequence${withComments ? `, Comment.content as 'Comment', Comment.contentDate as 'Comment Date'` : ''} from WorkOrder
        LEFT JOIN WorkOrderMeterDeploy ON WorkOrder.id = WorkOrderMeterDeploy.workOrderId
        LEFT JOIN User ON WorkOrder.workOrderResourceUserId = User.id${withComments ? ' LEFT JOIN Comment on Comment.workOrderId = WorkOrder.id' : ''}
        LEFT JOIN Inventory on WorkOrderMeterDeploy.newMeterNumber = Inventory.mfgSerialNumber
        WHERE WorkOrder.projectId = '${projectId}'${fromDate && toDate ? ` AND workOrderLastVisitDate between '${fromDate}' and '${toDate}'` : ''}${appointmentsOnly ? ' AND workOrderNeedsAppointment = 1' : ''}
        ${workOrderStatus === 'All' ? '' : `AND workOrderStatus = '${workOrderStatus}'`}
        ORDER BY workOrderNumber;`
      );
    } else {
      data = await KNEX_READ.raw(`SELECT WorkOrder.workOrderNumber, WorkOrder.workOrderLastVisitDate, WorkOrder.workOrderStatus, WorkOrder.workOrderClosedDate, WorkOrder.workOrderFlaggedAsCNC, WorkOrder.workOrderFlaggedAs3strike, WorkOrder.workOrderFlaggedAsDamaged, WorkOrder.workOrderFlaggedAsAdHoc, WorkOrder.workOrderFlaggedAsPlated, WorkOrder.workOrderFlaggedAsEscalated, WorkOrder.workOrderIsInBlackOut, WorkOrder.workOrderNeedsAppointment, WorkOrder.workOrderNeedsSiteTest, WorkOrder.workOrderAttemptNumber, WorkOrder.workOrderReasonCodes, WorkOrder.workOrderSiteConditions, User.userName AS 'technician', WorkOrder.workOrderGroups, WorkOrder.districtCode, WorkOrder.substationCode, WorkOrder.circuitCode, WorkOrder.billingCycleCode, WorkOrder.routeCode, WorkOrder.bookCode, WorkOrder.accountNumber, WorkOrder.customerName, WorkOrder.homePhoneNumber, WorkOrder.mobilePhoneNumber, WorkOrder.businessPhoneNumber, WorkOrder.street, WorkOrder.city, WorkOrder.stateCode, WorkOrder.locationId, WorkOrder.mapNumber, WorkOrder.latitude, WorkOrder.longitude, WorkOrder.capturedGpsPositionSource, WorkOrder.capturedLatitude, WorkOrder.capturedLongitude, WorkOrder.capturedGpsHorizontalAccuracy, capturedGpsVerticalAccuracy, WorkOrder.capturedGpsAltitude, WorkOrder.workOrderIsDeleted, WorkOrder.workOrderDeletedDate, WorkOrderMeterDeploy.oldMeterNumber, WorkOrderMeterDeploy.oldMeterKwLastReading, WorkOrderMeterDeploy.oldMeterKwReading, WorkOrderMeterDeploy.oldMeterKwhLastReading, WorkOrderMeterDeploy.oldMeterKwhReading, WorkOrderMeterDeploy.oldMeterKvaLastReading, WorkOrderMeterDeploy.oldMeterKvaReading, WorkOrderMeterDeploy.oldMeterKvarLastReading, WorkOrderMeterDeploy.oldMeterKvarReading, WorkOrderMeterDeploy.newMeterNumber, WorkOrderMeterDeploy.newMeterAssetNumber as 'assetNumber', WorkOrderMeterDeploy.newMeterKwReading, WorkOrderMeterDeploy.newMeterKwhReading, WorkOrderMeterDeploy.newMeterKvaReading, WorkOrderMeterDeploy.newMeterKvarReading, WorkOrderMeterDeploy.newMeterDial, WorkOrderMeterDeploy.meterReadingDate, WorkOrderMeterDeploy.newMeterReadingDate, WorkOrderMeterDeploy.meterStatus, WorkOrderMeterDeploy.meterType, WorkOrderMeterDeploy.meterClass, WorkOrderMeterDeploy.meterVoltage, WorkOrderMeterDeploy.meterFormFactor, WorkOrderMeterDeploy.billingMultiplier, WorkOrderMeterDeploy.meterReadNotes, WorkOrderMeterDeploy.serviceType, WorkOrderMeterDeploy.serviceDescription, WorkOrderMeterDeploy.ReadSequence, WorkOrderMeterDeploy.isMedical, WorkOrderMeterDeploy.needsOpenDisconnectSwitch, WorkOrderMeterDeploy.hasDisconnectedSwitch, WorkOrderMeterDeploy.meterSetNumber, WorkOrderMeterDeploy.demandCode${withComments ? `, Comment.content as 'Comment', Comment.contentDate as 'Comment Date'` : ''} from WorkOrder
        LEFT JOIN WorkOrderMeterDeploy ON WorkOrder.id = WorkOrderMeterDeploy.workOrderId
        LEFT JOIN User ON WorkOrder.workOrderResourceUserId = User.id${withComments ? ' LEFT JOIN Comment on Comment.workOrderId = WorkOrder.id' : ''}
        WHERE projectId = '${projectId}'${fromDate && toDate ? ` AND workOrderLastVisitDate between '${fromDate}' and '${toDate}'` : ''}${appointmentsOnly ? ' AND workOrderNeedsAppointment = 1' : ''}
        ${workOrderStatus === 'All' ? '' : `AND workOrderStatus = '${workOrderStatus}'`}
        ORDER BY workOrderNumber;`
      );
    }

    const workOrders = data[0];
    if (workOrders.length > 0) {
      const csvData = getCSVData(workOrders, projectTimeZone);
      if (csvData.length > 0) {
        const csv = await createCsv(Object.keys(workOrders[0]), csvData);
        const filename = `${projectShortCode ? `${projectShortCode}-` : ''}WorkOrders-Report-${fromDate && toDate ? `${fromDate.split('-').join('')}-${toDate.split('-').join('')}` : `as-of-${getTodaysDate(DATE_FORMATS.yyyyMMdd)}`}.csv`;
        await uploadCSVReport(csv, { Bucket: projectBucket, Key: `Data To Utility/Temporary Files/${filename}` });
        const url = getPreSignedUrl({ Bucket: projectBucket, Key: `Data To Utility/Temporary Files/${filename}` });
        return createResponse(200, url);
      }
    }
    return createResponse(400, 'No data found');
  } catch (error) {
    console.log(error);
    return createResponse(500, error);
  }
}

const exportAssignmentsReport = async (event) => {
  try {
    const projectId = event.pathParameters.projectId;
    if (!projectId) {
      return createResponse(400, 'Missing params projectId');
    }
    const { projectBucket = null, tenantId = null } = await getProjectById(KNEX_READ, projectId);

    const projects = await getAllProjects(KNEX_READ, tenantId);
    let reportData = [];
    for (let project of projects) {
      const count = await getWorkOrdersWaterMeterDeployCount(KNEX_READ, project.id);
      const result = count > 0 ?
        await getWaterMeterDeployAssignmentsReportData(KNEX_READ, project.id)
        :
        await getMeterDeployAssignmentsReportData(KNEX_READ, project.id);
      const projectReportData = result[0];
      if (projectReportData) {
        projectReportData.forEach(row => reportData.push(row))
      }
    }
    if (reportData.length > 0) {
      const csv = await createCsv(Object.keys(reportData[0]), reportData);
      const filename = `Assignments-Report-as-of-${getTodaysDate(DATE_FORMATS.yyyyMMdd)}.csv`;
      await uploadCSVReport(csv, { Bucket: projectBucket, Key: `Data To Utility/Temporary Files/${filename}` });
      const url = getPreSignedUrl({ Bucket: projectBucket, Key: `Data To Utility/Temporary Files/${filename}` });
      return createResponse(200, url);
    }
    return createResponse(400, `No data found`);
  } catch (error) {
    console.log(error);
    return createResponse(500, error);
  }
}

const exportTechnicianReport = async (event) => {
  try {
    const projectId = event.pathParameters.projectId;
    const fromDate = event.pathParameters.fromDate;
    const toDate = event.pathParameters.toDate;
    const reportType = event.pathParameters.reportType;
    if (!projectId) {
      return createResponse(400, 'Missing params projectId');
    }
    if (!fromDate || !toDate) {
      return createResponse(400, 'Missing params fromDate/toDate');
    }
    if (!reportType) {
      return createResponse(400, 'Missing params reportType');
    }

    const {
      projectBucket = null,
      projectTimeZone = null,
      tenantId = null
    } = await getProjectById(KNEX_READ, projectId);

    let response = null;

    if (reportType === 'Summary') {
      response = await KNEX_READ.raw(`select projectName as 'Project', userName as 'Technician', count(IF(workOrderFlaggedAs3strike=0,1, NULL) AND IF(workOrderFlaggedAsCNC=0,1, NULL)) as 'Complete', count(IF(workOrderFlaggedAsCNC=1,1, NULL)) as 'CNC', count(IF(workOrderFlaggedAs3strike=1,1, NULL)) as '3-strike', count(*) as 'Total' from peakworkflowdb.WorkOrder right join peakworkflowdb.User on WorkOrder.workOrderResourceUserId = User.id right join peakworkflowdb.Project on WorkOrder.projectId = Project.id where Project.tenantId = '${tenantId}' and Project.isDemo = false and workOrderLastVisitDate between '${fromDate}' and '${toDate}' group by User.userName, projectName order by projectName, userName desc;`);
    } else if (reportType === 'Detail') {
      response = await KNEX_READ.raw(`select projectName as 'Project', userName as 'Technician', DATE_FORMAT(workOrderLastVisitDate, '%m/%d/%Y') as 'Visit Date', workOrderLastVisitDate as 'Visit Time (CDT)', workOrderNumber as 'Work Order Number', workOrderFlaggedAsCNC as 'CNC', workOrderFlaggedAs3strike as '3-strike' from peakworkflowdb.WorkOrder right join peakworkflowdb.User on WorkOrder.workOrderResourceUserId = User.id right join peakworkflowdb.Project on WorkOrder.projectId = Project.id where Project.tenantId = '${tenantId}' and Project.isDemo = false and workOrderLastVisitDate between '${fromDate}' and '${toDate}' order by projectName, workOrderLastVisitDate, userName desc;`);
    } else if (reportType === 'PayrollSummary') {
      response = await KNEX_READ.raw(`select projectName as 'Project', userName as 'Technician', DATE_FORMAT(workOrderLastVisitDate, '%m/%d/%Y') as 'Visit Date', meterFormFactor as 'Old Form', form as 'New Form', count(*) as 'Completed/Closed' from WorkOrder left join WorkOrderMeterDeploy on WorkOrder.id = WorkOrderMeterDeploy.workOrderId left join Inventory on Inventory.mfgSerialNumber = WorkOrderMeterDeploy.newMeterNumber right join User on WorkOrder.workOrderResourceUserId = User.id right join Project on WorkOrder.projectId = Project.id where Project.tenantId = '${tenantId}' and Project.isDemo = false and workOrderLastVisitDate between '${fromDate}' and '${toDate}' and workOrderIsDeleted = 0 and workOrderFlaggedAs3strike = 0 and workOrderFlaggedAsCNC = 0 and (workOrderStatus = 'Completed' or workOrderStatus = 'Closed') group by Day(workOrderLastVisitDate), meterFormFactor, User.userName, projectName order by projectName, userName, workOrderLastVisitDate, meterFormFactor;`);
    }

    const reportData = response[0];

    if (reportData.length > 0) {
      const csvData = getCSVData(reportData, projectTimeZone);
      if (csvData.length > 0) {
        const csv = await createCsv(Object.keys(reportData[0]), csvData);
        const filename = `Technician-${reportType}-Report-${fromDate && toDate ? `${fromDate.split('-').join('')}-${toDate.split('-').join('')}` : `as-of-${getTodaysDate(DATE_FORMATS.yyyyMMdd)}`}.csv`;
        await uploadCSVReport(csv, { Bucket: projectBucket, Key: `Data To Utility/Temporary Files/${filename}` });
        const url = getPreSignedUrl({ Bucket: projectBucket, Key: `Data To Utility/Temporary Files/${filename}` });
        return createResponse(200, url);
      }
    }
    return createResponse(400, `No data found`);
  } catch (error) {
    console.log(error);
    return createResponse(500, error);
  }
}

const setUTCDate = () => {
  const date = new Date();
  const nowUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const year = new Date(nowUTC).getUTCFullYear().toString();
  let day = new Date(nowUTC).getUTCDate().toString();
  let mounth = (new Date(nowUTC).getUTCMonth() + 1).toString();
  mounth = mounth.length === 1 ? '0' + mounth : mounth;
  day = day.length === 1 ? '0' + day : day;
  return `${year}-${mounth}-${day}`;
};

const parseXML = async (params) => {
  const { Body } = await S3.getObject(params).promise();
  return new Promise((resolve, reject) => {
    XML2JS(Body, (err, result) => {
      const { MeterMfgData } = result;
      const { manufacturer, customer, shippedTo, shippedToState, shippedDate } = MeterMfgData;
      const inventoryHeader = {
        manufacturer: manufacturer[0],
        customer: customer[0],
        shippedTo: shippedTo[0],
        shippedToState: shippedToState[0],
        shippedDate: shippedDate[0]
      };
      const meters = result.MeterMfgData.meters[0].meter;
      const inventories = [];
      for (let i = 0; i < meters.length; i++) {
        const inventoryBody = {
          ...inventoryHeader,
          assetNumber: meters[i].custMeterNo[0],
          assetType: 'Meter',
          mfgSerialNumber: meters[i].mfgSerialNumber[0],
          amrSerialNumber: meters[i].amrSerialNumber[0],
          kH: +meters[i].kH[0],
          numDials: +meters[i].numDials[0],
          form: meters[i].form[0],
          base: meters[i].base[0],
          class: meters[i].class[0],
          assetReceivedDate: setUTCDate(),
          assetLocation: 'Utility Warehouse'
        };
        inventories.push(inventoryBody);
      }
      resolve(inventories);
    });
  });
};

const inventoriesBatchInsert = async (data) => {
  return new Promise((resolve, reject) => {
    KNEX.transaction(tr => {
      return KNEX.batchInsert(INVENTORY_TABLE_NAME, data[INVENTORY_TABLE_NAME])
        .transacting(tr)
    })
      .then(() => { resolve() })
      .catch((error) => { reject(error) });
  });
}

const handleBlackOutDates = async (event) => {
  try {
    const projectId = event.projectId;
    if (!projectId) {
      console.log('Missing params projectId');
      return;
    }
    console.log(`Handle BlackOut Dates for projectId: ${projectId}`);
    await resetAllBlackOutFlagsByProjectId(KNEX, projectId);
    const date = getTodaysDate(DATE_FORMATS['yyyy-MM-dd']);
    await setBlackOutFlagByProjectIdAndDate(KNEX, projectId, date);
  } catch (error) {
    console.log(error);
  }
}

const getAllS3BucketPhotosNames = async (bucketName) => {
  try {
    const params = {
      Bucket: bucketName,
      Prefix: 'Photos To Utility'
    };
    let data = await S3.listObjectsV2(params).promise();
    return data.Contents.map(item => item.Key.split('/')[1]);
  } catch (error) {
    throw error;
  }
}

const findMissingPhotos = async (event) => {
  try {
    console.log('********* FINDING ALL MISSING PHOTOS *********');
    const buckets = event.buckets;
    const dbPhotosNames = await photoService.getAllPhotosNames(KNEX);
    for (let bucketName of buckets) {
      const s3PhotosNames = await getAllS3BucketPhotosNames(bucketName);
      s3PhotosNames.forEach(s3PhotoName => {
        if (dbPhotosNames.indexOf(s3PhotoName) === -1) {
          console.log(`Bucket: ${bucketName} Photo: ${s3PhotoName} does not exist in the database`);
        }
      });
    }
    console.log('********* FINISHED *********');
  }
  catch (error) {
    console.log(error);
  }
}

const getUploadURL = async (event) => {
  try {
    const projectId = event.pathParameters.projectId;
    const photoName = event.pathParameters.photoName;
    if (!projectId) {
      return createResponse(400, 'Missing params projectId');
    }
    if (!photoName) {
      return createResponse(400, 'Missing params photoName');
    }
    const Bucket = await getProjectBucketNameByProjectId(KNEX, projectId);
    if (!Bucket) {
      return createResponse(400, `Project bucket name was not found for projectId: ${projectId}`);
    }
    const s3Params = {
      Bucket,
      Key: `Photos To Utility/${photoName}`,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
    }
    const uploadURL = S3.getSignedUrl('putObject', s3Params);
    return createResponse(200, uploadURL);
  } catch (error) {
    console.log(error);
    return createResponse(500, null);
  }
}

const getUserAvatar = async (event) => {
  try {
    const key = event.queryStringParameters.key;
    if (!key) {
      return createResponse(400, 'Missing params key');
    }
    const signedUrlExpireSeconds = 60;
    const s3Params = {
      Bucket: COMMON_BUCKET,
      Key: key,
      Expires: signedUrlExpireSeconds
    }
    const signedUrl = S3.getSignedUrl('getObject', s3Params);
    return createResponse(200, signedUrl);
  } catch (error) {
    console.log(error);
    return createResponse(500, null);
  }
}

const addPhoto = async (event) => {
  try {
    const body = await MULTIPART_PARSER.parse(event);
    const photo = body.files[0].content;
    const workOrderId = body.workOrderId;
    const oldMeterNumber = body.oldMeterNumber;
    const photoType = body.photoType;
    const projectId = body.projectId;

    const Bucket = await getProjectBucketNameByProjectId(KNEX, projectId);
    const fileName = `${oldMeterNumber}-${workOrderId}-${photoType}.jpg`;
    const s3ObjectKey = `Photos To Utility/${fileName}`;
    const photoData = {
      workOrderId,
      photoType,
      name: fileName,
      file: JSON.stringify({
        key: s3ObjectKey,
        bucket: Bucket,
        region: process.env.REGION,
        mimeType: 'image/jpeg',
        localUri: ''
      })
    };
    await photoService.addPhoto(KNEX, photoData, async () => {
      const params = {
        Body: photo,
        Bucket,
        Key: s3ObjectKey
      };
      await S3.putObject(params).promise();
    }).catch(error => {
      throw error;
    });
    return createResponse(200, null);
  } catch (error) {
    console.log(error);
    return createResponse(500, null);
  }
}

const getDate = () => {
  const date = new Date();
  let month = date.getUTCMonth() + 1;
  let year = date.getUTCFullYear();
  let day = date.getUTCDate();
  day = day < 10 ? `0${day}` : day;
  month = month < 10 ? `0${month}` : month;
  return `${year}${month}${day}`;
}

const createPhotoManifest = async (event) => {
  try {
    const projectId = event.projectId;
    let workOrderCount = event.workOrderCount;
    if (typeof (workOrderCount) !== 'number') {
      workOrderCount = 1000;
    }
    const recordDelimiter = event.recordDelimiter;
    console.log(`********* CHECKING IF PHOTO MANIFEST IS NEEDED FOR PROJECT: ${projectId} *********'`);
    const projectBucketName = await getProjectBucketNameByProjectId(KNEX, projectId);
    const count = await getClosedAndNotExportedWorkOrdersCount(KNEX, projectId);
    console.log(`Closed/Not-Exported work orders count: ${count}`);
    if (count >= workOrderCount) {
      const workOrdersWithPhotos = await getAllClosedAndNotExportedWorkOrdersPhotos(KNEX, projectId).catch(error => { throw error });
      let exportedWorkOrders = {};
      for (let workOrder of workOrdersWithPhotos) {
        if (!exportedWorkOrders[workOrder.id]) {
          exportedWorkOrders[workOrder.id] = workOrder;
        }
      }
      exportedWorkOrders = Object.values(exportedWorkOrders);
      await batchUpdate(exportedWorkOrders, updateWorkOrderAsExportedTransaction).catch(error => { throw error });
      const xml = PHOTO_MANIFEST_BUILDER.build(workOrdersWithPhotos, recordDelimiter);
      const params = {
        Body: xml,
        Bucket: projectBucketName,
        Key: `Data To Utility/Photo Manifests/PhotoManifest_${getDate()}.xml`
      };
      await S3.putObject(params).promise();
    }
  } catch (error) {
    console.log(error);
  }
}

// send recordLocator (srvLocId from NISC is less the connection number now) field vs locationId (uniqueLocation)
const createNISCPhotoManifest = async (event) => {
  try {
    const projectId = event.projectId;
    let workOrderCount = event.workOrderCount;
    if (typeof (workOrderCount) !== 'number') {
      workOrderCount = 1000;
    }
    const recordDelimiter = event.recordDelimiter;
    console.log(`********* CHECKING IF PHOTO MANIFEST IS NEEDED FOR PROJECT: ${projectId} *********'`);
    const projectBucketName = await getProjectBucketNameByProjectId(KNEX, projectId);
    const count = await getClosedAndNotExportedWorkOrdersCount(KNEX, projectId);
    console.log(`Closed/Not-Exported work orders count: ${count}`);
    if (count >= workOrderCount) {
      const workOrdersWithPhotos = await getAllClosedAndNotExportedWorkOrdersPhotos(KNEX, projectId).catch(error => { throw error });
      let exportedWorkOrders = {};
      for (let workOrder of workOrdersWithPhotos) {
        if (!exportedWorkOrders[workOrder.id]) {
          exportedWorkOrders[workOrder.id] = workOrder;
        }
      }
      exportedWorkOrders = Object.values(exportedWorkOrders);
      await batchUpdate(exportedWorkOrders, updateWorkOrderAsExportedTransaction).catch(error => { throw error });
      const xml = NISC_PHOTO_MANIFEST_BUILDER.build(workOrdersWithPhotos, recordDelimiter);
      const params = {
        Body: xml,
        Bucket: projectBucketName,
        Key: `Data To Utility/Photo Manifests/PhotoManifest_${getDate()}.xml`
      };
      await S3.putObject(params).promise();
    }
  } catch (error) {
    console.log(error);
  }
}


const adminCreateUserResendInvite = async (event) => {
  try {
    const { username = '' } = JSON.parse(event.body);
    if (!username) {
      return createResponse(400, 'Missing params username');
    }
    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
    const params = {
      UserPoolId: process.env.NODE_ENV === 'dev' ? process.env.COGNITO_USER_POOL_DEV : process.env.COGNITO_USER_POOL_PRODUCTION,
      Username: username,
      MessageAction: 'RESEND'
    };
    await cognitoIdentityServiceProvider
      .adminCreateUser(params)
      .promise()
      .catch(error => {
        throw error;
      });
    return createResponse(200, null);
  }
  catch (error) {
    console.log(error);
    return createResponse(500, error.message || 'Unexpected error');
  }
}

const adminCreateUser = async (event) => {
  let trx;
  try {
    const {
      tenant = '',
      username = '',
      fullName = '',
      email = '',
      roles = [],
      projects = []
    } = JSON.parse(event.body);

    if (!username) {
      return createResponse(400, 'Missing params username');
    }
    if (!email) {
      return createResponse(400, 'Missing params email');
    }
    if (!tenant) {
      return createResponse(400, 'Missing params tenant');
    }
    if (!fullName) {
      return createResponse(400, 'Missing params fullName');
    }
    if (roles.length === 0) {
      return createResponse(400, 'Missing params roles');
    }
    if (projects.length === 0) {
      return createResponse(400, 'Missing params projects');
    }

    const dbUser = await getUserByUsername(KNEX, username);
    if (dbUser) {
      return createResponse(400, `Username ${username} already exist`);
    }

    const user = {
      id: UUID(),
      username,
      fullName,
      isActive: true,
      tenantId: tenant
    };

    const userRoles = roles.map(roleId => {
      return {
        userId: user.id,
        roleId
      }
    });

    const userProjects = projects.map(projectId => {
      return {
        projectId,
        userId: user.id
      }
    });

    trx = await new Promise((resolve, reject) => {
      KNEX.transaction((trx) => {
        KNEX(USER_TABLE_NAME)
          .transacting(trx)
          .insert(user)
          .then(() => {
            KNEX(USER_ROLE_TABLE_NAME)
              .transacting(trx)
              .insert(userRoles)
              .then(() => {
                KNEX(PROJECT_USER_TABLE_NAME)
                  .transacting(trx)
                  .insert(userProjects)
                  .then(() => {
                    resolve(trx);
                  })
                  .catch(error => {
                    reject(error);
                  });
              })
              .catch(error => {
                reject(error);
              });
          })
          .catch(error => {
            reject(error);
          });
      });
    });

    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
    const params = {
      UserPoolId: process.env.NODE_ENV === 'dev' ? process.env.COGNITO_USER_POOL_DEV : process.env.COGNITO_USER_POOL_PRODUCTION,
      Username: username,
      DesiredDeliveryMediums: [
        'EMAIL'
      ],
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        },
        {
          Name: 'email_verified',
          Value: 'true'
        }
      ],
    };
    await cognitoIdentityServiceProvider
      .adminCreateUser(params)
      .promise()
      .catch(error => {
        throw error;
      });
    trx.commit();
    return createResponse(200, null);
  } catch (error) {
    console.log(error);
    if (trx) {
      trx.rollback(error);
    }
    return createResponse(500, error.message || 'Unexpected error');
  }
}

module.exports = {
  createPhotoManifest,
  createNISCPhotoManifest
}


// importDataToMySQL,
// createGeoJsonFile,
// getMapDataPreSignedUrl,
// getWorkOrderDetailsImagePreSignedUrl,
// generateReports,
// exportReportByType,
// exportInventoryReport,
// exportWorkOrdersReport,
// exportTechnicianReport,
// exportAssignmentsReport,
// xmlParser,
// handleBlackOutDates,
// findMissingPhotos,
// getUploadURL,
// addPhoto,
// handleExchangedByUtility,
// createPhotoManifest,
// adminCreateUser,
// adminCreateUserResendInvite,
// getInventoryUploadUrl,
// importInventoriesHandler,
// getUserAvatar
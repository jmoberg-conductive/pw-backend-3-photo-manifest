const JOEMCWorkOrderReportBuilder = require('../reports/joemcWorkOrderReportBuilder');
const CWPWorkOrderReportBuilder = require('../reports/cwpWorkOrderReportBuilder');
const SCPCWorkOrderReportBuilder = require('../reports/scpcWorkOrderReportBuilder');
const ACECWorkOrderReportBuilder = require('../reports/acecWorkOrderReportBuilder');
const RLECWorkOrderReportBuilder = require('../reports/rlecWorkOrderReportBuilder');
const WREAWorkOrderReportBuilder = require('../reports/wreaWorkOrderReportBuilder');
const MPUWorkOrderReportBuilder = require('../reports/mpuWorkOrderReportBuilder');
const SPECWorkOrderReportBuilder = require('../reports/specWorkOrderReportBuilder');
const ANECWorkOrderReportBuilder = require('../reports/anecWorkOrderReportBuilder');
const RECWorkOrderReportBuilder = require('../reports/recWorkOrderReportBuilder');
const TCECWorkOrderReportBuilder = require('../reports/tcecWorkOrderReportBuilder');
const MVEAWorkOrderReportBuilder = require('../reports/mveaWorkOrderReportBuilder');
const CLECOWorkOrderReportBuilder = require('../reports/clecoWorkOrderReportBuilder');
const AECWorkOrderReportBuilder = require('../reports/aecWorkOrderReportBuilder');
const MECWorkOrderReportBuilder = require('../reports/mecWorkOrderReportBuilder');
const CLECOQ419WorkOrderReportBuilder = require('../reports/clecoQ419WorkOrderReportBuilder');
const TCECFTWorkOrderReportBuilder = require('../reports/tcecFTWorkOrderReportBuilder');
const MWDWorkOrderReportBuilder = require('../reports/mwdWorkOrderReportBuilder');
const NOECWorkOrderReportBuilder = require('../reports/noecWorkOrderReportBuilder');
const FPIAWorkOrderReportBuilder = require('../reports/fpiaWorkOrderReportBuilder');
const GSWCWorkOrderReportBuilder = require('../reports/gswcWorkOrderReportBuilder');
const UCSWorkOrderReportBuilder = require('../reports/ucsWorkOrderReportBuilder');
const CFVWorkOrderReportBuilder = require('../reports/cfvWorkOrderReportBuilder');
const { WORKORDER_TABLE_NAME, WORKORDER_METER_DEPLOY_TABLE_NAME } = require('../db-tables');

getWorkOrderIdByOldMeterNumber = (workOrders, workOrder) => {
  const data = workOrders[workOrder.oldMeterNumber]
  return data && data ? data : null;
}

getWorkOrderIdByLocationId = (workOrders, workOrder) => {
  const data = workOrders[workOrder.locationId];
  return data && data ? data : null;
}

getWorkOrderIdByWorkOrderNumber = (workOrders, workOrder) => {
  const data = workOrders[workOrder.workOrderNumber];
  return data && data ? data : null;
}

module.exports = {
  dev: {
    'pw-sftp-test-dev': {},
    'pw-cus-cfv-dev': {
      reportsBuilder: new CFVWorkOrderReportBuilder('pw-cus-cfv-dev')
    },
    'pw-aus-ucs-dev': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new UCSWorkOrderReportBuilder('pw-aus-ucs-dev'),
      primaryKey: 'locationId',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'oldMeterNumber',
            accountnumber: 'accountnumber',
            customerName: 'customername',
            homePhoneNumber: 'homePhoneNumber',
            mobilePhoneNumber: 'mobilePhoneNumber',
            businessPhoneNumber: 'businessPhoneNumber',
            street: 'street',
            street2: 'street2',
            street3: 'street3',
            city: 'city',
            stateCode: 'stateCode',
            zipCode: 'zipCode',
            districtCode: 'districtCode',
            substationCode: 'substationCode',
            circuitCode: 'circuitCode',
            billingCycleCode: 'billingCycleCode',
            routeCode: 'routeCode',
            bookCode: 'bookCode',
            locationId: 'locationId',
            mapNumber: 'mapNumber',
            longitude: 'longitude',
            latitude: 'latitude'
          },
          canUpdateOnSync: [
            'accountnumber',
            'customerName',
            'homePhoneNumber',
            'mobilePhoneNumber',
            'businessPhoneNumber',
            'street',
            'street2',
            'street3',
            'city',
            'stateCode',
            'zipCode',
            'districtCode',
            'substationCode',
            'circuitCode',
            'billingCycleCode',
            'routeCode',
            'bookCode',
            'mapNumber',
            'longitude',
            'latitude'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['meterFormFactor'] !== null && csvDataRow['meterFormFactor'] !== undefined && csvDataRow['meterFormFactor']) {
              if (csvDataRow['meterClass'] !== null && csvDataRow['meterClass'] !== undefined && csvDataRow['meterClass']) {
                workOrder.meterFormFactor = `${csvDataRow['meterFormFactor']} | ${csvDataRow['meterClass']}`;
              }
            }
            if (csvDataRow['homePhoneNumber']) {
              workOrder.meterReadNotes = `${csvDataRow['homePhoneNumber']} | ${workOrder.meterReadNotes}`;
            }
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'oldMeterNumber',
            oldMeterKwhLastReading: 'oldMeterKwhLastReading',
            oldMeterKwLastReading: 'oldMeterKwLastReading',
            oldMeterKvaLastReading: 'oldMeterKvaLastReading',
            oldMeterKvarLastReading: 'oldMeterKvarLastReading',
            meterStatus: 'meterStatus',
            meterType: 'meterType',
            meterClass: 'meterClass',
            meterVoltage: 'meterVoltage',
            meterFormFactor: 'meterFormFactor',
            meterReadNotes: 'meterReadNotes',
            serviceType: 'serviceType',
            serviceDescription: 'serviceDescription',
            billingMultiplier: 'billingMultiplier',
            ReadSequence: 'ReadSequence',
            isMedical: 'isMedical',
            needsOpenDisconnectSwitch: 'needsOpenDisconnectSwitch',
            meterSetNumber: 'meterSetNumber',
            demandCode: 'demandCode',
            ptRatio: 'ptRatio',
            ctRatio: 'ctRatio',
            turnsRatio: 'turnsRatio'
          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'oldMeterKwLastReading',
            'oldMeterKvaLastReading',
            'oldMeterKvarLastReading',
            'meterStatus',
            'meterType',
            'meterClass',
            'meterVoltage',
            'meterFormFactor',
            'meterReadNotes',
            'serviceType',
            'serviceDescription',
            'billingMultiplier',
            'ReadSequence',
            'isMedical',
            'needsOpenDisconnectSwitch',
            'meterSetNumber',
            'demandCode',
            'ptRatio',
            'ctRatio',
            'turnsRatio'
          ]
        }
      }
    },
    'pw-cus-gswc-dev': {
      getWorkOrderId: getWorkOrderIdByWorkOrderNumber,
      reportsBuilder: new GSWCWorkOrderReportBuilder('pw-cus-gswc-dev'),
      primaryKey: 'workOrderNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'METER_ID',
            districtCode: 'CSA',
            billingCycleCode: 'CYCLE_NO',
            routeCode: 'ROUTE_NO',
            locationId: 'PREMISE_ID',
            street: 'ADDRESS',
            city: 'CITY',
            stateCode: 'STATE',
            zipCode: 'ZIP',
            longitude: 'X',
            latitude: 'Y'
          },
          canUpdateOnSync: []
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            ReadSequence: 'SEQ_NO',
            meterFormFactor: 'METER_SIZE',
            oldMeterNumber: 'BADGE_NBR',
            meterType: 'CHANNEL_ID',
            newMeterDial: 'NBR_OF_DGTS_LFT',
            meterReadNotes: 'LOCATION_NOTES',
            serviceDescription: 'New Register Part#'
          },
          canUpdateOnSync: []
        }
      }
    },
    'pw-aus-fpia-dev': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new FPIAWorkOrderReportBuilder('pw-aus-fpia-dev'),
      primaryKey: 'locationId',
      // New records will not be added on import data
      shouldSkipExchangedByUtility: (csvData) => {
        const columns = Object.keys(csvData[0]);
        return columns[0] === 'service Type';
      },
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'oldMeterNumber',
            street: 'street',
            mobilePhoneNumber: 'mobilePhoneNumber',
            billingCycleCode: 'billingCycleCode',
            locationId: 'locationId',
            accountNumber: 'accountNumber',
            customerName: 'customerName',
            homePhoneNumber: 'homePhoneNumber',
            stateCode: 'stateCode',
            businessPhoneNumber: 'businessPhoneNumber',
            city: 'city',
            districtCode: 'districtCode',
            routeCode: 'routeCode',
            zipCode: 'zipCode',
            latitude: 'latitude',
            longitude: 'longitude'
          },
          canUpdateOnSync: [
            'workOrderNumber',
            'street',
            'mobilePhoneNumber',
            'billingCycleCode',
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'stateCode',
            'businessPhoneNumber',
            'city',
            'routeCode',
            'districtCode',
            'zipCode',
            'latitude',
            'longitude'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            meterReadNotes: 'meterReadNotes',
            demandCode: 'demandCode',
            meterFormFactor: 'meterFormFactor',
            meterStatus: 'meterStatus',
            meterVoltage: 'meterVoltage',
            oldMeterNumber: 'oldMeterNumber',
            billingMultiplier: 'billingMultiplier',
            oldMeterKwhLastReading: 'oldMeterKwhLastReading',
            ReadSequence: 'ReadSequence',
            isMedical: 'isMedical',
            ptRatio: 'ptRatio',
            ctRatio: 'ctRatio'
          },
          canUpdateOnSync: [
            'meterReadNotes',
            'demandCode',
            'meterFormFactor',
            'meterStatus',
            'oldMeterNumber',
            'billingMultiplier',
            'oldMeterKwhLastReading',
            'ReadSequence',
            'isMedical',
            'ptRatio',
            'ctRatio'
          ]
        }
      }
    },
    'pw-sftp-aus-noec-dev': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new NOECWorkOrderReportBuilder('pw-sftp-aus-noec-dev'),
      primaryKey: 'locationId',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'oldMeterNumber',
            accountNumber: 'accountNumber',
            customerName: 'customerName',
            homePhoneNumber: 'homePhoneNumber',
            mobilePhoneNumber: 'mobilePhoneNumber',
            street: 'street',
            street2: 'street2',
            city: 'city',
            stateCode: 'stateCode',
            zipCode: 'zipCode',
            substationCode: 'substationCode',
            circuitCode: 'circuitCode',
            billingCycleCode: 'billingCycleCode',
            locationId: 'locationid',
            mapNumber: 'mapNumber',
            longitude: 'longitude',
            latitude: 'latitude'
          },
          canUpdateOnSync: [
            'workOrderNumber',
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'mobilePhoneNumber',
            'street',
            'street2',
            'city',
            'stateCode',
            'zipCode',
            'substationCode',
            'circuitCode',
            'billingCycleCode',
            'mapNumber',
            'longitude',
            'latitude'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            oldMeterNumber: 'oldMeterNumber',
            meterStatus: 'meterStatus',
            meterClass: 'meterClass',
            meterVoltage: 'meterVoltage',
            meterFormFactor: 'meterFormFactor',
            meterReadNotes: 'neterReadNotes',
            isMedical: 'isMedical'
          },
          canUpdateOnSync: [
            'oldMeterNumber',
            'meterStatus',
            'meterClass',
            'meterVoltage',
            'meterFormFactor',
            'meterReadNotes',
            'isMedical'
          ]
        }
      }
    },
    'pw-aus-ucs-ni-dev': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: null,
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'ND ID',
            accountNumber: 'ID',
            latitude: 'Survey Latitude',
            longitude: 'Survey Longitude',
            street: 'Survey Address',
            substationCode: 'Utility'
          },
          canUpdateOnSync: [
            'accountNumber',
            'latitude',
            'longitude',
            'street',
            'substationCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            const poleNumber = workOrder.meterStatus ? `${workOrder.meterStatus} | ` : '';
            const poleType = workOrder.serviceType ? `${workOrder.serviceType} | ` : '';
            const meterReadNotes = workOrder.meterReadNotes ? workOrder.meterReadNotes : '';
            workOrder.meterReadNotes = `Pole #: ${poleNumber}${poleType}${meterReadNotes}`;
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'ND ID',
            meterFormFactor: 'Device Type',
            meterStatus: 'Pole Number',
            serviceType: 'Pole Type',
            meterReadNotes: 'Survey Notes'
          },
          canUpdateOnSync: [
            'meterFormFactor',
            'meterStatus',
            'serviceType',
            'meterReadNotes'
          ]
        }
      }
    },
    'pw-cus-mwd-dev': {
      reportsBuilder: new MWDWorkOrderReportBuilder('pw-cus-mwd-dev')
    },
    'pw-sftp-aus-tcec-ft-dev': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new TCECFTWorkOrderReportBuilder('pw-sftp-aus-tcec-ft-dev'),
      primaryKey: 'locationId',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'Meter Number',
            accountNumber: 'Account Number',
            customerName: 'Account Name',
            homePhoneNumber: 'Home Phone',
            businessPhoneNumber: 'Work Phone',
            mapNumber: 'Map Number',
            street: 'Service Address w Unit',
            city: 'Service City',
            stateCode: 'Service State',
            zipCode: 'Service Zip',
            billingCycleCode: 'Billing Cycle',
            routeCode: 'Meter Reading Route',
            longitude: 'GPS State Plane X',
            latitude: 'GPS State Plane Y',
            substationCode: 'Substation',
            circuitCode: 'Feeder',
            locationId: 'Location Id'
          },
          canUpdateOnSync: [
            'workOrderNumber',
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'workPhoneNumber',
            'mapNumber',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'billingCycleCode',
            'routeCode',
            'longitude',
            'latitude',
            'substationCode',
            'circuitCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['Home Phone']) {
              workOrder.meterReadNotes = `${csvDataRow['Home Phone']} | ${workOrder.meterReadNotes}`;
            }
            if (csvDataRow['Meter Form'] !== null && csvDataRow['Meter Form'] !== undefined && csvDataRow['Meter Form']) {
              if (csvDataRow['Meter Class'] !== null && csvDataRow['Meter Class'] !== undefined && csvDataRow['Meter Class']) {
                workOrder.meterFormFactor = `${csvDataRow['Meter Form']} | ${csvDataRow['Meter Class']}`;
              }
            }
            return workOrder;
          },
          columnMappings: {
            serviceType: 'Account Class',
            oldMeterNumber: 'Meter Number',
            meterStatus: 'Meter Status',
            billingMultiplier: 'Multiplier',
            meterReadNotes: 'Meter Reading Notes',
            meterFormFactor: 'Meter Form',
            meterClass: 'Meter Class',
            meterVoltage: 'Meter Volts',
            oldMeterKwhLastReading: 'Last KWH Reading',
            isMedical: 'Medical Alert Account'
          },
          canUpdateOnSync: [
            'serviceType',
            'meterStatus',
            'billingMultiplier',
            'meterReadNotes',
            'meterFormFactor',
            'meterClass',
            'meterVoltage',
            'oldMeterKwhLastReading',
            'isMedical'
          ]
        }
      }
    },
    'pw-sftp-aus-cleco-q4-19-dev': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new CLECOQ419WorkOrderReportBuilder('pw-sftp-aus-cleco-q4-19-dev'),
      primaryKey: 'locationId',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            const street = workOrder.street;
            const street2 = csvDataRow['street2'];
            workOrder.street = `${street || ''}${street && street2 ? ' | ' : ''}${street2 || ''}`;
            return workOrder;
          },
          columnMappings: {
            workOrderNumber: 'oldMeterNumber',
            accountNumber: 'accountNumber',
            customerName: 'customerName',
            homePhoneNumber: 'homePhoneNumber',
            mobilePhoneNumber: 'mobilePhoneNumber',
            businessPhoneNumber: 'businessPhoneNumber',
            street: 'street',
            city: 'city',
            stateCode: 'stateCode',
            zipCode: 'zipCode',
            substationCode: 'substationCode',
            circuitCode: 'circuitCode',
            billingCycleCode: 'billingCycleCode',
            locationId: 'locationId',
            mapNumber: 'mapNumber',
            longitude: 'longitude',
            latitude: 'latitude',
            districtCode: 'districtCode'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'mobilePhoneNumber',
            'businessPhoneNumber',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'substationCode',
            'circuitCode',
            'billingCycleCode',
            'mapNumber',
            'longitude',
            'latitude',
            'districtCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['meterFormFactor'] !== null && csvDataRow['meterFormFactor'] !== undefined && csvDataRow['meterFormFactor']) {
              if (csvDataRow['meterClass'] !== null && csvDataRow['meterClass'] !== undefined && csvDataRow['meterClass']) {
                workOrder.meterFormFactor = `${csvDataRow['meterFormFactor']} | ${csvDataRow['meterClass']}`;
              }
            }
            const billingCycleCode = csvDataRow['billingCycleCode'];
            const meterReadNotes = workOrder.meterReadNotes;
            workOrder.meterReadNotes = `Cycle ${billingCycleCode}${meterReadNotes ? ` | ${meterReadNotes}` : ''}`;
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'oldMeterNumber',
            meterStatus: 'meterStatus',
            meterClass: 'meterClass',
            meterVoltage: 'meterVoltage',
            meterFormFactor: 'meterFormFactor',
            meterReadNotes: 'meterReadNotes',
            billingMultiplier: 'billingMultiplier',
            isMedical: 'isMedical',
            oldMeterKwhLastReading: 'oldMeterKwhLastReading'
          },
          canUpdateOnSync: [
            'meterStatus',
            'meterClass',
            'meterVoltage',
            'meterFormFactor',
            'meterReadNotes',
            'billingMultiplier',
            'isMedical',
            'oldMeterKwhLastReading'
          ]
        }
      }
    },
    'pw-sftp-aus-spec-ni-dev': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: null,
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'ND ID',
            accountNumber: 'ID',
            latitude: 'Survey Latitude',
            longitude: 'Survey Longitude',
            street: 'Survey Address',
            substationCode: 'Utility'
          },
          canUpdateOnSync: [
            'accountNumber',
            'latitude',
            'longitude',
            'street',
            'substationCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            const poleNumber = workOrder.meterStatus ? `${workOrder.meterStatus} | ` : '';
            const poleType = workOrder.serviceType ? `${workOrder.serviceType} | ` : '';
            const meterReadNotes = workOrder.meterReadNotes ? workOrder.meterReadNotes : '';
            workOrder.meterReadNotes = `Pole #: ${poleNumber}${poleType}${meterReadNotes}`;
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'ND ID',
            meterFormFactor: 'Device Type',
            meterStatus: 'Pole Number',
            serviceType: 'Pole Type',
            meterReadNotes: 'Survey Notes'
          },
          canUpdateOnSync: [
            'meterFormFactor',
            'meterStatus',
            'serviceType',
            'meterReadNotes'
          ]
        }
      }
    },
    'pw-sftp-aus-mec-dev': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new MECWorkOrderReportBuilder('pw-sftp-aus-mec-dev'),
      primaryKey: 'locationId',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'oldMeterNumber',
            accountNumber: 'accountNumber',
            customerName: 'customerName',
            homePhoneNumber: 'homePhoneNumber',
            mobilePhoneNumber: 'mobilePhoneNumber',
            businessPhoneNumber: 'businessPhoneNumber',
            street: 'street',
            city: 'city',
            stateCode: 'stateCode',
            zipCode: 'zipCode',
            districtCode: 'districtCode',
            substationCode: 'substationCode',
            circuitCode: 'circuitCode',
            billingCycleCode: 'billlingCycleCode',
            routeCode: 'routeCode',
            locationId: 'LocationId',
            mapNumber: 'mapNumber',
            longitude: 'longitude',
            latitude: 'latitude'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'mobilePhoneNumber',
            'businessPhoneNumber',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'districtCode',
            'substationCode',
            'circuitCode',
            'billingCycleCode',
            'routeCode',
            'mapNumber',
            'longitude',
            'latitude',
            'workOrderNumber'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['meterFormFactor'] !== null && csvDataRow['meterFormFactor'] !== undefined && csvDataRow['meterFormFactor']) {
              if (csvDataRow['meterClass'] !== null && csvDataRow['meterClass'] !== undefined && csvDataRow['meterClass']) {
                workOrder.meterFormFactor = `${csvDataRow['meterFormFactor']} | ${csvDataRow['meterClass']}`;
              }
            }
            if (csvDataRow['homePhoneNumber']) {
              workOrder.meterReadNotes = `${csvDataRow['homePhoneNumber']} | ${workOrder.meterReadNotes}`;
            }
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'oldMeterNumber',
            oldMeterKwhLastReading: 'oldMeterKwhLastReading',
            oldMeterKwLastReading: 'oldMeterKwLastReading',
            meterStatus: 'meterStatus',
            meterType: 'meterType',
            meterClass: 'meterClass',
            meterVoltage: 'meterVoltage',
            meterFormFactor: 'meterFormFactor',
            meterReadNotes: 'meterReadNotes',
            serviceType: 'serviceType',
            serviceDescription: 'serviceDescription',
            billingMultiplier: 'billingMultiplier',
            ReadSequence: 'ReadSequence',
            isMedical: 'isMedical',
            needsOpenDisconnectSwitch: 'OpenDisconnectSwitch',
            meterSetNumber: 'meterSetNumber',
            demandCode: 'demandCode'
          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'oldMeterKwLastReading',
            'meterStatus',
            'meterType',
            'meterClass',
            'meterVoltage',
            'meterFormFactor',
            'meterReadNotes',
            'serviceType',
            'serviceDescription',
            'billingMultiplier',
            'ReadSequence',
            'isMedical',
            'needsOpenDisconnectSwitch',
            'meterSetNumber',
            'demandCode',
            'oldMeterNumber'
          ]
        },
      }
    },
    'pw-sftp-aus-aec-dev': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: new AECWorkOrderReportBuilder('pw-sftp-aus-aec-dev'),
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'oldMeterNumber',
            accountNumber: 'accountNumber',
            customerName: 'customerName',
            homePhoneNumber: 'homePhoneNumber',
            mobilePhoneNumber: 'mobilePhoneNumber',
            businessPhoneNumber: 'businessPhoneNumber',
            street: 'street',
            city: 'city',
            stateCode: 'stateCode',
            zipCode: 'zipCode',
            districtCode: 'districtCode',
            substationCode: 'substationCode',
            circuitCode: 'circuitCode',
            billingCycleCode: 'billlingCycleCode',
            routeCode: 'routeCode',
            locationId: 'LocationId',
            mapNumber: 'mapNumber',
            longitude: 'longitude',
            latitude: 'latitude'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'mobilePhoneNumber',
            'businessPhoneNumber',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'districtCode',
            'substationCode',
            'circuitCode',
            'billingCycleCode',
            'routeCode',
            'locationId',
            'mapNumber',
            'longitude',
            'latitude'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['meterFormFactor'] !== null && csvDataRow['meterFormFactor'] !== undefined && csvDataRow['meterFormFactor']) {
              if (csvDataRow['meterClass'] !== null && csvDataRow['meterClass'] !== undefined && csvDataRow['meterClass']) {
                workOrder.meterFormFactor = `${csvDataRow['meterFormFactor']} | ${csvDataRow['meterClass']}`;
              }
            }
            if (csvDataRow['homePhoneNumber']) {
              workOrder.meterReadNotes = `${csvDataRow['homePhoneNumber']} | ${workOrder.meterReadNotes}`;
            }
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'oldMeterNumber',
            oldMeterKwhLastReading: 'oldMeterKwhLastReading',
            oldMeterKwLastReading: 'oldMeterKwLastReading',
            meterStatus: 'meterStatus',
            meterType: 'meterType',
            meterClass: 'meterClass',
            meterVoltage: 'meterVoltage',
            meterFormFactor: 'meterFormFactor',
            meterReadNotes: 'meterReadNotes',
            serviceType: 'serviceType',
            serviceDescription: 'serviceDescription',
            billingMultiplier: 'billingMultiplier',
            ReadSequence: 'ReadSequence',
            isMedical: 'isMedical',
            needsOpenDisconnectSwitch: 'OpenDisconnectSwitch',
            meterSetNumber: 'meterSetNumber',
            demandCode: 'demandCode'
          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'oldMeterKwLastReading',
            'meterStatus',
            'meterType',
            'meterClass',
            'meterVoltage',
            'meterFormFactor',
            'meterReadNotes',
            'serviceType',
            'serviceDescription',
            'billingMultiplier',
            'ReadSequence',
            'isMedical',
            'needsOpenDisconnectSwitch',
            'meterSetNumber',
            'demandCode'
          ]
        },
      }
    },
    'pw-sftp-aus-cleco-dev': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new CLECOWorkOrderReportBuilder('pw-sftp-aus-cleco-dev'),
      primaryKey: 'locationId',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'oldMeterNumber',
            accountNumber: 'accountNumber',
            customerName: 'customerName',
            homePhoneNumber: 'homePhoneNumber',
            mobilePhoneNumber: 'mobilePhoneNumber',
            businessPhoneNumber: 'businessPhoneNumber',
            street: 'street',
            city: 'city',
            stateCode: 'stateCode',
            zipCode: 'zipCode',
            substationCode: 'substationCode',
            circuitCode: 'circuitCode',
            billingCycleCode: 'billingCycleCode',
            locationId: 'locationId',
            mapNumber: 'mapNumber',
            longitude: 'longitude',
            latitude: 'latitude'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'mobilePhoneNumber',
            'businessPhoneNumber',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'substationCode',
            'circuitCode',
            'billingCycleCode',
            'mapNumber',
            'longitude',
            'latitude'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['meterFormFactor'] !== null && csvDataRow['meterFormFactor'] !== undefined && csvDataRow['meterFormFactor']) {
              if (csvDataRow['meterClass'] !== null && csvDataRow['meterClass'] !== undefined && csvDataRow['meterClass']) {
                workOrder.meterFormFactor = `${csvDataRow['meterFormFactor']} | ${csvDataRow['meterClass']}`;
              }
            }
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'oldMeterNumber',
            meterStatus: 'meterStatus',
            meterClass: 'meterClass',
            meterVoltage: 'meterVoltage',
            meterFormFactor: 'meterFormFactor',
            meterReadNotes: 'meterReadNotes',
            billingMultiplier: 'billingMultiplier',
            isMedical: 'isMedical',
            oldMeterKwhLastReading: 'oldMeterKwhLastReading'
          },
          canUpdateOnSync: [
            'meterStatus',
            'meterClass',
            'meterVoltage',
            'meterFormFactor',
            'meterReadNotes',
            'billingMultiplier',
            'isMedical',
            'oldMeterKwhLastReading'
          ]
        }
      }
    },
    'pw-sftp-aus-mvea-dev': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new MVEAWorkOrderReportBuilder('pw-sftp-aus-mvea-dev'),
      primaryKey: 'locationId',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'Old Meter Number',
            accountNumber: 'Account',
            customerName: 'Customer',
            homePhoneNumber: 'Home Phone',
            mobilePhoneNumber: 'Mobile Phone',
            businessPhoneNumber: 'Business Phone',
            street: 'Address',
            city: 'City',
            stateCode: 'State',
            zipCode: 'Zip',
            substationCode: 'SubArea',
            circuitCode: 'Circuit Number',
            billingCycleCode: 'Billing Cycle',
            routeCode: 'Route',
            locationId: 'Service Location',
            latitude: 'Old Latitude',
            longitude: 'Old Longitude',
            bookCode: 'Book',
            districtCode: 'Deployment_Schedule'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'mobilePhoneNumber',
            'businessPhoneNumber',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'substationCode',
            'circuitCode',
            'billingCycleCode',
            'routeCode',
            'latitude',
            'longitude',
            'bookCode',
            'workOrderNumber'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['meterFormFactor'] !== null && csvDataRow['meterFormFactor'] !== undefined && csvDataRow['meterFormFactor']) {
              if (csvDataRow['meterClass'] !== null && csvDataRow['meterClass'] !== undefined && csvDataRow['meterClass']) {
                workOrder.meterFormFactor = `${csvDataRow['meterFormFactor']} | ${csvDataRow['meterClass']}`;
              }
            }
            if (csvDataRow['Home Phone']) {
              workOrder.meterReadNotes = `${csvDataRow['Home Phone']} | ${workOrder.meterReadNotes}`;
            }
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'Old Meter Number',
            oldMeterKwhLastReading: 'Last kWh Reading',
            meterStatus: 'Service Status',
            meterClass: 'Meter Class',
            meterVoltage: 'Meter Volt',
            meterFormFactor: 'Meter Form',
            meterReadNotes: 'Read Notes',
            serviceDescription: 'Service Description',
            serviceType: 'Medical Needs',

          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'meterStatus',
            'meterClass',
            'meterVoltage',
            'meterFormFactor',
            'meterReadNotes',
            'serviceDescription',
            'serviceType',
            'oldMeterNumber'
          ]
        }
      }
    },
    'pw-sftp-aus-tricotx-dev': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new TCECWorkOrderReportBuilder('pw-sftp-aus-tricotx-dev'),
      primaryKey: 'locationId',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'Meter Number',
            accountNumber: 'Account Number',
            customerName: 'Account Name',
            homePhoneNumber: 'Home Phone',
            businessPhoneNumber: 'Work Phone',
            mapNumber: 'Map Number',
            street: 'Service Address w Unit',
            city: 'Service City',
            stateCode: 'Service State',
            zipCode: 'Service Zip',
            billingCycleCode: 'Billing Cycle',
            routeCode: 'Meter Reading Route',
            longitude: 'GPS State Plane X',
            latitude: 'GPS State Plane Y',
            substationCode: 'Substation',
            circuitCode: 'Feeder',
            locationId: 'Location Id'
          },
          canUpdateOnSync: [
            'workOrderNumber',
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'workPhoneNumber',
            'mapNumber',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'billingCycleCode',
            'routeCode',
            'longitude',
            'latitude',
            'substationCode',
            'circuitCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['Home Phone']) {
              workOrder.meterReadNotes = `${csvDataRow['Home Phone']} | ${workOrder.meterReadNotes}`;
            }
            if (csvDataRow['Meter Form'] !== null && csvDataRow['Meter Form'] !== undefined && csvDataRow['Meter Form']) {
              if (csvDataRow['Meter Class'] !== null && csvDataRow['Meter Class'] !== undefined && csvDataRow['Meter Class']) {
                workOrder.meterFormFactor = `${csvDataRow['Meter Form']} | ${csvDataRow['Meter Class']}`;
              }
            }
            return workOrder;
          },
          columnMappings: {
            serviceType: 'Account Class',
            oldMeterNumber: 'Meter Number',
            meterStatus: 'Meter Status',
            billingMultiplier: 'Multiplier',
            meterReadNotes: 'Meter Reading Notes',
            meterFormFactor: 'Meter Form',
            meterClass: 'Meter Class',
            meterVoltage: 'Meter Volts',
            oldMeterKwhLastReading: 'Last KWH Reading',
            isMedical: 'Medical Alert Account'
          },
          canUpdateOnSync: [
            'oldMeterNumber',
            'serviceType',
            'meterStatus',
            'billingMultiplier',
            'meterReadNotes',
            'meterFormFactor',
            'meterClass',
            'meterVoltage',
            'oldMeterKwhLastReading',
            'isMedical'
          ]
        }
      }
    },
    'pw-sftp-aus-rec-dev': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: new RECWorkOrderReportBuilder('pw-sftp-aus-rec-dev'),
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'Meter #',
            accountNumber: 'Account',
            customerName: 'Name',
            homePhoneNumber: 'Phone #',
            mobilePhoneNumber: 'Cell #',
            street: 'Address',
            city: 'City',
            stateCode: 'St',
            zipCode: 'Zip',
            mapNumber: 'Srv Map #',
            substationCode: 'Sub',
            circuitCode: 'Fdr',
            locationId: 'Srv Loc',
            latitude: 'Y Coord',
            longitude: 'X Coord'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'mobilePhoneNumber',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'mapNumber',
            'substationCode',
            'circuitCode',
            'locationId',
            'latitude',
            'longitude'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            oldMeterNumber: 'Meter #',
            oldMeterKwhLastReading: 'Prev Rdg',
            meterStatus: 'S/S',
            meterClass: 'Class',
            meterVoltage: 'Volts',
            meterFormFactor: 'Form',
            meterType: 'Meter Desc',
            serviceDescription: 'Srv Desc',
          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'meterStatus',
            'meterClass',
            'meterVoltage',
            'meterFormFactor',
            'meterType',
            'serviceDescription'
          ]
        }
      }
    },
    'pw-sftp-aus-anec-dev': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: new ANECWorkOrderReportBuilder('pw-sftp-aus-anec-dev'),
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'OldMeterNumber',
            accountNumber: 'AccountNumber',
            latitude: 'Latitude',
            longitude: 'Longitude',
            mapNumber: 'MapNumber',
            substationCode: 'SubareaName',
            billingCycleCode: 'BillingCycle',
            routeCode: 'RouteName',
            customerName: 'CustomerName',
            street: 'Street',
            homePhoneNumber: 'Phone',
            city: 'City',
            stateCode: 'State',
            zipCode: 'Zip',
            circuitCode: 'Feeder',
            customDataFields: [
              'AccountNumber'
            ]
          },
          canUpdateOnSync: [
            'accountNumber',
            'latitude',
            'longitude',
            'mapNumber',
            'substationCode',
            'billingCycleCode',
            'routeCode',
            'customerName',
            'street',
            'homePhoneNumber',
            'city',
            'stateCode',
            'zipCode',
            'circuitCode',
            'customDataFields'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            oldMeterNumber: 'OldMeterNumber',
            meterType: 'MeterType',
            oldMeterKwhLastReading: 'Reading',
            meterStatus: 'MeterStatus',
            meterReadNotes: 'ReadNotes',
            isMedical: 'IsMedical',
            meterFormFactor: 'FormFactor'
          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'meterStatus',
            'meterReadNotes',
            'isMedical',
            'meterFormFactor'
          ]
        }
      }
    },
    'pw-sftp-aus-spec-dev': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new SPECWorkOrderReportBuilder('pw-sftp-aus-spec-dev'),
      primaryKey: 'locationId',
      // New records will not be added on import data
      shouldSkipExchangedByUtility: (csvData) => {
        const columns = Object.keys(csvData[0]);
        return columns[0] === 'service Type';
      },
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            const circuitCode = csvDataRow['Wm Upline Feeder'];
            if (circuitCode && circuitCode.length > 0) {
              workOrder['circuitCode'] = circuitCode[circuitCode.length - 1];
            }
            return workOrder;
          },
          columnMappings: {
            workOrderNumber: 'METER',
            street: 'ADDR1',
            mobilePhoneNumber: 'CELLPHONE',
            billingCycleCode: 'CYCLE',
            locationId: 'Wm Element Name',
            accountNumber: 'MBRSEP (Custom SQL Query)',
            customerName: 'NAME',
            homePhoneNumber: 'TELEPHONE',
            stateCode: 'State',
            circuitCode: 'Wm Upline Feeder', // special
            substationCode: 'Wm Upline Source',
            street2: 'wmBF Address2',
            street3: 'wmBF Address3',
            businessPhoneNumber: 'wmBF Business',
            city: 'wmCityLimits_shp_PLACENAME',
            bookCode: 'wmLandis_Groups_shp_L_G_Group',
            districtCode: 'wmSPECDistricts_shp_SPECDistri',
            zipCode: 'wmZipCodes_shp_ZIP',
            latitude: 'wmLatitude',
            longitude: 'wmLongitude',
            customDataFields: [
              'EMAIL',
              'RATE'
            ]
          },
          canUpdateOnSync: [
            'workOrderNumber',
            'street',
            'mobilePhoneNumber',
            'billingCycleCode',
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'stateCode',
            'circuitCode',
            'substationCode',
            'street2',
            'street3',
            'businessPhoneNumber',
            'city',
            'bookCode',
            'districtCode',
            'zipeCode',
            'latitude',
            'longitude',
            'customDataFields'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            serviceDescription: 'ADDR1 (CAV_LOCINFODETL)',
            meterReadNotes: 'COMMENTS (CAV_LOCINFODETL)',
            demandCode: 'DEMANDCODE',
            meterFormFactor: 'FORM',
            oldMeterNumber: 'METER',
            billingMultiplier: 'MULT',
            oldMeterKwhLastReading: 'Max. METERREAD (CAV_MBRHISTDETL)',
            serviceType: 'service Type',
            isMedical: 'wmBF SpecialNeeds'
          },
          canUpdateOnSync: [
            'serviceDescription',
            'meterReadNotes',
            'demandCode',
            'meterFormFactor',
            'oldMeterNumber',
            'billingMultiplier',
            'oldMeterKwhLastReading',
            'serviceType',
            'isMedical'
          ]
        }
      }
    },
    'pw-sftp-aus-mecft-dev': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: null,
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'BI_MTR_NBR',
            accountNumber: 'BI_ACCT',
            mapNumber: 'BI_SRV_MAP_LOC',
            customerName: 'BI_SORT_NAME',
            street: 'BI_ADDR1',
            street2: 'BI_ADDR2',
            street3: 'BI_ADDR3',
            homePhoneNumber: 'BI_HOME_PHN',
            latitude: 'BI_Y_COORD',
            longitude: 'BI_X_COORD',
            billingCycleCode: 'BI_CYC_CD',
            substationCode: 'BI_SUB',
            routeCode: 'BI_ROUTE_CD',
            bookCode: 'BI_BOOK_CD',
            circuitCode: 'BI_FDR'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'latitude',
            'longitude',
            'billingCycleCode',
            'substationCode',
            'routeCode',
            'bookCode',
            'circuitCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            oldMeterNumber: 'BI_MTR_NBR',
            serviceType: 'BI_SRV_TYP',
            meterType: 'BI_MTR_TYP',
            oldMeterKwhLastReading: 'BI_LAST_VALID_RDG',
            meterStatus: 'BI_MTR_STAT_CD',
            meterFormFactor: 'BI_AMR_MOD_TYPE',
            isMedical: 'Medical',
            meterReadNotes: 'meterReadNotes',
            billingMultiplier: 'billingMultiplier'
          },
          canUpdateOnSync: [
            'serviceType',
            'meterType',
            'oldMeterKwhLastReading',
            'meterStatus',
            'meterFormFactor',
            'isMedical',
            'meterReadNotes',
            'billingMultiplier'
          ]
        }
      }
    },
    'pw-sftp-aus-mpu-dev': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: new MPUWorkOrderReportBuilder('pw-sftp-aus-mpu-dev'),
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'Old_Meter_Number',
            accountNumber: 'Account',
            customerName: 'Customer',
            street: 'Address',
            city: 'City',
            stateCode: 'State',
            zipCode: 'Zip',
            latitude: 'Old_Latitude',
            longitude: 'Old_Longitude',
            routeCode: 'Route',
            substationCode: 'SubArea',
            circuitCode: 'Circuit_Number',
            billingCycleCode: 'Billing_Cycle'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'substationCode',
            'circuitCode',
            'routeCode',
            'billingCycleCode',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'latitude',
            'longitude'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['Meter_Form'] !== null && csvDataRow['Meter_Form'] !== undefined && csvDataRow['Meter_Form']) {
              if (csvDataRow['Install Meter Type'] !== null && csvDataRow['Install Meter Type'] !== undefined && csvDataRow['Install Meter Type']) {
                workOrder.meterFormFactor = `${csvDataRow['Meter_Form']} | ${csvDataRow['Install Meter Type']}`;
              }
            }
            const csvMeterReadNotes = csvDataRow['Read_Notes'];
            const csvRouteCode = csvDataRow['Route'];
            if (csvMeterReadNotes && csvMeterReadNotes !== null && csvMeterReadNotes !== undefined && csvMeterReadNotes.length > 0) {
              if (csvRouteCode && csvRouteCode !== null && csvRouteCode !== undefined) {
                workOrder['meterReadNotes'] = `Route ${csvRouteCode} | ${csvMeterReadNotes}`;
              }
            }
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'Old_Meter_Number',
            oldMeterKwhLastReading: 'Last_kWh_Reading',
            meterStatus: 'Service_status',
            serviceType: 'Meter_Type',
            meterClass: 'Meter_Class',
            meterVoltage: 'Meter_Volt',
            meterFormFactor: 'Meter_Form',
            meterReadNotes: 'Read_Notes',
            meterType: 'Service_Type',
            billingMultiplier: 'billingMultiplier',
            ReadSequence: 'Read_Sequence',
            needsOpenDisconnectSwitch: 'Needs_open_SD'
          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'meterStatus',
            'meterFormFactor',
            'meterReadNotes',
            'needsOpenDisconnectSwitch',
            'serviceType',
            'meterClass',
            'meterVoltage',
            'billingMultiplier',
          ]
        }
      }
    },
    'pw-sftp-aus-wrea-dev': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: new WREAWorkOrderReportBuilder('pw-sftp-aus-wrea-dev'),
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            workOrder['homePhoneNumber'] = `${csvDataRow['BI_HOME_AREA_CD'] || ''}${csvDataRow['BI_HOME_AREA_CD'] && csvDataRow['BI_HOME_PHN'] ? '-' : ''}${csvDataRow['BI_HOME_PHN'] || ''}`;
            return workOrder;
          },
          columnMappings: {
            workOrderNumber: 'BI_MTR_NBR',
            accountNumber: 'BI_ACCT',
            mapNumber: 'BI_SRV_MAP_LOC',
            customerName: 'BI_SORT_NAME',
            billingCycleCode: 'BI_CYC_CD',
            street: 'BI_ADDR1',
            street2: 'BI_ADDR2',
            street3: 'BI_ADDR3',
            latitude: 'BI_Y_COORD',
            longitude: 'BI_X_COORD',
            substationCode: 'BI_SUB',
            routeCode: 'BI_ROUTE_CD',
            bookCode: 'BI_BOOK_CD',
            circuitCode: 'BI_FDR'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'billingCycleCode',
            'homePhoneNumber',
            'latitude',
            'longitude',
            'substationCode',
            'routeCode',
            'bookCode',
            'circuitCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            // homePhoneNumber does not exsist in .csv file so we need to create it like we did in WORKORDER_TABLE_NAME column data mapping
            const homePhoneNumber = `${csvDataRow['BI_HOME_AREA_CD'] || ''}${csvDataRow['BI_HOME_AREA_CD'] && csvDataRow['BI_HOME_PHN'] ? '-' : ''}${csvDataRow['BI_HOME_PHN'] || ''}`;
            workOrder['meterReadNotes'] = `${homePhoneNumber || ''}${homePhoneNumber && csvDataRow['BI_SORT_NAME'] ? ' | ' : ''}${csvDataRow['BI_SORT_NAME'] || ''}`;
            workOrder['serviceType'] = csvDataRow['BI_MULTIPLI'];
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'BI_MTR_NBR',
            meterType: 'KWH',
            oldMeterKwhLastReading: 'BI_LAST_VALID_RDG',
            meterStatus: 'BI_MTR_STAT_CD',
            meterFormFactor: 'BI_AMR_MOD_TYPE',
            isMedical: 'Medical',
            meterReadNotes: 'READ_NOTE',
            billingMultiplier: 'BI_MULTIPLI',
            serviceDescription: 'ServiceDescription'
          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'meterStatus',
            'meterFormFactor',
            'isMedical',
            'meterReadNotes',
            'billingMultiplier',
            'serviceType',
            'serviceDescription'
          ]
        }
      }
    },
    'pw-sftp-aus-rlec-dev': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: new RLECWorkOrderReportBuilder('pw-sftp-aus-rlec-dev'),
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'meterno',
            customerName: 'name',
            accountNumber: 'account',
            substationCode: 'sub',
            circuitCode: 'feeder',
            longitude: 'x',
            latitude: 'y',
            locationId: 'handle',
            homePhoneNumber: 'phone',
            street: 'address',
            routeCode: 'Tag'
          },
          canUpdateOnSync: [
            'customerName',
            'accountNumber',
            'substationCode',
            'circuitCode',
            'homePhoneNumber',
            'routeCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            workOrder['meterReadNotes'] = `${csvDataRow['phone'] || ''}${csvDataRow['phone'] && csvDataRow['name'] ? ' | ' : ''}${csvDataRow['name'] || ''}`;
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'meterno',
            billingMultiplier: 'metermult',
            meterFormFactor: 'meterform',
            oldMeterKwhLastReading: 'mtmainkwh',
            meterStatus: 'metertype'
          },
          canUpdateOnSync: [
            'billingMultiplier',
            'meterFormFactor',
            'oldMeterKwhLastReading',
            'meterStatus',
            'meterReadNotes'
          ]
        }
      }
    },
    'pw-sftp-aus-acec-dev': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: new ACECWorkOrderReportBuilder('pw-sftp-aus-acec-dev'),
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'Meter#',
            accountNumber: 'Acct#',
            customerName: 'Name',
            homePhoneNumber: 'Phone #',
            street: 'Address',
            city: 'City',
            stateCode: 'State',
            substationCode: 'Sub',
            circuitCode: 'Fee',
            billingCycleCode: 'Cycle',
            routeCode: 'Route',
            longitude: 'X_COORD',
            latitude: 'Y_COORD',
            mapNumber: 'wmElementN',
            bookCode: 'Book'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'substationCode',
            'billingCycleCode',
            'routeCode',
            'circuitCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            oldMeterNumber: 'Meter#',
            oldMeterKwhLastReading: 'Last RDG',
            meterFormFactor: 'Form #',
            meterStatus: 'Status',
            billingMultiplier: 'Multipli'
          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'meterFormFactor',
            'meterStatus',
            'billingMultiplier'
          ]
        }
      }
    },
    'pw-sftp-aus-scpc-dev': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: new SCPCWorkOrderReportBuilder('pw-sftp-aus-scpc-dev'),
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'OldMeterNumber',
            accountNumber: 'AccountNumber',
            latitude: 'Latitude',
            longitude: 'Longitude',
            mapNumber: 'MapNumber',
            substationCode: 'SubArea',
            billingCycleCode: 'BillingCycle',
            routeCode: 'RouteName',
            customerName: 'CustomerName',
            street: 'Street',
            locationId: 'LocationId',
            city: 'City',
            stateCode: 'StateCode',
            zipCode: 'Zip',
            homePhoneNumber: 'Phone',
            districtCode: 'District',
            circuitCode: 'Fdr'
          },
          canUpdateOnSync: [
            'substationCode',
            'districtCode',
            'billingCycleCode',
            'routeCode',
            'customerName',
            'homePhoneNumber',
            'accountNumber'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            workOrder.needsOpenDisconnectSwitch = csvDataRow['NeedDisconnect'] === 'YES';
            workOrder.isMedical = csvDataRow['IsMedical'] === 'YES';
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'OldMeterNumber',
            meterType: 'MeterType',
            oldMeterKwhLastReading: 'Reading',
            meterStatus: 'MeterStatus',
            meterReadNotes: 'ReadNotes',
            isMedical: 'IsMedical',
            needsOpenDisconnectSwitch: 'NeedDisconnect',
            meterFormFactor: 'FormFactor'
          },
          canUpdateOnSync: [
            'needsOpenDisconnectSwitch',
            'meterStatus',
            'meterReadNotes',
            'isMedical',
            'meterFormFactor'
          ]
        }
      }
    },
    'pw-sftp-aus-cwp-dev': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: new CWPWorkOrderReportBuilder('pw-sftp-aus-cwp-dev'),
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            // WorkOrder table
            // id - uuid
            // projectId - fetch this information from db
            workOrderNumber: 'OldMeterNumber',
            latitude: 'Latitude',
            longitude: 'Longitude',
            routeCode: 'RouteName',
            street: 'Street',
            city: 'City',
            locationId: 'LocationId',
            stateCode: 'StateCode',
            zipCode: 'Zip',
            accountNumber: 'AccountNumber',
            substationCode: 'SubareaName',
            billingCycleCode: 'BillingCycle',
            customerName: 'CustomerName',
            homePhoneNumber: 'Phone',
            mapNumber: 'MapNumber'
          },
          canUpdateOnSync: [
            'accountNumber',
            'substationCode',
            'billingCycleCode',
            'routeCode',
            'customerName',
            'homePhoneNumber'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            // WorkOrderMeterDeploy table
            // workOrderId
            // meterDeployId - uuid
            oldMeterNumber: 'OldMeterNumber',
            oldMeterKwhLastReading: 'Reading',
            meterType: 'MeterType',
            meterStatus: 'MeterStatus',
            meterReadNotes: 'ReadNotes',
            isMedical: 'IsMedical'
          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'oldMeterNumber',
            'meterReadNotes',
            'meterStatus'
          ]
        }
      }
    },
    'pw-sftp-aus-joemc-dev': {
      // SPECIAL COLUMNS: 
      // ERT Id
      // If exists prepend to meterReadNotes (prefix to meterReadNotes 47592716 | some notes)

      // Demand Meter
      // If 'Y' then append " | Demand" to workOrderNumber (suffix to workOrderNumber 88766 | Demand)
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new JOEMCWorkOrderReportBuilder('pw-sftp-aus-joemc-dev'),
      primaryKey: 'locationId',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['Demand Meter']) {
              workOrder.workOrderNumber = `${workOrder.workOrderNumber} | Demand`;
            }
            return workOrder;
          },
          columnMappings: {
            // WorkOrder table
            // id - uuid
            // projectId - fetch this information from db
            accountNumber: 'Account Number',
            customerName: 'Account Name',
            homePhoneNumber: 'Home Phone',
            street: 'Service Address w Unit',
            city: 'Service City',
            stateCode: 'Service State',
            zipCode: 'Service Zip',
            locationId: 'Location Id',
            longitude: 'GPS State Plane X',
            latitude: 'GPS State Plane Y',
            mobilePhoneNumber: 'Cell Phone',
            businessPhoneNumber: 'Work Phone',
            billingCycleCode: 'Billing Cycle',
            routeCode: 'Meter Reading Route',
            circuitCode: 'Feeder',
            workOrderNumber: 'Meter Number'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'mobilePhoneNumber',
            'businessPhoneNumber',
            'billingCycleCode',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'routeCode',
            'longitude',
            'latitude',
            'circuitCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['ERT Id']) {
              workOrder.meterReadNotes = `${csvDataRow['ERT Id']} | ${workOrder.meterReadNotes}`;
            }
            return workOrder;
          },
          columnMappings: {
            // WorkOrderMeterDeploy table
            // workOrderId
            // meterDeployId - uuid
            meterStatus: 'Account Status',
            oldMeterNumber: 'Meter Number',
            meterReadNotes: 'Meter Reading Notes',
            oldMeterKwhLastReading: 'Last KWH Reading',
            oldMeterKwLastReading: 'Last KW Reading',
            serviceDescription: 'Service Note',
            serviceType: 'Account Class',
            ReadSequence: 'Meter Reading Sequence',
            meterFormFactor: 'Meter Form',
            meterClass: 'Meter Class',
            meterVoltage: 'Meter Volts',
            isMedical: 'Medical Alert Account',
            billingMultiplier: 'Multiplier'
          },
          canUpdateOnSync: [
            'meterStatus',
            'serviceDescription',
            'oldMeterNumber',
            'meterReadNotes',
            'oldMeterKwhLastReading',
            'oldMeterKwLastReading',
            'isMedical',
            'serviceType',
            'ReadSequence',
            'billingMultiplier',
            'meterFormFactor',
            'meterClass',
            'meterVoltage'
          ]
        }
      }
    }
  },
  production: {
    'pw-cus-cfv': {
      reportsBuilder: new CFVWorkOrderReportBuilder('pw-cus-cfv')
    },
    'pw-aus-ucs': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new UCSWorkOrderReportBuilder('pw-aus-ucs'),
      primaryKey: 'locationId',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'oldMeterNumber',
            accountnumber: 'accountnumber',
            customerName: 'customername',
            homePhoneNumber: 'homePhoneNumber',
            mobilePhoneNumber: 'mobilePhoneNumber',
            businessPhoneNumber: 'businessPhoneNumber',
            street: 'street',
            street2: 'street2',
            street3: 'street3',
            city: 'city',
            stateCode: 'stateCode',
            zipCode: 'zipCode',
            districtCode: 'districtCode',
            substationCode: 'substationCode',
            circuitCode: 'circuitCode',
            billingCycleCode: 'billingCycleCode',
            routeCode: 'routeCode',
            bookCode: 'bookCode',
            locationId: 'locationId',
            mapNumber: 'mapNumber',
            longitude: 'longitude',
            latitude: 'latitude'
          },
          canUpdateOnSync: [
            'accountnumber',
            'customerName',
            'homePhoneNumber',
            'mobilePhoneNumber',
            'businessPhoneNumber',
            'street',
            'street2',
            'street3',
            'city',
            'stateCode',
            'zipCode',
            'districtCode',
            'substationCode',
            'circuitCode',
            'billingCycleCode',
            'routeCode',
            'bookCode',
            'mapNumber',
            'longitude',
            'latitude',
            'workOrderNumber'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['meterFormFactor'] !== null && csvDataRow['meterFormFactor'] !== undefined && csvDataRow['meterFormFactor']) {
              if (csvDataRow['meterClass'] !== null && csvDataRow['meterClass'] !== undefined && csvDataRow['meterClass']) {
                workOrder.meterFormFactor = `${csvDataRow['meterFormFactor']} | ${csvDataRow['meterClass']}`;
              }
            }
            if (csvDataRow['homePhoneNumber']) {
              workOrder.meterReadNotes = `${csvDataRow['homePhoneNumber']} | ${workOrder.meterReadNotes}`;
            }
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'oldMeterNumber',
            oldMeterKwhLastReading: 'oldMeterKwhLastReading',
            oldMeterKwLastReading: 'oldMeterKwLastReading',
            oldMeterKvaLastReading: 'oldMeterKvaLastReading',
            oldMeterKvarLastReading: 'oldMeterKvarLastReading',
            meterStatus: 'meterStatus',
            meterType: 'meterType',
            meterClass: 'meterClass',
            meterVoltage: 'meterVoltage',
            meterFormFactor: 'meterFormFactor',
            meterReadNotes: 'meterReadNotes',
            serviceType: 'serviceType',
            serviceDescription: 'serviceDescription',
            billingMultiplier: 'billingMultiplier',
            ReadSequence: 'ReadSequence',
            isMedical: 'isMedical',
            needsOpenDisconnectSwitch: 'needsOpenDisconnectSwitch',
            meterSetNumber: 'meterSetNumber',
            demandCode: 'demandCode',
            ptRatio: 'ptRatio',
            ctRatio: 'ctRatio',
            turnsRatio: 'turnsRatio'
          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'oldMeterKwLastReading',
            'oldMeterKvaLastReading',
            'oldMeterKvarLastReading',
            'meterStatus',
            'meterType',
            'meterClass',
            'meterVoltage',
            'meterFormFactor',
            'meterReadNotes',
            'serviceType',
            'serviceDescription',
            'billingMultiplier',
            'ReadSequence',
            'isMedical',
            'needsOpenDisconnectSwitch',
            'meterSetNumber',
            'demandCode',
            'ptRatio',
            'ctRatio',
            'turnsRatio',
            'oldMeterNumber'
          ]
        }
      }
    },
    'pw-cus-gswc': {
      getWorkOrderId: getWorkOrderIdByWorkOrderNumber,
      reportsBuilder: new GSWCWorkOrderReportBuilder('pw-cus-gswc'),
      primaryKey: 'workOrderNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'METER_ID',
            districtCode: 'CSA',
            billingCycleCode: 'CYCLE_NO',
            routeCode: 'ROUTE_NO',
            locationId: 'PREMISE_ID',
            street: 'ADDRESS',
            city: 'CITY',
            stateCode: 'STATE',
            zipCode: 'ZIP',
            longitude: 'X',
            latitude: 'Y'
          },
          canUpdateOnSync: []
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            ReadSequence: 'SEQ_NO',
            meterFormFactor: 'METER_SIZE',
            oldMeterNumber: 'BADGE_NBR',
            meterType: 'CHANNEL_ID',
            newMeterDial: 'NBR_OF_DGTS_LFT',
            meterReadNotes: 'LOCATION_NOTES',
            serviceDescription: 'New Register Part#'
          },
          canUpdateOnSync: []
        }
      }
    },
    'pw-aus-fpia': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new FPIAWorkOrderReportBuilder('pw-aus-fpia'),
      primaryKey: 'locationId',
      // New records will not be added on import data
      shouldSkipExchangedByUtility: (csvData) => {
        const columns = Object.keys(csvData[0]);
        return columns[0] === 'service Type';
      },
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'oldMeterNumber',
            street: 'street',
            mobilePhoneNumber: 'mobilePhoneNumber',
            billingCycleCode: 'billingCycleCode',
            locationId: 'locationId',
            accountNumber: 'accountNumber',
            customerName: 'customerName',
            homePhoneNumber: 'homePhoneNumber',
            stateCode: 'stateCode',
            businessPhoneNumber: 'businessPhoneNumber',
            city: 'city',
            districtCode: 'districtCode',
            routeCode: 'routeCode',
            zipCode: 'zipCode',
            latitude: 'latitude',
            longitude: 'longitude'
          },
          canUpdateOnSync: [
            'workOrderNumber',
            'street',
            'mobilePhoneNumber',
            'billingCycleCode',
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'stateCode',
            'businessPhoneNumber',
            'city',
            'routeCode',
            'districtCode',
            'zipCode',
            'latitude',
            'longitude'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            meterReadNotes: 'meterReadNotes',
            demandCode: 'demandCode',
            meterFormFactor: 'meterFormFactor',
            meterStatus: 'meterStatus',
            meterVoltage: 'meterVoltage',
            oldMeterNumber: 'oldMeterNumber',
            billingMultiplier: 'billingMultiplier',
            oldMeterKwhLastReading: 'oldMeterKwhLastReading',
            ReadSequence: 'ReadSequence',
            isMedical: 'isMedical',
            ptRatio: 'ptRatio',
            ctRatio: 'ctRatio'
          },
          canUpdateOnSync: [
            'meterReadNotes',
            'demandCode',
            'meterFormFactor',
            'meterStatus',
            'oldMeterNumber',
            'billingMultiplier',
            'oldMeterKwhLastReading',
            'ReadSequence',
            'isMedical',
            'ptRatio',
            'ctRatio'
          ]
        }
      }
    },
    'pw-sftp-aus-noec': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new NOECWorkOrderReportBuilder('pw-sftp-aus-noec'),
      primaryKey: 'locationId',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'oldMeterNumber',
            accountNumber: 'accountNumber',
            customerName: 'customerName',
            homePhoneNumber: 'homePhoneNumber',
            mobilePhoneNumber: 'mobilePhoneNumber',
            street: 'street',
            street2: 'street2',
            city: 'city',
            stateCode: 'stateCode',
            zipCode: 'zipCode',
            substationCode: 'substationCode',
            circuitCode: 'circuitCode',
            billingCycleCode: 'billingCycleCode',
            locationId: 'locationid',
            mapNumber: 'mapNumber',
            longitude: 'longitude',
            latitude: 'latitude'
          },
          canUpdateOnSync: [
            'workOrderNumber',
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'mobilePhoneNumber',
            'street',
            'street2',
            'city',
            'stateCode',
            'zipCode',
            'substationCode',
            'circuitCode',
            'billingCycleCode',
            'mapNumber',
            'longitude',
            'latitude'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            oldMeterNumber: 'oldMeterNumber',
            meterStatus: 'meterStatus',
            meterClass: 'meterClass',
            meterVoltage: 'meterVoltage',
            meterFormFactor: 'meterFormFactor',
            meterReadNotes: 'neterReadNotes',
            isMedical: 'isMedical'
          },
          canUpdateOnSync: [
            'oldMeterNumber',
            'meterStatus',
            'meterClass',
            'meterVoltage',
            'meterFormFactor',
            'meterReadNotes',
            'isMedical'
          ]
        }
      }
    },
    'pw-aus-ucs-ni': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: null,
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'ND ID',
            accountNumber: 'ID',
            latitude: 'Survey Latitude',
            longitude: 'Survey Longitude',
            street: 'Survey Address',
            substationCode: 'Utility'
          },
          canUpdateOnSync: [
            'accountNumber',
            'latitude',
            'longitude',
            'street',
            'substationCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            const poleNumber = workOrder.meterStatus ? `${workOrder.meterStatus} | ` : '';
            const poleType = workOrder.serviceType ? `${workOrder.serviceType} | ` : '';
            const meterReadNotes = workOrder.meterReadNotes ? workOrder.meterReadNotes : '';
            workOrder.meterReadNotes = `Pole #: ${poleNumber}${poleType}${meterReadNotes}`;
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'ND ID',
            meterFormFactor: 'Device Type',
            meterStatus: 'Pole Number',
            serviceType: 'Pole Type',
            meterReadNotes: 'Survey Notes'
          },
          canUpdateOnSync: [
            'meterFormFactor',
            'meterStatus',
            'serviceType',
            'meterReadNotes'
          ]
        }
      }
    },
    'pw-cus-mwd': {
      reportsBuilder: new MWDWorkOrderReportBuilder('pw-cus-mwd')
    },
    'pw-sftp-aus-tcec-ft': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new TCECFTWorkOrderReportBuilder('pw-sftp-aus-tcec-ft'),
      primaryKey: 'locationId',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'Meter Number',
            accountNumber: 'Account Number',
            customerName: 'Account Name',
            homePhoneNumber: 'Home Phone',
            businessPhoneNumber: 'Work Phone',
            mapNumber: 'Map Number',
            street: 'Service Address w Unit',
            city: 'Service City',
            stateCode: 'Service State',
            zipCode: 'Service Zip',
            billingCycleCode: 'Billing Cycle',
            routeCode: 'Meter Reading Route',
            longitude: 'GPS State Plane X',
            latitude: 'GPS State Plane Y',
            substationCode: 'Substation',
            circuitCode: 'Feeder',
            locationId: 'Location Id'
          },
          canUpdateOnSync: [
            'workOrderNumber',
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'workPhoneNumber',
            'mapNumber',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'billingCycleCode',
            'routeCode',
            'longitude',
            'latitude',
            'substationCode',
            'circuitCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['Home Phone']) {
              workOrder.meterReadNotes = `${csvDataRow['Home Phone']} | ${workOrder.meterReadNotes}`;
            }
            if (csvDataRow['Meter Form'] !== null && csvDataRow['Meter Form'] !== undefined && csvDataRow['Meter Form']) {
              if (csvDataRow['Meter Class'] !== null && csvDataRow['Meter Class'] !== undefined && csvDataRow['Meter Class']) {
                workOrder.meterFormFactor = `${csvDataRow['Meter Form']} | ${csvDataRow['Meter Class']}`;
              }
            }
            return workOrder;
          },
          columnMappings: {
            serviceType: 'Account Class',
            oldMeterNumber: 'Meter Number',
            meterStatus: 'Meter Status',
            billingMultiplier: 'Multiplier',
            meterReadNotes: 'Meter Reading Notes',
            meterFormFactor: 'Meter Form',
            meterClass: 'Meter Class',
            meterVoltage: 'Meter Volts',
            oldMeterKwhLastReading: 'Last KWH Reading',
            isMedical: 'Medical Alert Account'
          },
          canUpdateOnSync: [
            'serviceType',
            'meterStatus',
            'billingMultiplier',
            'meterReadNotes',
            'meterFormFactor',
            'meterClass',
            'meterVoltage',
            'oldMeterKwhLastReading',
            'isMedical'
          ]
        }
      }
    },
    'pw-sftp-aus-cleco-q4-19': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new CLECOQ419WorkOrderReportBuilder('pw-sftp-aus-cleco-q4-19'),
      primaryKey: 'locationId',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            const street = workOrder.street;
            const street2 = csvDataRow['street2'];
            workOrder.street = `${street || ''}${street && street2 ? ' | ' : ''}${street2 || ''}`;
            return workOrder;
          },
          columnMappings: {
            workOrderNumber: 'oldMeterNumber',
            accountNumber: 'accountNumber',
            customerName: 'customerName',
            homePhoneNumber: 'homePhoneNumber',
            mobilePhoneNumber: 'mobilePhoneNumber',
            businessPhoneNumber: 'businessPhoneNumber',
            street: 'street',
            city: 'city',
            stateCode: 'stateCode',
            zipCode: 'zipCode',
            substationCode: 'substationCode',
            circuitCode: 'circuitCode',
            billingCycleCode: 'billingCycleCode',
            locationId: 'locationId',
            mapNumber: 'mapNumber',
            longitude: 'longitude',
            latitude: 'latitude',
            districtCode: 'districtCode'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'mobilePhoneNumber',
            'businessPhoneNumber',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'substationCode',
            'circuitCode',
            'billingCycleCode',
            'mapNumber',
            'longitude',
            'latitude',
            'districtCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['meterFormFactor'] !== null && csvDataRow['meterFormFactor'] !== undefined && csvDataRow['meterFormFactor']) {
              if (csvDataRow['meterClass'] !== null && csvDataRow['meterClass'] !== undefined && csvDataRow['meterClass']) {
                workOrder.meterFormFactor = `${csvDataRow['meterFormFactor']} | ${csvDataRow['meterClass']}`;
              }
            }
            const billingCycleCode = csvDataRow['billingCycleCode'];
            const meterReadNotes = workOrder.meterReadNotes;
            workOrder.meterReadNotes = `Cycle ${billingCycleCode}${meterReadNotes ? ` | ${meterReadNotes}` : ''}`;
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'oldMeterNumber',
            meterStatus: 'meterStatus',
            meterClass: 'meterClass',
            meterVoltage: 'meterVoltage',
            meterFormFactor: 'meterFormFactor',
            meterReadNotes: 'meterReadNotes',
            billingMultiplier: 'billingMultiplier',
            isMedical: 'isMedical',
            oldMeterKwhLastReading: 'oldMeterKwhLastReading'
          },
          canUpdateOnSync: [
            'meterStatus',
            'meterClass',
            'meterVoltage',
            'meterFormFactor',
            'meterReadNotes',
            'billingMultiplier',
            'isMedical',
            'oldMeterKwhLastReading'
          ]
        }
      }
    },
    'pw-sftp-aus-spec-ni': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: null,
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'ND ID',
            accountNumber: 'ID',
            latitude: 'Survey Latitude',
            longitude: 'Survey Longitude',
            street: 'Survey Address',
            substationCode: 'Utility'
          },
          canUpdateOnSync: [
            'accountNumber',
            'latitude',
            'longitude',
            'street',
            'substationCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            const poleNumber = workOrder.meterStatus ? `${workOrder.meterStatus} | ` : '';
            const poleType = workOrder.serviceType ? `${workOrder.serviceType} | ` : '';
            const meterReadNotes = workOrder.meterReadNotes ? workOrder.meterReadNotes : '';
            workOrder.meterReadNotes = `Pole #: ${poleNumber}${poleType}${meterReadNotes}`;
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'ND ID',
            meterFormFactor: 'Device Type',
            meterStatus: 'Pole Number',
            serviceType: 'Pole Type',
            meterReadNotes: 'Survey Notes'
          },
          canUpdateOnSync: [
            'meterFormFactor',
            'meterStatus',
            'serviceType',
            'meterReadNotes'
          ]
        }
      }
    },
    'pw-sftp-aus-mec': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new MECWorkOrderReportBuilder('pw-sftp-aus-mec'),
      primaryKey: 'locationId',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'oldMeterNumber',
            accountNumber: 'accountNumber',
            customerName: 'customerName',
            homePhoneNumber: 'homePhoneNumber',
            mobilePhoneNumber: 'mobilePhoneNumber',
            businessPhoneNumber: 'businessPhoneNumber',
            street: 'street',
            city: 'city',
            stateCode: 'stateCode',
            zipCode: 'zipCode',
            districtCode: 'districtCode',
            substationCode: 'substationCode',
            circuitCode: 'circuitCode',
            billingCycleCode: 'billlingCycleCode',
            routeCode: 'routeCode',
            locationId: 'LocationId',
            mapNumber: 'mapNumber',
            longitude: 'longitude',
            latitude: 'latitude'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'mobilePhoneNumber',
            'businessPhoneNumber',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'districtCode',
            'substationCode',
            'circuitCode',
            'billingCycleCode',
            'routeCode',
            'mapNumber',
            'longitude',
            'latitude',
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['meterFormFactor'] !== null && csvDataRow['meterFormFactor'] !== undefined && csvDataRow['meterFormFactor']) {
              if (csvDataRow['meterClass'] !== null && csvDataRow['meterClass'] !== undefined && csvDataRow['meterClass']) {
                workOrder.meterFormFactor = `${csvDataRow['meterFormFactor']} | ${csvDataRow['meterClass']}`;
              }
            }
            if (csvDataRow['homePhoneNumber']) {
              workOrder.meterReadNotes = `${csvDataRow['homePhoneNumber']} | ${workOrder.meterReadNotes}`;
            }
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'oldMeterNumber',
            oldMeterKwhLastReading: 'oldMeterKwhLastReading',
            oldMeterKwLastReading: 'oldMeterKwLastReading',
            meterStatus: 'meterStatus',
            meterType: 'meterType',
            meterClass: 'meterClass',
            meterVoltage: 'meterVoltage',
            meterFormFactor: 'meterFormFactor',
            meterReadNotes: 'meterReadNotes',
            serviceType: 'serviceType',
            serviceDescription: 'serviceDescription',
            billingMultiplier: 'billingMultiplier',
            ReadSequence: 'ReadSequence',
            isMedical: 'isMedical',
            needsOpenDisconnectSwitch: 'OpenDisconnectSwitch',
            meterSetNumber: 'meterSetNumber',
            demandCode: 'demandCode'
          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'oldMeterKwLastReading',
            'meterStatus',
            'meterType',
            'meterClass',
            'meterVoltage',
            'meterFormFactor',
            'meterReadNotes',
            'serviceType',
            'serviceDescription',
            'billingMultiplier',
            'ReadSequence',
            'isMedical',
            'needsOpenDisconnectSwitch',
            'meterSetNumber',
            'demandCode',
            'oldMeterNumber'
          ]
        },
      }
    },
    'pw-sftp-aus-aec': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: new AECWorkOrderReportBuilder('pw-sftp-aus-aec'),
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'oldMeterNumber',
            accountNumber: 'accountNumber',
            customerName: 'customerName',
            homePhoneNumber: 'homePhoneNumber',
            mobilePhoneNumber: 'mobilePhoneNumber',
            businessPhoneNumber: 'businessPhoneNumber',
            street: 'street',
            city: 'city',
            stateCode: 'stateCode',
            zipCode: 'zipCode',
            districtCode: 'districtCode',
            substationCode: 'substationCode',
            circuitCode: 'circuitCode',
            billingCycleCode: 'billlingCycleCode',
            routeCode: 'routeCode',
            locationId: 'LocationId',
            mapNumber: 'mapNumber',
            longitude: 'longitude',
            latitude: 'latitude'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'mobilePhoneNumber',
            'businessPhoneNumber',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'districtCode',
            'substationCode',
            'circuitCode',
            'billingCycleCode',
            'routeCode',
            'locationId',
            'mapNumber',
            'longitude',
            'latitude'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['meterFormFactor'] !== null && csvDataRow['meterFormFactor'] !== undefined && csvDataRow['meterFormFactor']) {
              if (csvDataRow['meterClass'] !== null && csvDataRow['meterClass'] !== undefined && csvDataRow['meterClass']) {
                workOrder.meterFormFactor = `${csvDataRow['meterFormFactor']} | ${csvDataRow['meterClass']}`;
              }
            }
            if (csvDataRow['homePhoneNumber']) {
              workOrder.meterReadNotes = `${csvDataRow['homePhoneNumber']} | ${workOrder.meterReadNotes}`;
            }
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'oldMeterNumber',
            oldMeterKwhLastReading: 'oldMeterKwhLastReading',
            oldMeterKwLastReading: 'oldMeterKwLastReading',
            meterStatus: 'meterStatus',
            meterType: 'meterType',
            meterClass: 'meterClass',
            meterVoltage: 'meterVoltage',
            meterFormFactor: 'meterFormFactor',
            meterReadNotes: 'meterReadNotes',
            serviceType: 'serviceType',
            serviceDescription: 'serviceDescription',
            billingMultiplier: 'billingMultiplier',
            ReadSequence: 'ReadSequence',
            isMedical: 'isMedical',
            needsOpenDisconnectSwitch: 'OpenDisconnectSwitch',
            meterSetNumber: 'meterSetNumber',
            demandCode: 'demandCode'
          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'oldMeterKwLastReading',
            'meterStatus',
            'meterType',
            'meterClass',
            'meterVoltage',
            'meterFormFactor',
            'meterReadNotes',
            'serviceType',
            'serviceDescription',
            'billingMultiplier',
            'ReadSequence',
            'isMedical',
            'needsOpenDisconnectSwitch',
            'meterSetNumber',
            'demandCode'
          ]
        },
      }
    },
    'pw-sftp-aus-mvea': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new MVEAWorkOrderReportBuilder('pw-sftp-aus-mvea'),
      primaryKey: 'locationId',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'Old Meter Number',
            accountNumber: 'Account',
            customerName: 'Customer',
            homePhoneNumber: 'Home Phone',
            mobilePhoneNumber: 'Mobile Phone',
            businessPhoneNumber: 'Business Phone',
            street: 'Address',
            city: 'City',
            stateCode: 'State',
            zipCode: 'Zip',
            substationCode: 'SubArea',
            circuitCode: 'Circuit Number',
            billingCycleCode: 'Billing Cycle',
            routeCode: 'Route',
            locationId: 'Service Location',
            latitude: 'Old Latitude',
            longitude: 'Old Longitude',
            bookCode: 'Book',
            districtCode: 'Deployment_Schedule'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'mobilePhoneNumber',
            'businessPhoneNumber',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'substationCode',
            'circuitCode',
            'billingCycleCode',
            'routeCode',
            'latitude',
            'longitude',
            'bookCode',
            'workOrderNumber'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['meterFormFactor'] !== null && csvDataRow['meterFormFactor'] !== undefined && csvDataRow['meterFormFactor']) {
              if (csvDataRow['meterClass'] !== null && csvDataRow['meterClass'] !== undefined && csvDataRow['meterClass']) {
                workOrder.meterFormFactor = `${csvDataRow['meterFormFactor']} | ${csvDataRow['meterClass']}`;
              }
            }
            if (csvDataRow['Home Phone']) {
              workOrder.meterReadNotes = `${csvDataRow['Home Phone']} | ${workOrder.meterReadNotes}`;
            }
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'Old Meter Number',
            oldMeterKwhLastReading: 'Last kWh Reading',
            meterStatus: 'Service Status',
            meterClass: 'Meter Class',
            meterVoltage: 'Meter Volt',
            meterFormFactor: 'Meter Form',
            meterReadNotes: 'Read Notes',
            serviceDescription: 'Service Description',
            serviceType: 'Medical Needs',

          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'meterStatus',
            'meterClass',
            'meterVoltage',
            'meterFormFactor',
            'meterReadNotes',
            'serviceDescription',
            'serviceType',
            'oldMeterNumber'
          ]
        }
      }
    },
    'pw-sftp-aus-cleco': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new CLECOWorkOrderReportBuilder('pw-sftp-aus-cleco'),
      primaryKey: 'locationId',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'oldMeterNumber',
            accountNumber: 'accountNumber',
            customerName: 'customerName',
            homePhoneNumber: 'homePhoneNumber',
            mobilePhoneNumber: 'mobilePhoneNumber',
            businessPhoneNumber: 'businessPhoneNumber',
            street: 'street',
            city: 'city',
            stateCode: 'stateCode',
            zipCode: 'zipCode',
            substationCode: 'substationCode',
            circuitCode: 'circuitCode',
            billingCycleCode: 'billingCycleCode',
            locationId: 'locationId',
            mapNumber: 'mapNumber',
            longitude: 'longitude',
            latitude: 'latitude'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'mobilePhoneNumber',
            'businessPhoneNumber',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'substationCode',
            'circuitCode',
            'billingCycleCode',
            'mapNumber',
            'longitude',
            'latitude'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['meterFormFactor'] !== null && csvDataRow['meterFormFactor'] !== undefined && csvDataRow['meterFormFactor']) {
              if (csvDataRow['meterClass'] !== null && csvDataRow['meterClass'] !== undefined && csvDataRow['meterClass']) {
                workOrder.meterFormFactor = `${csvDataRow['meterFormFactor']} | ${csvDataRow['meterClass']}`;
              }
            }
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'oldMeterNumber',
            meterStatus: 'meterStatus',
            meterClass: 'meterClass',
            meterVoltage: 'meterVoltage',
            meterFormFactor: 'meterFormFactor',
            meterReadNotes: 'meterReadNotes',
            billingMultiplier: 'billingMultiplier',
            isMedical: 'isMedical',
            oldMeterKwhLastReading: 'oldMeterKwhLastReading'
          },
          canUpdateOnSync: [
            'meterStatus',
            'meterClass',
            'meterVoltage',
            'meterFormFactor',
            'meterReadNotes',
            'billingMultiplier',
            'isMedical',
            'oldMeterKwhLastReading'
          ]
        }
      }
    },
    'pw-sftp-aus-tricotx': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new TCECWorkOrderReportBuilder('pw-sftp-aus-tricotx'),
      primaryKey: 'locationId',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'Meter Number',
            accountNumber: 'Account Number',
            customerName: 'Account Name',
            homePhoneNumber: 'Home Phone',
            businessPhoneNumber: 'Work Phone',
            mapNumber: 'Map Number',
            street: 'Service Address w Unit',
            city: 'Service City',
            stateCode: 'Service State',
            zipCode: 'Service Zip',
            billingCycleCode: 'Billing Cycle',
            routeCode: 'Meter Reading Route',
            longitude: 'GPS State Plane X',
            latitude: 'GPS State Plane Y',
            substationCode: 'Substation',
            circuitCode: 'Feeder',
            locationId: 'Location Id'
          },
          canUpdateOnSync: [
            'workOrderNumber',
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'workPhoneNumber',
            'mapNumber',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'billingCycleCode',
            'routeCode',
            'longitude',
            'latitude',
            'substationCode',
            'circuitCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['Home Phone']) {
              workOrder.meterReadNotes = `${csvDataRow['Home Phone']} | ${workOrder.meterReadNotes}`;
            }
            if (csvDataRow['Meter Form'] !== null && csvDataRow['Meter Form'] !== undefined && csvDataRow['Meter Form']) {
              if (csvDataRow['Meter Class'] !== null && csvDataRow['Meter Class'] !== undefined && csvDataRow['Meter Class']) {
                workOrder.meterFormFactor = `${csvDataRow['Meter Form']} | ${csvDataRow['Meter Class']}`;
              }
            }
            return workOrder;
          },
          columnMappings: {
            serviceType: 'Account Class',
            oldMeterNumber: 'Meter Number',
            meterStatus: 'Meter Status',
            billingMultiplier: 'Multiplier',
            meterReadNotes: 'Meter Reading Notes',
            meterFormFactor: 'Meter Form',
            meterClass: 'Meter Class',
            meterVoltage: 'Meter Volts',
            oldMeterKwhLastReading: 'Last KWH Reading',
            isMedical: 'Medical Alert Account'
          },
          canUpdateOnSync: [
            'oldMeterNumber',
            'serviceType',
            'meterStatus',
            'billingMultiplier',
            'meterReadNotes',
            'meterFormFactor',
            'meterClass',
            'meterVoltage',
            'oldMeterKwhLastReading',
            'isMedical'
          ]
        }
      }
    },
    'pw-sftp-aus-rec': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: new RECWorkOrderReportBuilder('pw-sftp-aus-rec'),
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'Meter #',
            accountNumber: 'Account',
            customerName: 'Name',
            homePhoneNumber: 'Phone #',
            mobilePhoneNumber: 'Cell #',
            street: 'Address',
            city: 'City',
            stateCode: 'St',
            zipCode: 'Zip',
            mapNumber: 'Srv Map #',
            substationCode: 'Sub',
            circuitCode: 'Fdr',
            locationId: 'Srv Loc',
            latitude: 'Y Coord',
            longitude: 'X Coord'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'mobilePhoneNumber',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'mapNumber',
            'substationCode',
            'circuitCode',
            'locationId',
            'latitude',
            'longitude'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            oldMeterNumber: 'Meter #',
            oldMeterKwhLastReading: 'Prev Rdg',
            meterStatus: 'S/S',
            meterClass: 'Class',
            meterVoltage: 'Volts',
            meterFormFactor: 'Form',
            meterType: 'Meter Desc',
            serviceDescription: 'Srv Desc',
          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'meterStatus',
            'meterClass',
            'meterVoltage',
            'meterFormFactor',
            'meterType',
            'serviceDescription'
          ]
        }
      }
    },
    'pw-sftp-aus-anec': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: new ANECWorkOrderReportBuilder('pw-sftp-aus-anec'),
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'OldMeterNumber',
            accountNumber: 'AccountNumber',
            latitude: 'Latitude',
            longitude: 'Longitude',
            mapNumber: 'MapNumber',
            substationCode: 'SubareaName',
            billingCycleCode: 'BillingCycle',
            routeCode: 'RouteName',
            customerName: 'CustomerName',
            street: 'Street',
            homePhoneNumber: 'Phone',
            city: 'City',
            stateCode: 'State',
            zipCode: 'Zip',
            circuitCode: 'Feeder'
          },
          canUpdateOnSync: [
            'accountNumber',
            'latitude',
            'longitude',
            'mapNumber',
            'substationCode',
            'billingCycleCode',
            'routeCode',
            'customerName',
            'street',
            'homePhoneNumber',
            'city',
            'stateCode',
            'zipCode',
            'circuitCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            oldMeterNumber: 'OldMeterNumber',
            meterType: 'MeterType',
            oldMeterKwhLastReading: 'Reading',
            meterStatus: 'MeterStatus',
            meterReadNotes: 'ReadNotes',
            isMedical: 'IsMedical',
            meterFormFactor: 'FormFactor'
          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'meterStatus',
            'meterReadNotes',
            'isMedical',
            'meterFormFactor'
          ]
        }
      }
    },
    'pw-sftp-aus-spec': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new SPECWorkOrderReportBuilder('pw-sftp-aus-spec'),
      primaryKey: 'locationId',
      // New records will not be added on import data
      shouldSkipExchangedByUtility: (csvData) => {
        const columns = Object.keys(csvData[0]);
        return columns[0] === 'service Type';
      },
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            const circuitCode = csvDataRow['Wm Upline Feeder'];
            if (circuitCode && circuitCode.length > 0) {
              workOrder['circuitCode'] = circuitCode[circuitCode.length - 1];
            }
            if (csvDataRow['Max. VENDOR'] && csvDataRow['Max. VENDOR'] === '03') {
              workOrder['workOrderNeedsSiteTest'] = 1;
            }
            return workOrder;
          },
          columnMappings: {
            workOrderNumber: 'METER',
            street: 'ADDR1',
            mobilePhoneNumber: 'CELLPHONE',
            billingCycleCode: 'CYCLE',
            locationId: 'Wm Element Name',
            accountNumber: 'MBRSEP (Custom SQL Query)',
            customerName: 'NAME',
            homePhoneNumber: 'TELEPHONE',
            stateCode: 'State',
            circuitCode: 'Wm Upline Feeder', // special
            substationCode: 'Wm Upline Source',
            street2: 'wmBF Address2',
            street3: 'wmBF Address3',
            businessPhoneNumber: 'wmBF Business',
            city: 'wmCityLimits_shp_PLACENAME',
            bookCode: 'wmLandis_Groups_shp_L_G_Group',
            districtCode: 'wmSPECDistricts_shp_SPECDistri',
            zipCode: 'wmZipCodes_shp_ZIP',
            latitude: 'wmLatitude',
            longitude: 'wmLongitude',
            customDataFields: [
              'EMAIL',
              'RATE'
            ]
          },
          canUpdateOnSync: [
            'workOrderNumber',
            'street',
            'mobilePhoneNumber',
            'billingCycleCode',
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'stateCode',
            'circuitCode',
            'substationCode',
            'street2',
            'street3',
            'businessPhoneNumber',
            'city',
            'bookCode',
            'districtCode',
            'zipeCode',
            'latitude',
            'longitude',
            'customDataFields'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            serviceDescription: 'ADDR1 (CAV_LOCINFODETL)',
            meterReadNotes: 'COMMENTS (CAV_LOCINFODETL)',
            demandCode: 'DEMANDCODE',
            meterFormFactor: 'FORM',
            oldMeterNumber: 'METER',
            billingMultiplier: 'MULT',
            oldMeterKwhLastReading: 'Max. METERREAD (CAV_MBRHISTDETL)',
            serviceType: 'service Type',
            isMedical: 'wmBF SpecialNeeds'
          },
          canUpdateOnSync: [
            'serviceDescription',
            'meterReadNotes',
            'demandCode',
            'meterFormFactor',
            'oldMeterNumber',
            'billingMultiplier',
            'oldMeterKwhLastReading',
            'serviceType',
            'isMedical'
          ]
        }
      }
    },
    'pw-sftp-aus-mecft': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: null,
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'BI_MTR_NBR',
            accountNumber: 'BI_ACCT',
            mapNumber: 'BI_SRV_MAP_LOC',
            customerName: 'BI_SORT_NAME',
            street: 'BI_ADDR1',
            street2: 'BI_ADDR2',
            street3: 'BI_ADDR3',
            homePhoneNumber: 'BI_HOME_PHN',
            latitude: 'BI_Y_COORD',
            longitude: 'BI_X_COORD',
            billingCycleCode: 'BI_CYC_CD',
            substationCode: 'BI_SUB',
            routeCode: 'BI_ROUTE_CD',
            bookCode: 'BI_BOOK_CD',
            circuitCode: 'BI_FDR'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'latitude',
            'longitude',
            'billingCycleCode',
            'substationCode',
            'routeCode',
            'bookCode',
            'circuitCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            oldMeterNumber: 'BI_MTR_NBR',
            serviceType: 'BI_SRV_TYP',
            meterType: 'BI_MTR_TYP',
            oldMeterKwhLastReading: 'BI_LAST_VALID_RDG',
            meterStatus: 'BI_MTR_STAT_CD',
            meterFormFactor: 'BI_AMR_MOD_TYPE',
            isMedical: 'Medical',
            meterReadNotes: 'meterReadNotes',
            billingMultiplier: 'billingMultiplier'
          },
          canUpdateOnSync: [
            'serviceType',
            'meterType',
            'oldMeterKwhLastReading',
            'meterStatus',
            'meterFormFactor',
            'isMedical',
            'meterReadNotes',
            'billingMultiplier'
          ]
        }
      }
    },
    'pw-sftp-aus-mpu': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: new MPUWorkOrderReportBuilder('pw-sftp-aus-mpu'),
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'Old_Meter_Number',
            accountNumber: 'Account',
            customerName: 'Customer',
            street: 'Address',
            city: 'City',
            stateCode: 'State',
            zipCode: 'Zip',
            latitude: 'Old_Latitude',
            longitude: 'Old_Longitude',
            routeCode: 'Route',
            substationCode: 'SubArea',
            circuitCode: 'Circuit_Number',
            billingCycleCode: 'Billing_Cycle'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'substationCode',
            'circuitCode',
            'routeCode',
            'billingCycleCode',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'latitude',
            'longitude'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['Meter_Form'] !== null && csvDataRow['Meter_Form'] !== undefined && csvDataRow['Meter_Form']) {
              if (csvDataRow['Install Meter Type'] !== null && csvDataRow['Install Meter Type'] !== undefined && csvDataRow['Install Meter Type']) {
                workOrder.meterFormFactor = `${csvDataRow['Meter_Form']} | ${csvDataRow['Install Meter Type']}`;
              }
            }
            const csvMeterReadNotes = csvDataRow['Read_Notes'];
            const csvRouteCode = csvDataRow['Route'];
            if (csvMeterReadNotes && csvMeterReadNotes !== null && csvMeterReadNotes !== undefined && csvMeterReadNotes.length > 0) {
              if (csvRouteCode && csvRouteCode !== null && csvRouteCode !== undefined) {
                workOrder['meterReadNotes'] = `Route ${csvRouteCode} | ${csvMeterReadNotes}`;
              }
            }
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'Old_Meter_Number',
            oldMeterKwhLastReading: 'Last_kWh_Reading',
            meterStatus: 'Service_status',
            serviceType: 'Meter_Type',
            meterClass: 'Meter_Class',
            meterVoltage: 'Meter_Volt',
            meterFormFactor: 'Meter_Form',
            meterReadNotes: 'Read_Notes',
            meterType: 'Service_Type',
            billingMultiplier: 'billingMultiplier',
            ReadSequence: 'Read_Sequence',
            needsOpenDisconnectSwitch: 'Needs_open_SD'
          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'meterStatus',
            'meterFormFactor',
            'meterReadNotes',
            'needsOpenDisconnectSwitch',
            'serviceType',
            'meterClass',
            'meterVoltage',
            'billingMultiplier',
          ]
        }
      }
    },
    'pw-sftp-aus-wrea': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: new WREAWorkOrderReportBuilder('pw-sftp-aus-wrea'),
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            workOrder['homePhoneNumber'] = `${csvDataRow['BI_HOME_AREA_CD'] || ''}${csvDataRow['BI_HOME_AREA_CD'] && csvDataRow['BI_HOME_PHN'] ? '-' : ''}${csvDataRow['BI_HOME_PHN'] || ''}`;
            return workOrder;
          },
          columnMappings: {
            workOrderNumber: 'BI_MTR_NBR',
            accountNumber: 'BI_ACCT',
            mapNumber: 'BI_SRV_MAP_LOC',
            customerName: 'BI_SORT_NAME',
            billingCycleCode: 'BI_CYC_CD',
            street: 'BI_ADDR1',
            street2: 'BI_ADDR2',
            street3: 'BI_ADDR3',
            latitude: 'BI_Y_COORD',
            longitude: 'BI_X_COORD',
            substationCode: 'BI_SUB',
            routeCode: 'BI_ROUTE_CD',
            bookCode: 'BI_BOOK_CD',
            circuitCode: 'BI_FDR'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'billingCycleCode',
            'homePhoneNumber',
            'latitude',
            'longitude',
            'substationCode',
            'routeCode',
            'bookCode',
            'circuitCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            // homePhoneNumber does not exsist in .csv file so we need to create it like we did in WORKORDER_TABLE_NAME column data mapping
            const homePhoneNumber = `${csvDataRow['BI_HOME_AREA_CD'] || ''}${csvDataRow['BI_HOME_AREA_CD'] && csvDataRow['BI_HOME_PHN'] ? '-' : ''}${csvDataRow['BI_HOME_PHN'] || ''}`;
            workOrder['meterReadNotes'] = `${homePhoneNumber || ''}${homePhoneNumber && csvDataRow['BI_SORT_NAME'] ? ' | ' : ''}${csvDataRow['BI_SORT_NAME'] || ''}`;
            workOrder['serviceType'] = csvDataRow['BI_MULTIPLI'];
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'BI_MTR_NBR',
            meterType: 'KWH',
            oldMeterKwhLastReading: 'BI_LAST_VALID_RDG',
            meterStatus: 'BI_MTR_STAT_CD',
            meterFormFactor: 'BI_AMR_MOD_TYPE',
            isMedical: 'Medical',
            meterReadNotes: 'READ_NOTE',
            billingMultiplier: 'BI_MULTIPLI',
            serviceDescription: 'ServiceDescription'
          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'meterStatus',
            'meterFormFactor',
            'isMedical',
            'meterReadNotes',
            'billingMultiplier',
            'serviceType',
            'serviceDescription'
          ]
        }
      }
    },
    'pw-sftp-aus-rlec': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: new RLECWorkOrderReportBuilder('pw-sftp-aus-rlec'),
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'meterno',
            customerName: 'name',
            accountNumber: 'account',
            substationCode: 'sub',
            circuitCode: 'feeder',
            longitude: 'x',
            latitude: 'y',
            locationId: 'handle',
            homePhoneNumber: 'phone',
            street: 'address',
            routeCode: 'Tag'
          },
          canUpdateOnSync: [
            'customerName',
            'accountNumber',
            'substationCode',
            'circuitCode',
            'homePhoneNumber',
            'routeCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            workOrder['meterReadNotes'] = `${csvDataRow['phone'] || ''}${csvDataRow['phone'] && csvDataRow['name'] ? ' | ' : ''}${csvDataRow['name'] || ''}`;
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'meterno',
            billingMultiplier: 'metermult',
            meterFormFactor: 'meterform',
            oldMeterKwhLastReading: 'mtmainkwh',
            meterStatus: 'metertype'
          },
          canUpdateOnSync: [
            'billingMultiplier',
            'meterFormFactor',
            'oldMeterKwhLastReading',
            'meterStatus',
            'meterReadNotes'
          ]
        }
      }
    },
    'pw-sftp-aus-acec': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: new ACECWorkOrderReportBuilder('pw-sftp-aus-acec'),
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'Meter#',
            accountNumber: 'Acct#',
            customerName: 'Name',
            homePhoneNumber: 'Phone #',
            street: 'Address',
            city: 'City',
            stateCode: 'State',
            substationCode: 'Sub',
            circuitCode: 'Fee',
            billingCycleCode: 'Cycle',
            routeCode: 'Route',
            longitude: 'X_COORD',
            latitude: 'Y_COORD',
            mapNumber: 'wmElementN',
            bookCode: 'Book'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'substationCode',
            'billingCycleCode',
            'routeCode',
            'circuitCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            oldMeterNumber: 'Meter#',
            oldMeterKwhLastReading: 'Last RDG',
            meterFormFactor: 'Form #',
            meterStatus: 'Status',
            billingMultiplier: 'Multipli'
          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'meterFormFactor',
            'meterStatus',
            'billingMultiplier'
          ]
        }
      }
    },
    'pw-sftp-aus-scpc': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: new SCPCWorkOrderReportBuilder('pw-sftp-aus-scpc'),
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            workOrderNumber: 'OldMeterNumber',
            accountNumber: 'AccountNumber',
            latitude: 'Latitude',
            longitude: 'Longitude',
            mapNumber: 'MapNumber',
            substationCode: 'SubArea',
            billingCycleCode: 'BillingCycle',
            routeCode: 'RouteName',
            customerName: 'CustomerName',
            street: 'Street',
            locationId: 'LocationId',
            city: 'City',
            stateCode: 'StateCode',
            zipCode: 'Zip',
            homePhoneNumber: 'Phone',
            districtCode: 'District',
            circuitCode: 'Fdr'
          },
          canUpdateOnSync: [
            'substationCode',
            'districtCode',
            'billingCycleCode',
            'routeCode',
            'customerName',
            'homePhoneNumber',
            'accountNumber'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            workOrder.needsOpenDisconnectSwitch = csvDataRow['NeedDisconnect'] === 'YES';
            workOrder.isMedical = csvDataRow['IsMedical'] === 'YES';
            return workOrder;
          },
          columnMappings: {
            oldMeterNumber: 'OldMeterNumber',
            meterType: 'MeterType',
            oldMeterKwhLastReading: 'Reading',
            meterStatus: 'MeterStatus',
            meterReadNotes: 'ReadNotes',
            isMedical: 'IsMedical',
            needsOpenDisconnectSwitch: 'NeedDisconnect',
            meterFormFactor: 'FormFactor'
          },
          canUpdateOnSync: [
            'needsOpenDisconnectSwitch',
            'meterStatus',
            'meterReadNotes',
            'isMedical',
            'meterFormFactor'
          ]
        }
      }
    },
    'pw-sftp-aus-joemc': {
      getWorkOrderId: getWorkOrderIdByLocationId,
      reportsBuilder: new JOEMCWorkOrderReportBuilder('pw-sftp-aus-joemc'),
      primaryKey: 'locationId',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['Demand Meter'] === 'Y') {
              workOrder.workOrderNumber = `${workOrder.workOrderNumber} | Demand`;
            }
            return workOrder;
          },
          columnMappings: {
            // WorkOrder table
            // id - uuid
            // projectId - fetch this information from db
            accountNumber: 'Account Number',
            customerName: 'Account Name',
            homePhoneNumber: 'Home Phone',
            street: 'Service Address w Unit',
            city: 'Service City',
            stateCode: 'Service State',
            zipCode: 'Service Zip',
            locationId: 'Location Id',
            longitude: 'GPS State Plane X',
            latitude: 'GPS State Plane Y',
            mobilePhoneNumber: 'Cell Phone',
            businessPhoneNumber: 'Work Phone',
            billingCycleCode: 'Billing Cycle',
            routeCode: 'Meter Reading Route',
            circuitCode: 'Feeder',
            workOrderNumber: 'Meter Number'
          },
          canUpdateOnSync: [
            'accountNumber',
            'customerName',
            'homePhoneNumber',
            'mobilePhoneNumber',
            'businessPhoneNumber',
            'billingCycleCode',
            'street',
            'city',
            'stateCode',
            'zipCode',
            'routeCode',
            'longitude',
            'latitude',
            'circuitCode'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: (workOrder, csvDataRow) => {
            if (csvDataRow['ERT Id']) {
              workOrder.meterReadNotes = `${csvDataRow['ERT Id']} | ${workOrder.meterReadNotes}`;
            }
            return workOrder;
          },
          columnMappings: {
            // WorkOrderMeterDeploy table
            // workOrderId
            // meterDeployId - uuid
            meterStatus: 'Account Status',
            oldMeterNumber: 'Meter Number',
            meterReadNotes: 'Meter Reading Notes',
            oldMeterKwhLastReading: 'Last KWH Reading',
            oldMeterKwLastReading: 'Last KW Reading',
            serviceDescription: 'Service Note',
            serviceType: 'Account Class',
            ReadSequence: 'Meter Reading Sequence',
            meterFormFactor: 'Meter Form',
            meterClass: 'Meter Class',
            meterVoltage: 'Meter Volts',
            isMedical: 'Medical Alert Account',
            billingMultiplier: 'Multiplier'
          },
          canUpdateOnSync: [
            'meterStatus',
            'serviceDescription',
            'oldMeterNumber',
            'meterReadNotes',
            'oldMeterKwhLastReading',
            'oldMeterKwLastReading',
            'isMedical',
            'serviceType',
            'ReadSequence',
            'billingMultiplier',
            'meterFormFactor',
            'meterClass',
            'meterVoltage'
          ]
        }
      }
    },
    'pw-sftp-aus-cwp': {
      getWorkOrderId: getWorkOrderIdByOldMeterNumber,
      reportsBuilder: new CWPWorkOrderReportBuilder('pw-sftp-aus-cwp'),
      primaryKey: 'oldMeterNumber',
      tables: {
        [WORKORDER_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            // WorkOrder table
            // id - uuid
            // projectId - fetch this information from db
            workOrderNumber: 'OldMeterNumber',
            latitude: 'Latitude',
            longitude: 'Longitude',
            routeCode: 'RouteName',
            street: 'Street',
            city: 'City',
            locationId: 'LocationId',
            stateCode: 'StateCode',
            zipCode: 'Zip',
            accountNumber: 'AccountNumber',
            substationCode: 'SubareaName',
            billingCycleCode: 'BillingCycle',
            customerName: 'CustomerName',
            homePhoneNumber: 'Phone',
            mapNumber: 'MapNumber'
          },
          canUpdateOnSync: [
            'accountNumber',
            'substationCode',
            'billingCycleCode',
            'routeCode',
            'customerName',
            'homePhoneNumber'
          ]
        },
        [WORKORDER_METER_DEPLOY_TABLE_NAME]: {
          tableSpecialColumnsHandler: null,
          columnMappings: {
            // WorkOrderMeterDeploy table
            // workOrderId
            // meterDeployId - uuid
            oldMeterNumber: 'OldMeterNumber',
            oldMeterKwhLastReading: 'Reading',
            meterType: 'MeterType',
            meterStatus: 'MeterStatus',
            meterReadNotes: 'ReadNotes',
            isMedical: 'IsMedical'
          },
          canUpdateOnSync: [
            'oldMeterKwhLastReading',
            'oldMeterNumber',
            'meterReadNotes',
            'meterStatus'
          ]
        }
      }
    }
  }
}
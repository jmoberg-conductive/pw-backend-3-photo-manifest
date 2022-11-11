const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const { createCsv } = require('../csv-builder');

class WorkOrderReport {
  constructor(s3BucketName, shortCode) {
    this.data = [];
    this.template = null;
    this.filename = '';
    this.shortCode = shortCode;
    this.s3BucketName = s3BucketName;
    this.s3Key = 'Data To Utility';
    // Override this only if you dont need report header (csv-builder displays header by default)
    this.displayReportHeader = undefined;
  }

  format(workOrder) {
    const result = {};
    Object.keys(this.template).forEach(columnName => {
      const newColumnName = this.template[columnName];
      if (this.requireNewDateFormat(columnName)) {
        result[newColumnName] = this.formatDate(workOrder[columnName], newColumnName);
      } else {
        result[newColumnName] = workOrder[columnName] === null ? '' : workOrder[columnName];
      }
    });
    return result;
  }

  add(workOrder) {
    this.data.push(this.format(workOrder));
  }

  formatDate(date) {
    if (date) {
      let month = date.getUTCMonth() + 1;
      let year = date.getUTCFullYear();
      let day = date.getUTCDate();
      day = day < 10 ? `0${day}` : day;
      month = month < 10 ? `0${month}` : month;
      return `${month}/${day}/${year}`;
    }
    return '';
  }

  getDate() {
    let date = new Date();
    date = new Date(date.setDate(date.getDate() - 1));
    let month = date.getUTCMonth() + 1;
    let year = date.getUTCFullYear();
    let day = date.getUTCDate();
    day = day < 10 ? `0${day}` : day;
    month = month < 10 ? `0${month}` : month;
    return `${year}${month}${day}`;
  }

  requireNewDateFormat(columnName) {
    return columnName === 'newMeterReadingDate' || columnName === 'meterReadingDate' || columnName === 'workOrderLastVisitDate' || columnName === 'Swap Time';
  }

  async createCsv(delimiter, record_delimiter) {
    let csvData = [];
    const csvColumns = Object.values(this.template)
    this.data.forEach(dataItem => {
      let row = [];
      csvColumns.forEach(columnName => dataItem[columnName] === '[]' ? row.push('') : row.push(dataItem[columnName]));
      csvData.push(row);
    });
    const csv = await createCsv(csvColumns, csvData, this.displayReportHeader, delimiter, record_delimiter);
    this.data = [];
    return csv;
  }

  async upload() {
    const csv = await this.createCsv();
    const params = {
      Body: Buffer.from(csv, 'binary'),
      Bucket: this.s3BucketName,
      Key: `${this.s3Key}/${this.getDate()}_${this.filename}`
    };
    console.log(`New file will be uploaded in bucket ${params.Bucket}/${params.Key}`);
    const response = await S3.putObject(params).promise();
    console.log(`Uploading has been finished with response:\n${JSON.stringify(response)}`);
  }
}

module.exports = WorkOrderReport;
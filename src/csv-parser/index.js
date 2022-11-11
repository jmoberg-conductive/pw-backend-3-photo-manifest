const AWS = require('aws-sdk');
const CSV = require('csv-parser');
const STRIPBOM = require('strip-bom-stream');

const S3 = new AWS.S3();

const parseCSV = ({ bucket, filename }) => {
  const rows = [];
  return new Promise((resolve, reject) => {
    S3.getObject({ Bucket: bucket, Key: filename })
      .createReadStream()
      .pipe(STRIPBOM())
      .pipe(CSV())
      .on('data', data => rows.push(data))
      .on('end', () => resolve(rows));
  });
};

module.exports = {
  parseCSV
}
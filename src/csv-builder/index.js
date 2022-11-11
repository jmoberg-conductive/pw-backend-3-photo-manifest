const csvStringify = require('csv-stringify');

const createCsv = (columns, data, displayHeader = true, delimiter = ',', record_delimiter= 'unix') => {
  return new Promise((resolve, reject) => {
    csvStringify(data, { header: displayHeader, columns, delimiter, record_delimiter }, (err, output) => {
      if (err) {
        console.log(err);
        reject();
      }
      resolve(output);
    });
  });
}

module.exports = {
  createCsv
}
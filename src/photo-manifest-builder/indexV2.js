const xmlBuilder = require('xmlbuilder');

const build = (workOrders, recordDelimiter) => {
  const nodeList = xmlBuilder.create('nodeList').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance').att('xmlns:xsd', 'http://www.w3.org/2001/XMLSchema');
  for (let workOrder of workOrders) {
    nodeList
      .root()
      .ele('node')
      .ele('path').txt('/root/Non iVUE/Meter-Imports')
      .up()
      .ele('attributes')

      .ele('attribute')
      .ele('key').txt('biMtrNbr')
      .up()
      .ele('value').txt(workOrder.newMeterAssetNumber || '')
      .up()
      .ele('logicalType').txt('STRING')
      .up()
      .up()

      .ele('attribute')
      .ele('key').txt('biAcct')
      .up()
      .ele('value').txt(workOrder.accountNumber || '')
      .up()
      .ele('logicalType').txt('STRING')
      .up()
      .up()

      .ele('attribute')
      .ele('key').txt('biSrvLocNbr')
      .up()
      .ele('value').txt(workOrder.recordLocator || '')
      .up()
      .ele('logicalType').txt('STRING')
      .up()
      .up()

      .ele('attribute')
      .ele('key').txt('biOldMtrNbr')
      .up()
      .ele('value').txt(workOrder.oldMeterNumber || '')
      .up()
      .ele('logicalType').txt('STRING')
      .up()
      .up()
      .up()

      .ele('content')
      .ele('fileName').txt(workOrder.name || '')

      .up()
      .up()
  }
  const options = { pretty: true };
  if (recordDelimiter === 'windows') {
    options.newline = '\r\n';
  }
  return nodeList.end(options);
}

module.exports = {
  build
}
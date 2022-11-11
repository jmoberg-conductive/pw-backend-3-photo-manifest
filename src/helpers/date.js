const { DATE_FORMATS } = require('./date.types');

const DATE_FORMAT_HANDLER_MAPPING = {
  [DATE_FORMATS['yyyyMMdd']]: (day, month, year) => `${year}${month}${day}`,
  [DATE_FORMATS['yyyy-MM-dd']]: (day, month, year) => `${year}-${month}-${day}`
};

const getTodaysDate = (dateFormat) => {
  try {
    const format = DATE_FORMAT_HANDLER_MAPPING[dateFormat];
    if (!format) throw 'Unsupporetd date format';
    const date = new Date();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let day = date.getDate();
    day = day < 10 ? `0${day}` : day;
    month = month < 10 ? `0${month}` : month;
    return format(day, month, year);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  DATE_FORMATS,
  getTodaysDate,
  DATE_FORMAT_HANDLER_MAPPING
}
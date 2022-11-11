const { UTC_DATE_FORMATS } = require('./utcDate.types');

const DATE_FORMAT_UTC_HANDLER_MAPPING = {
  [UTC_DATE_FORMATS['MM/dd/YYYY']]: (day, month, year) => `${month}/${day}/${year}`,
  [UTC_DATE_FORMATS['MM/dd/YYYY hh:mm:ss AM/PM']]: (day, month, year, hours, minutes, seconds) => {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds} ${ampm}`;
  },
  [UTC_DATE_FORMATS['yyyyMMdd']]: (day, month, year) => `${year}${month}${day}`
};

const formatUTCDate = (date, dateFormat) => {
  try {
    if (!date) throw 'Date is not provided';
    const format = DATE_FORMAT_UTC_HANDLER_MAPPING[dateFormat];
    if (!format) throw 'Unsupporetd utc date format';
    if (typeof(date) === 'object') {
      let month = date.getUTCMonth() + 1;
      let year = date.getUTCFullYear();
      let day = date.getUTCDate();
      let hours = date.getHours();
      let minutes = date.getMinutes();
      let seconds = date.getSeconds();
      day = day < 10 ? `0${day}` : day;
      month = month < 10 ? `0${month}` : month;
      minutes = minutes < 10 ? '0'+minutes : minutes;
      seconds = seconds < 10 ? '0'+seconds : seconds;
      return format(day, month, year, hours, minutes, seconds);
    }
    return '';
  } catch (error) {
    throw error;
  }  
}

module.exports = {
  UTC_DATE_FORMATS,
  formatUTCDate,
  DATE_FORMAT_UTC_HANDLER_MAPPING
}
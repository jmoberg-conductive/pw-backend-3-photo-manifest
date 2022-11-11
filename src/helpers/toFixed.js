const toFixed = (value, digits) => {
  if (!value) {
    return '';
  }
  let result = value.toString().split('.'); // 123.111111
  if (result.length === 2 && result[1].length > digits) { // ['123', '111111']
    return +`${result[0]}.${result[1].split('').slice(0, digits).join('')}`;
  }
  return value;
}

module.exports = {
  toFixed
}
// Example
// Input: value = 7.3
// Result should be: 7.300
const pushZero = (value, resultLength) => {
  const valueLength = value.length;
  if (valueLength <= resultLength) {
    value = value.split('');
    for (let i = 0; i <= resultLength - valueLength; i++) {
      value.push('0');
    }
    value = value.join('');
  }
  return value;
}

module.exports = {
  pushZero
}
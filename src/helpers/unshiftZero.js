// Example
// Input: value = 7.300, resultLength = 13
// Result should be: 000000007.330
const unshiftZero = (value, resultLength) => {
  if (value) {
    if (typeof value !== 'string') {
      value = JSON.stringify(value);
    }
    const valueLength = value.length;
    if (valueLength < resultLength) {
      const missingZerosCount = resultLength - valueLength;
      value = value.split('');
      for (let i = 0; i < missingZerosCount; i++) {
        value.unshift('0');
      }
      value = value.join('');
    }
    return value;
  }
  return new Array(resultLength).fill(0).join('');
}

module.exports = {
  unshiftZero
}
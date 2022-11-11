// 123.222 return 123
const truncate = (value) => {
  if (!value) {
    return '';
  }
  return +value.toString().split('.')[0];
}

module.exports = {
  truncate
}
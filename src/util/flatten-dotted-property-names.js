export default (values) => {
  values = Array.prototype.concat.apply([], values.map((value) => {
    if (value.indexOf('.') !== -1) {
      let split = value.split('.');
      return split.filter((value) => {
        return values.indexOf(value) === -1;
      });
    } else {
      return value;
    }
  }));

  return values;
}
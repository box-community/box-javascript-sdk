export default (values) => {
  return Object.keys(values).map((key) => {
    return values[key];
  });
}
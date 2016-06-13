export default (options, values) => {
  values = values || [];
  if (values.length === 0) {
    return {};
  }
  options.body = options.body || {};
  Object.keys(options).map((key) => {
    if (values.indexOf(key) !== -1) {
      if (key !== 'body') {
        options.body[key] = options[key];
        delete options[key];
      }
    }
  });
  return options.body;
}
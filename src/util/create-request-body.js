export default (options, values, ignoreModelValues) => {
  ignoreModelValues = ignoreModelValues || false;
  values = values || [];

  if (ignoreModelValues) {
    Object.keys(options).map((key) => {
      if (key !== 'body') {
        options.body[key] = options[key];
        delete options[key];
      }
    });
    return options.body;
  }

  if (values.length === 0 && ignoreModelValues === false) {
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
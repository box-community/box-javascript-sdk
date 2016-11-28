export default (item, values) => {
  values = values || [];
  if (values.length === 0) {
    return;
  }
  let temp = item;
  values.map((requiredValue) => {
    if (requiredValue.indexOf('.') !== -1) {
      let requiredValues = requiredValue.split('.');
      for (let i = 0, l = requiredValues.length; i < l; i++) {
        let prop = requiredValues[i];
        if (temp.hasOwnProperty(prop)) {
          temp = temp[prop];
        }
      }
      if (!temp) { throw new Error(`A(n) ${requiredValue} field is required for this API call`) };
    } else if (!item[requiredValue]) {
      throw new Error(`A(n) ${requiredValue} field is required for this API call`);
    }
  });
};
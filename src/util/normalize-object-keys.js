'use strict';
export default function NormalizeObjectKeys(options, values) {
  values = values || [];

  Object.keys(options).map((key) => {
    if (values.indexOf(key) !== -1) {
      return;
    }
    if (typeof options[key] === 'object') {
      NormalizeObjectKeys(options[key], values);
    }

    let splitCamel = key.split(/(?=[A-Z])/g);

    if (splitCamel.length > 1) {
      let regroup = [];
      for (var i = 1; i < splitCamel.length; i++) {
        regroup.push(splitCamel[i].toLowerCase());
      }
      if (splitCamel.length > 0) { regroup.unshift(splitCamel[0]); }
      let newKey = regroup.join('_');

      if (values.indexOf(newKey) !== -1) {

        options[newKey] = options[key];
        delete options[key];
      }
    }
  });
}
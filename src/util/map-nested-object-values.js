export default function MapNestedValues(values) {
  return Array.prototype.concat.apply([], Object.keys(values).map((key) => {
    if (typeof values[key] === 'object') {
      return MapNestedValues(values[key]);
    }
    return values[key];
  }));
}
// Remove objects duplicates from the array
export const uniqueObjectsList = arrayOfObjects => arrayOfObjects
  .map(o => JSON.stringify(o))
  .filter((o, index, array) => array.indexOf(o) === index)
  .map(o => JSON.parse(o));

export const flatOneDepth = array => array.reduce((a, v) => a.concat(v), []);

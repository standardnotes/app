export const concatenateUint8Arrays = (arrays: Uint8Array[]) => {
  const totalLength = arrays
    .map((array) => array.length)
    .reduce((prev, next) => prev + next, 0);

  const concatenatedArray = new Uint8Array(totalLength);
  let offset = 0;
  arrays.forEach((array) => {
    concatenatedArray.set(array, offset);
    offset += array.length;
  });

  return concatenatedArray;
};

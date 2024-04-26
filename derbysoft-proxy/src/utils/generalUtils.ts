import { getLogger } from "@simardwt/winding-tree-utils";

export type AsyncFunctionCb<T> = (item: T) => Promise<unknown>;

export async function throttlePromises<T>(
  items: unknown[],
  asyncFunction: AsyncFunctionCb<T>,
  throttleDelayInMs = 500, // time to wait before running next iteration
  logging = true,
  itemsPerIteration = 5, // no. of concurrent processes to run in each iteration
  chunksPerItem = 1, // no. of items in each process,
  allSettled = false
): Promise<unknown[]> {
  // get expected number of iterations
  const numberOfIterations = Math.ceil(items.length / (itemsPerIteration * chunksPerItem));

  const log = getLogger(__filename);

  // initialize return array
  const itemsPromise: Promise<unknown>[] = [];

  const processedItemsPromises = new Promise<Promise<unknown>[]>((resolve, reject) => {
    try {
      for (let i = 0; i < numberOfIterations; i++) {
        // get a slice of the items to be used in this iteration
        const startIndex = i * itemsPerIteration * chunksPerItem;
        const endIndex =
          startIndex + itemsPerIteration * chunksPerItem < items.length
            ? startIndex + itemsPerIteration * chunksPerItem
            : items.length;

        let itemsSlice: unknown[];
        if (chunksPerItem > 1) {
          // split item slice into array of chunks
          let j = startIndex;
          itemsSlice = [];
          while (j < endIndex) {
            itemsSlice.push(items.slice(j, j + chunksPerItem));
            j = j + chunksPerItem;
          }
        } else {
          itemsSlice = items.slice(startIndex, endIndex);
        }

        setTimeout(() => {
          const itemsPromiseSlice = itemsSlice.map((val) => asyncFunction(val as T));

          if (logging) {
            log.info(`Processing items (${startIndex + 1} to ${endIndex} of ${items.length})`);
          }

          // append slice of promises to return array
          itemsPromise.push(...itemsPromiseSlice);

          // if this is the last iteration, resolve promise to itemsPromise
          if (i === numberOfIterations - 1) {
            resolve(itemsPromise);
          }
        }, throttleDelayInMs * i);
      }
    } catch (error) {
      reject((error as Error).message);
    }
  });

  const result = await processedItemsPromises;
  let resolved;
  if (allSettled) {
    resolved = Promise.allSettled(result);
  } else {
    resolved = Promise.all(result);
  }

  return resolved;
}

export const isObject = (variable: unknown) => {
  return typeof variable === "object" && !Array.isArray(variable) && variable !== null;
};

// export const roundTo = (value: number, decimalPlaces = 2): number => {
//   return (
//     Math.round(value * (10 ^ decimalPlaces) + Number.EPSILON) /
//     (10 ^ decimalPlaces)
//   );
// };

export const strToInt = (value: string | undefined, defaultint = undefined) => {
  if (value === undefined) return defaultint;
  const int = parseInt(value, 10);
  return isNaN(int) ? undefined : int;
};

export function coerceArray<T>(value: T[] | T | undefined): T[] | undefined {
  if (Array.isArray(value)) {
    return value;
  } else if (value) {
    return [value];
  } else {
    return undefined;
  }
}

export function IsValidEnumValue<T>(value: unknown, enumType: T): boolean {
  return Object.values(enumType).includes(value as T);
}

export function IsValidEnumKey<T>(key: string, enumType: T, caseInsensitive = true): boolean {
  if (caseInsensitive) {
    return Object.keys(enumType).some(
      (enumKey) => (enumKey as string).toLowerCase() === (key as string).toLowerCase()
    );
  }
  return Object.keys(enumType).includes(key);
}

export const waitFor = async (delayInMs = 1000): Promise<boolean> => {
  const promise = new Promise<boolean>((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, delayInMs);
  });

  return promise;
};

export const isValidDate = (dateString) => {
  return !isNaN(Date.parse(dateString));
};

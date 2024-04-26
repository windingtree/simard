import { isObject } from "./generalUtils";

export function mapToObj(inputMap: Map<string, unknown>, maxDepth = 10, depth = 0): unknown {
  const obj = {};
  try {
    // prevent stack overflow
    if (depth >= maxDepth) return;

    // handle input maps
    if (inputMap instanceof Map) {
      inputMap.forEach((value, key) => {
        // check if value is a map
        if (value instanceof Map) {
          value = mapToObj(value, maxDepth, depth + 1);
        }

        // check if value is an object
        else if (isObject(value)) {
          // iterate all fields and convert maps to object
          Object.entries(value).forEach(([key, objValue]) => {
            if (objValue instanceof Map) {
              const newValue = mapToObj(objValue, maxDepth, depth + 1);
              value[key] = newValue;
            }
          });
        }

        obj[key] = value;
      });
    }
    // tslint:disable-next-line:no-empty
  } catch (err: unknown) {
    // do nothing
  }
  return obj;
}

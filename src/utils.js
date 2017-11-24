function peek(obj, selectorString) {

  let props = selectorString.split('.'),
      final = props.pop(),
      p;

  while (p = props.shift()) {
    if (typeof obj[p] === 'undefined')
      return undefined;
    obj = obj[p]
  }

  return obj[final];
}

export function lookup(obj, selector, modelName) {
  if (typeof selector === 'string') {
    if (modelName)
      selector = `${modelName}.${selector}`;
    return peek(obj, selector);
  }
  else if (typeof selector === 'function') {
    if (modelName)
      obj = obj[modelName];

    try {
      return selector(obj);
    }
    catch(e) {
      return undefined;
    }
  }
}

export function isFunction(x) {
  return x instanceof Function;
}

export function isObject(x) {
  return x !== null && typeof x === 'object';
}

export function objectHasKeys(x) {
  return isObject(x) && Object.keys(x).length > 0;
}
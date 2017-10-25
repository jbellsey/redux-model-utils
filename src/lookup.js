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

export default function lookup(obj, selector, modelName) {
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

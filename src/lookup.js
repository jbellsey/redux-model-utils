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

export default function lookup(obj, selector) {
  if (typeof selector === 'string')
    return peek(obj, selector);
  else if (typeof selector === 'function')
    return selector(obj);
}

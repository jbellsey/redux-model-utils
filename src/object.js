var deepAssign = require('deep-assign');

/*
    two ways to use:
    READ ("peek"):  _deepPeekAndPoke(obj, "dot.notation.string")
    WRITE ("poke"): _deepPeekAndPoke(obj, "dot.notation.string", newValue)

    note: the WRITE signature is NOT PURE. it modifies {obj} in place.
    you should use the ASSIGN alias for writing, or even better, copyAndAssign
    for purity.
*/

function _deepPeekAndPoke(obj, selectorString, val) {

    let props = selectorString.split('.'),
        final = props.pop(),
        p;

    while (p = props.shift()) {
        if (typeof obj[p] === 'undefined')
            return undefined;
        obj = obj[p]
    }

    // peek:
    if (typeof val === 'undefined')
        return obj[final];

    // poke:
    obj[final] = val;   // no return value when used as a setter
}

function lookup(obj, selector) {
    if (typeof selector === 'string')
        return _deepPeekAndPoke(obj, selector);
    else if (typeof selector === 'function')
        return selector(obj);
}

// use this signature when writing.
// it's destructive though; see below
//
function assign(obj, selectorString, val) {
    _deepPeekAndPoke(obj, selectorString, val);
    return obj;
}

// non-destructive (pure) version of assign
//
function copyAndAssign(obj, selectorString, val) {
    let result = deepAssign({}, obj);       // makes with a full, deep copy of the source object
    if (typeof selectorString === 'function')
        throw new Error('redux-utils: copyAndAssign does not accept a function selector; strings only');
    assign(result, selectorString, val);
    return result;
}

module.exports = {

    // alias to deepAssign, but you don't need to pass in an empty object
    copy:           (...args) => deepAssign({}, ...args),

    // accepts an selector string or function
    lookup,         // (obj, selector) => value

    // signature of these methods is the same:
    //      assign(obj, selectorString, newValue)
    //
    copyAndAssign,  // pure, non-destructive
    assign          // destructive
};
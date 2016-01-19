var clone      = require('clone'),
    deepAssign = require('deep-assign');

/*
    two ways to use:
    READ ("peek"):  deepPeekAndPoke(obj, "dot.notation.string")
    WRITE ("poke"): deepPeekAndPoke(obj, "dot.notation.string", newValue)

    note: the WRITE signature is NOT PURE. it modifies {obj} in place.
    you should use the ASSIGN tool for writing, or even better, cloneAndAssign
    for purity.
*/

function deepPeekAndPoke(obj, selectorString, val) {

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
        return deepPeekAndPoke(obj, selector);
    else if (typeof selector === 'function')
        return selector(obj);
}

// use this signature when writing.
// it's destructive though; see below
//
function assign(obj, selectorString, val) {
    deepPeekAndPoke(obj, selectorString, val);
    return obj;
}

// non-destructive (pure) version of assign
//
function cloneAndAssign(obj, selectorString, val) {
    let result = clone(obj);       // makes with a full, deep copy of the source object
    if (typeof selectorString === 'function')
        throw new Error('redux-model-utils: cloneAndAssign does not accept a function selector; strings only');
    assign(result, selectorString, val);
    return result;
}

module.exports = {

    // one input object only
    clone,

    // first input is for duping; other inputs get assigned
    cloneAndMerge:   (source, ...merges) => deepAssign(clone(source), ...merges),

    // accepts an selector string or function
    lookup,         // (obj, selector) => value

    // signature of these two methods is the same:
    //      assign(obj, selectorString, newValue)
    //
    cloneAndAssign,  // pure, non-destructive
    assign           // destructive. DRAGONS!
};
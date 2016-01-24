'use strict';

var clone = require('clone'),
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

    var props = selectorString.split('.'),
        final = props.pop(),
        p;

    while (p = props.shift()) {
        if (typeof obj[p] === 'undefined') return undefined;
        obj = obj[p];
    }

    // peek:
    if (typeof val === 'undefined') return obj[final];

    // poke:
    obj[final] = val; // no return value when used as a setter
}

function lookup(obj, selector) {
    if (typeof selector === 'string') return deepPeekAndPoke(obj, selector);else if (typeof selector === 'function') return selector(obj);
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
    var result = clone(obj); // makes with a full, deep copy of the source object
    if (typeof selectorString === 'function') throw new Error('redux-model-utils: cloneAndAssign does not accept a function selector; strings only');
    assign(result, selectorString, val);
    return result;
}

module.exports = {

    // one input object only
    clone: clone,

    // first input is for duping; other inputs get assigned
    cloneAndMerge: function cloneAndMerge(source) {
        for (var _len = arguments.length, merges = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            merges[_key - 1] = arguments[_key];
        }

        return deepAssign.apply(undefined, [clone(source)].concat(merges));
    },

    // accepts an selector string or function
    lookup: lookup, // (obj, selector) => value

    // signature of these two methods is the same:
    //      assign(obj, selectorString, newValue)
    //
    cloneAndAssign: cloneAndAssign, // pure, non-destructive
    assign: assign // destructive. DRAGONS!
};
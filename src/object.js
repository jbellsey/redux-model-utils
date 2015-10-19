var deepAssign = require('deep-assign');

/*
    two ways to use:
    READ ("peek"):  _deepPeekAndPoke(obj, "dot.notation.string")
    WRITE ("poke"): _deepPeekAndPoke(obj, "dot.notation.string", newValue)

    note: the WRITE signature is NOT PURE. it modifies {obj} in place.
    you should use the ASSIGN alias for writing, or even better, copyAndAssign
    for purity.
*/

function _deepPeekAndPoke(obj, accessorString, val) {

    let props = accessorString.split('.'),
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

// use this signature when writing.
// it's destructive though; see below
//
function assign(obj, accessorString, val) {
    _deepPeekAndPoke(obj, accessorString, val);
    return obj;
}

// non-destructive (pure) version of assign
//
function copyAndAssign(obj, accessorString, val) {
    let result = deepAssign({}, obj);       // makes with a full, deep copy of the source object
    assign(result, accessorString, val);
    return result;
}

module.exports = {
    copy:           (obj) => deepAssign({}, obj),

    // signature of these three methods is the same. the third
    // parameter is ignored for [lookup], and required for the others.
    //
    //      assign(obj, accessorString, newValue?)
    //
    lookup:         _deepPeekAndPoke,
    copyAndAssign,  // pure, non-destructive
    assign          // destructive
};
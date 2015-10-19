var deepAssign = require('deep-assign');

/*
 two ways to use:
 READ:  _deepPeekAndPoke(obj, "dot.notation.string")
 WRITE: _deepPeekAndPoke(obj, "dot.notation.string", newValue)

 note: the WRITE signature is NOT PURE. it modifies {obj} in place.
 you should use the ASSIGN alias for writing, or copyAndAssign
 for purity.

 http://bit.ly/1ZMA4qA
 */

function _deepPeekAndPoke(obj, accessorString, val) {

    var props = accessorString.split('.'),
        final = props.pop(),
        p;

    while (p = props.shift()) {
        if (typeof obj[p] === 'undefined')
            return undefined;
        obj = obj[p]
    }
    if (typeof val === 'undefined')
        return obj[final];
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
    var result = deepAssign({}, obj);
    assign(result, accessorString, val);
    return result;
}

module.exports = {
    copy:           (obj) => deepAssign({}, obj),

    // signature: assign(obj, accessorString, newValue)
    lookup:         _deepPeekAndPoke,
    copyAndAssign,  // pure, non-destructive
    assign          // destructive
};
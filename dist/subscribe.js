'use strict';

var store = require('./store').getStore,
    lookup = require('./lookup');

/**
 * Custom wrapper around store.subscribe. This is patched into every model (see model.js)
 *
 * Usage:
 *      myModel.subscribe(myModel.selectors.userID, (newUserID) => {log(newUserID)});
 *
 * @param selector {(string|function)}
 * A string in dot notation, or a selector function with signature (state) => value. This
 * is used to find the property of interest in your store (e.g., "user.id")
 *
 * @param cb {function}
 * This function will be called only when the observed value changes. Its signature is simple:
 *      (newValue, previousValue) => {}
 *
 * @param opts{object}
 * Subscription options. The following options are available:
 *      {noInit:true} to suppress invoking the callback once at initialization time
 *      {equals:function} to provide a custom test for equality. The default comparator
 *              looks at primitive values only (i.e., a === b).
 *
 * @returns {function}
 * Passes back the return from store.subscribe() -- i.e., the unsubscribe function
 *
 */
function subscribe(selector, cb) {
    var opts = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];


    var previousValue,
        equals = opts.equals || function (a, b) {
        return a === b;
    },
        val = function val() {
        return lookup(store().getState(), selector);
    },
        handler = function handler() {
        var currentValue = val();
        if (!equals(previousValue, currentValue)) {
            var temp = previousValue;
            previousValue = currentValue;
            cb(currentValue, temp);
        }
    };

    // normally, we invoke the callback on startup, so that it gets
    // an initial value. you can suppress this with opts.noInit
    //
    if (!opts.noInit) cb(previousValue = val());

    // return the unsubscribe function to the caller
    return store().subscribe(handler);
}

module.exports = {
    subscribe: subscribe
};
var store  = require('./store').getStore,
    object = require('./object');


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
 * Subscription options. Currently only one option is available:
 *      {noInit:true} to suppress invoking the callback once at initialization time
 *
 * @returns {function}
 * Passes back the return from store.subscribe() -- i.e., the unsubscribe function
 *
 */
function subscribe(selector, cb, opts) {

    var previousValue,
        val     = () => object.lookup(store().getState(), selector),
        handler = () => {
            let currentValue = val();
            if (previousValue !== currentValue) {
                cb(currentValue, previousValue);
                previousValue = currentValue
            }
        };

    // normally, we invoke the callback on startup, so that it gets
    // an initial value. you can suppress this with opts.noInit
    //
    if (!(opts && opts.noInit))
        cb(previousValue = val());

    // return the unsubscribe function to the caller
    return store().subscribe(handler);
}

module.exports = {
    subscribe
};

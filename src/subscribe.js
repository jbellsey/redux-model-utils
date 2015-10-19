var store  = require('./store').getStore,
    object = require('./object');


/**
 * Custom wrapper around store.subscribe. This is patched into every model (see modelBuilder, below)
 *
 * @param accessorString{string} : dot-notation, used to find the property of interest (e.g., "appData.user.id")
 * @param cb{function}           : function will be called only when the value changes. signature: (newValue) => {}
 * @param opts{object}           : subscription options. currently: {noInit:true} to suppress invoking the callback
 *                                  once at initialization time
 * @returns {*}                  : passes back the return from store.subscribe() -- i.e., the unsubscribe handler
 *
 * Usage:
 *      myModel.subscribe(myModel.accessors.userID, (newUserID) => {log(newUserID);});
 */
function subscribe(accessorString, cb, opts) {

    var previousValue,
        val     = () => object.lookup(store().getState(), accessorString),
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
    if (!opts || !!opts.noInit)
        cb(previousValue = val());

    // return the unsubscribe function to the caller
    return store().subscribe(handler);
}

module.exports = {
    subscribe
};

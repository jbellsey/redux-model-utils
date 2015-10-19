var deepAssign = require('deep-assign'),
    waitable   = require('./waitable'),
    subscribe  = require('./subscribe');

/*
    adjust the model's accessors to include the model name.

    our use of combineReducers() (see store.js) causes each model's store to be scoped
    inside an object whose key is the model name.

    so inside the model you may have a store that looks like this: {userID}. but
    outside the model, that store looks like this: {model: {userID}}.

    so for consumers wanting to subscribe to changes on the model, they need to have
    an accessor prefixed with the model name: "model.userID". but inside the model,
    you probably still need the unscoped version for use inside your reducer.

        ORIGINAL:  accessor.location = "location"
        MODIFIED:  accessor.location = modelName + ".location"

    NOTE: this actually SEVERS the connection to [model.accessors], and inserts an
    entirely new object map.
*/

function mapAccessors(model) {

    // make a full copy of the accessors
    let newAccessors  = deepAssign({}, model.accessors),
        mustStartWith = model.name + '.';

    Object.keys(newAccessors).forEach(accessorKey => {
        let orig = newAccessors[accessorKey];
        if (orig.indexOf(mustStartWith) !== 0)
            newAccessors[accessorKey] = mustStartWith + orig;
    });

    // look! we're overwriting your accessor map!
    model.accessors = newAccessors;
}

// modify the public API for each model.
//
function modelBuilder(model) {

    //----------
    // merge in common functionality for all models
    //

    // pass through the subscribe method, so views don't have to import this library
    //
    model.subscribe = subscribe.subscribe;

    //----------
    // MAGIC code
    //

    // let a model easily request "waitable" functionality. this will be installed for you:
    //
    //  • actions for  "wait()" and "stopWaiting()". these are public, so they
    //      can be called by the view, or from inside your own async code
    //  • a boolean in the store. subscribe to changes at model.accessors.waiting
    //
    if (model.waitable)
        waitable.makeWaitable(model);

    //----------
    // nasty, overwritey, we-know-better-than-you stuff. dragons, and all that.

    // make some changes to the accessors object
    mapAccessors(model);

    //----------
    // close it up!
    //

    return Object.freeze(model);
}

module.exports = {
    modelBuilder
};
var deepAssign = require('deep-assign'),
    waitable   = require('./waitable'),
    subscribe  = require('./subscribe');

// merge in some methods onto the public API for each model.
//
function modelBuilder(model) {

    // merge in common functionality for all models
    model.subscribe = subscribe.subscribe;

    // let a model easily request "waitable" functionality. this will be installed for you:
    //
    //  • actions for  "wait()" and "stopWaiting()". these are public, so they
    //      can be called by the view, or from inside your own async code
    //  • a boolean in the store. subscribe to changes at model.accessors.waiting
    //
    if (model.waitable)
        waitable.makeWaitable(model);

    // map the accessors to include the model name. inside the model, the
    // accessor doesn't need a prefix. but external watchers do. this is
    // because of the way we use combineReducers() ... see [store.js]
    //
    //      accessor.location = "location"
    //   => accessor.location = modelName + ".location"
    //
    let newAccessors = deepAssign({}, model.accessors);

    // TODO: switch to forEach
    Object.keys(newAccessors).map(value => {
        let orig = newAccessors[value];
        if (orig.indexOf(model.name) !== 0)
            newAccessors[value] = model.name + '.' + orig;
    });
    model.accessors = newAccessors;

    return Object.freeze(model);
}

module.exports = {
    modelBuilder
};
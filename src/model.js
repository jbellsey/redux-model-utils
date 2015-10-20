var deepAssign = require('deep-assign'),
    waitable   = require('./waitable'),
    undoable   = require('./undoable'),
    subscribe  = require('./subscribe');

/*
    adjust the model's accessors to include the model name, and possibly "present" to
    account for the presence of redux-undo.

    our use of combineReducers() (see store.js) causes each model's store to be scoped
    inside an object whose key is the model name.

    so inside the model you may have a store that looks like this: {userID}. but
    outside the model, that store looks like this: {model: {userID}}.

    so for consumers wanting to subscribe to changes on the model, they need to have
    an accessor prefixed with the model name: "model.userID". but inside the model,
    you probably still need the unscoped version for use inside your reducer.

        ORIGINAL:  accessor.location = "location"
        MODIFIED:  accessor.location = modelName + ".location"

    if the model is undoable, the accessors are then scoped to "present":

        UNDOABLE:  accessor.location = modelName + ".present.location";

    NOTE: this actually SEVERS the connection to [model.accessors], and inserts an
    entirely new object map.
*/

    let startsWith = (haystack, needle) => haystack.indexOf(needle) === 0;

function mapAccessors(model) {

    // make a full copy of the accessors
    let newAccessors    = deepAssign({}, model.accessors),
        isUndoable      = model.options && model.options.undoable,
        presentPrefix   = 'present.',
        pastPrefix      = 'past.',
        futurePrefix    = 'future.',
        modelNamePrefix = model.name + '.';

    Object.keys(newAccessors).forEach(accessorKey => {

        let orig = newAccessors[accessorKey];

        if (isUndoable) {
            // undoables must start with modelname, then "present"
            // we omit "present" if we find "past" or "future", which means
            // the user is being deliberate about which undo stack they want
            //
            if (!(startsWith(orig, presentPrefix) || startsWith(orig, pastPrefix) || startsWith(orig, futurePrefix)))
                orig = modelNamePrefix + presentPrefix + orig;
            else if (!startsWith(orig, modelNamePrefix))
                orig = modelNamePrefix + orig;
            newAccessors[accessorKey] = orig;
        }
        else {
            // not undoable: accessor must start with the model name
            if (!startsWith(orig, modelNamePrefix))
                newAccessors[accessorKey] = modelNamePrefix + orig;
        }
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

    if (typeof model.options === 'object') {

        // let a model easily request "waitable" functionality. this will be installed for you:
        //
        //  • actions for  "wait()" and "stopWaiting()". these are public, so they
        //      can be called by the view, or from inside your own async code
        //  • a boolean in the store. subscribe to changes at model.accessors.waiting
        //
        if (model.options.waitable)
            waitable.makeWaitable(model);

        if (typeof model.options.undoable === 'object')
            undoable.makeUndoable(model)
    }

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
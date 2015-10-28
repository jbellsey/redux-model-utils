var object     = require('./object'),
    waitable   = require('./waitable'),
    undoable   = require('./undoable'),
    react      = require('./react'),
    subscribe  = require('./subscribe');

/*
    adjust the model's selectors to include the model name, and possibly "present" to
    account for the use of the redux-undo library.

    our use of combineReducers() (see store.js) causes each model's store to be scoped
    inside an object whose key is the model name.

    so inside the model you may have a store that looks like this: {userID}. but
    outside the model, that store looks like this: {model: {userID}}.

    so for consumers wanting to subscribe to changes on the model, they need to have
    a selector prefixed with the model name: "model.userID". but inside the model,
    you probably still need the unscoped version for use inside your reducer.

        ORIGINAL:  selector.location = "location"
        MODIFIED:  selector.location = modelName + ".location"

    if the model is undoable, the selectors are then scoped to "present":

        UNDOABLE:  selector.location = modelName + ".present.location";

    NOTE: this actually SEVERS the connection to [model.selectors], and inserts an
    entirely new object map.
*/

    let startsWith = (haystack, needle) => haystack.indexOf(needle) === 0;

function mapSelectors(model) {

    // make a full copy of the selectors
    let newSelectors    = object.clone(model.selectors),
        isUndoable      = model.options && model.options.undoable,
        presentPrefix   = 'present.',
        pastPrefix      = 'past.',
        futurePrefix    = 'future.',
        modelNamePrefix = model.name + '.',

        fixOneSelector  = selectorKey => {

            let orig = newSelectors[selectorKey];

            if (typeof orig === 'string') {

                if (isUndoable) {

                    // undoables must start with modelname, then "present"
                    // we omit "present" if we find "past" or "future", which means
                    // the user is being deliberate about which undo stack they want
                    //
                    if (!(startsWith(orig, presentPrefix) || startsWith(orig, pastPrefix) || startsWith(orig, futurePrefix)))
                        orig = modelNamePrefix + presentPrefix + orig;
                    else if (!startsWith(orig, modelNamePrefix))
                        orig = modelNamePrefix + orig;
                    newSelectors[selectorKey] = orig;
                }
                else {
                    // not undoable: selector must start with the model name
                    if (!startsWith(orig, modelNamePrefix))
                        newSelectors[selectorKey] = modelNamePrefix + orig;
                }
            }
            else if (typeof orig === 'function') {

                if (isUndoable) {
                    // for function selectors, we can't tell if the function is looking into
                    // the past or future zones. we have to assume present. for past/future
                    // selectors, you must use a string.
                    //
                    newSelectors[selectorKey] = (state) => orig(state[model.name].present);
                }
                else {
                    newSelectors[selectorKey] = (state) => orig(state[model.name]);
                }
            }
        };

    Object.keys(newSelectors).forEach(fixOneSelector);

    // look! we're overwriting your selector map!
    model.selectors = newSelectors;
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
        //  • a boolean in the store. subscribe to changes at model.selectors.waiting
        //
        if (model.options.waitable)
            waitable.makeWaitable(model);

        // similar for undoable functionality. adds actions (undo, redo) and subscribable
        // properties (undoLength, redoLength)
        //
        if (typeof model.options.undoable === 'object')
            undoable.makeUndoable(model);

        // when using this library with react, prepare a selector map for use with
        // the connect() function provided by react-redux
        //
        if (typeof model.options.react === 'object')
            react.reactify(model)
    }

    //----------
    // nasty, overwritey, we-know-better-than-you stuff. dragons, and all that.

    // make some changes to the selectors object
    mapSelectors(model);

    //----------
    // close it up!
    //

    return Object.freeze(model);
}

module.exports = {
    modelBuilder
};
var object     = require('./object'),
    actions    = require('./actions'),
    waitable   = require('./waitable'),
    undoable   = require('./undoable'),
    react      = require('./react'),
    store      = require('./store'),
    subscribe  = require('./subscribe');


let startsWith = (haystack, needle) => haystack.indexOf(needle) === 0;

// create direct getters for accessing the underlying model: "model.data.property"
// one accessor is created for each selector in your list (and with the same name)
// we also create a top-level accessor "model.allData" to retrieve the full state.
//
function buildAccessors(model) {

    model.data = {};

    Object.keys(model.selectors).forEach(key => {
        Object.defineProperty(model.data, key, {
            get: () => object.lookup(store.getStore().getState(), model.selectors[key])
        });
    });

    Object.defineProperty(model, 'allData', {
        get: () => store.getStore().getState()[model.name]
    });
}

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
    model.rawSelectors = model.selectors;
    model.selectors = newSelectors;
}

/*
    if provided, the action map must be in this format:
        actionMap = {
            key: {
                code:   UNIQUE_STRING,
                params: [array, of, strings, for, action, creator]
                reducer(state, action) => {}
            }
        }

    and if you provide it, you must also attach an "initialState" object to the model.
 */

function find(arr, predicate) {

    var value, i;
    for (i = 0; i < arr.length; ++i) {
        if (predicate(value = arr[i]))
            return value;
    }
    return undefined;
}

function parseActionMap(model) {

    var listOfActions  = {},
        listOfReducers = [];

    Object.keys(model.actionMap).forEach(key => {

        let actionDetails = model.actionMap[key],
            params        = actionDetails.params;

        if (typeof params === 'string')
            params = [params];
        else if (!params)
            params = [];

        // add an action-creator. async is handled differently
        if (actionDetails.async) {
            listOfActions[key] = actions.makeAsyncAction(actionDetails.async, ...params);
        }
        else {
            listOfActions[key] = actions.makeActionCreator(actionDetails.code, ...params);

            // install the reducer
            listOfReducers.push({
                code: actionDetails.code,
                fnc:  actionDetails.reducer
            });
        }
    });

    // the output of the actionMap: actions & reducer
    model.actions = listOfActions;
    model.reducer = (state = model.initialState, action = {}) => {

        var reducer = find(listOfReducers, reducer => reducer.code === action.type);
        if (reducer)
            state = reducer.fnc(state, action);
        return state;
    };
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
    // the user can specify actions & reducer in the form of an actionMap; see above
    if (model.actionMap && model.initialState)
        parseActionMap(model);

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

    // build a list of accessors for getting the underlying data
    buildAccessors(model);

    //----------
    // close it up!
    //

    return Object.freeze(model);
}

module.exports = {
    modelBuilder
};
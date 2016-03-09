var assignDeep = require('assign-deep'),
    actionMap  = require('./action-map'),
    accessors  = require('./accessors'),
    waitable   = require('./waitable'),
    react      = require('./react'),
    subscribe  = require('./subscribe');


let startsWith = (haystack, needle) => haystack.indexOf(needle) === 0,
    allModelNames = [];

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

 NOTE: this actually SEVERS the connection to [model.selectors], and inserts an
 entirely new object map.
 */

function mapSelectors(model) {

    // make a full copy of the selectors
    let newSelectors    = assignDeep({}, model.selectors || {}),
        modelNamePrefix = model.name + '.',

        fixOneSelector  = selectorKey => {

            let orig = newSelectors[selectorKey];

            if (typeof orig === 'string') {
                if (!startsWith(orig, modelNamePrefix))
                    newSelectors[selectorKey] = modelNamePrefix + orig;
            }
            else if (typeof orig === 'function') {
                newSelectors[selectorKey] = state => orig(state[model.name]);
            }
        };

    Object.keys(newSelectors).forEach(fixOneSelector);

    // look! we're overwriting your selector map!
    model.rawSelectors = model.selectors;
    model.selectors    = newSelectors;
}


// modify the public API for each model.
//
function modelBuilder(model) {

    if (allModelNames.indexOf(model.name) !== -1)
        throw new Error(`redux-model-utils: Two models have the same name (${model.name})`);
    else
        allModelNames.push(model.name);

    // juice the model name, for conflict-free living
    model.rawName = model.name;
    model.name = `model$_${model.name}`;

    //----------
    // merge in common functionality for all models
    //

    // pass through the subscribe method, so views don't have to import this library
    //
    model.subscribe = subscribe.subscribe;

    //----------
    // the user can specify actions & reducer in the form of an actionMap; see above
    if (model.actionMap && model.initialState)
        actionMap.parseActionMap(model);

    // TODO: make ez-selectors
    // i.e., if no selectors are provided, map the top level of the initialState object.
    // so this will work for action maps only

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
    }

    //----------
    // for usage of this library with react, prepare a selector map for use with
    // the connect() function provided by react-redux. does not affect non-react apps.
    //
    react.reactify(model);

    //----------
    // nasty, overwritey, we-know-better-than-you stuff. dragons, and all that.

    // make some changes to the selectors object
    mapSelectors(model);

    // build a list of accessors for getting the underlying data
    accessors.buildAccessors(model);

    //----------
    // close it up!
    //
    model._magic_rmu = true;

    return model;
}

module.exports = {
    modelBuilder
};
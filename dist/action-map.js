'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var actions = require('./actions');

/*
     if provided, the action map must be in this format:
        actionMap = {
            key: {
                params: [array, of, strings, for, action, creator]
                reducer(state, action) => {}
            }
        }

     and if you provide it, you must also attach an "initialState" object to the model.
 */

function find(arr, predicate) {

    var value, i;
    for (i = 0; i < arr.length; ++i) {
        if (predicate(value = arr[i])) return value;
    }
    return undefined;
}

function parseActionMap(model) {

    var listOfActions = {},
        listOfPrivateActions = {},
        listOfReducers = [],
        anyPrivate = false;

    Object.keys(model.actionMap).forEach(function (key) {

        var actionDetails = model.actionMap[key],
            code = model.name + '_' + key,
            params = actionDetails.params,
            putHere = void 0;

        if (actionDetails.private) {
            putHere = listOfPrivateActions;
            anyPrivate = true;
        } else putHere = listOfActions;

        if (typeof params === 'string') params = [params];else if (!params) params = [];

        // add an action-creator. async is handled differently
        if (actionDetails.async) {
            putHere[key] = actions.makeAsyncAction.apply(actions, [actionDetails.async].concat(_toConsumableArray(params)));
        }
        // thunk is a synonym for async. used when the action isn't actually async, but
        // has to fire off other actions
        else if (actionDetails.thunk) {
                putHere[key] = actions.makeAsyncAction.apply(actions, [actionDetails.thunk].concat(_toConsumableArray(params)));
            } else {
                putHere[key] = actions.makeActionCreator.apply(actions, [code].concat(_toConsumableArray(params)));

                // install the reducer
                listOfReducers.push({
                    code: code,
                    fnc: actionDetails.reducer
                });
            }
    });

    // the output of the actionMap: public actions, private actions, and reducer
    model.actions = listOfActions;
    model.privateActions = listOfPrivateActions;
    model.reducer = function () {
        var state = arguments.length <= 0 || arguments[0] === undefined ? model.initialState : arguments[0];
        var action = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];


        var matcher = function matcher(reducer) {
            return reducer.code === action.type;
        },
            reducerInfo = find(listOfReducers, matcher);

        if (!reducerInfo) reducerInfo = find(listOfPrivateActions, matcher);

        if (reducerInfo) state = reducerInfo.fnc(state, action);
        return state;
    };

    // this can be used one time only.
    // it retrieves the list of private actions, and severs
    // that list from the public model.
    //
    if (anyPrivate) {
        model.severPrivateActions = function () {
            var trulyPrivateActions = model.privateActions;
            model.privateActions = null;
            return trulyPrivateActions;
        };
    }
}

module.exports = {
    parseActionMap: parseActionMap,
    publicAPI: {} // no public exports
};
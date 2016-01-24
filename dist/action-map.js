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
        listOfReducers = [];

    Object.keys(model.actionMap).forEach(function (key) {

        var actionDetails = model.actionMap[key],
            code = model.name + '_' + key,
            params = actionDetails.params;

        if (typeof params === 'string') params = [params];else if (!params) params = [];

        // add an action-creator. async is handled differently
        if (actionDetails.async) {
            listOfActions[key] = actions.makeAsyncAction.apply(actions, [actionDetails.async].concat(_toConsumableArray(params)));
        } else {
            listOfActions[key] = actions.makeActionCreator.apply(actions, [code].concat(_toConsumableArray(params)));

            // install the reducer
            listOfReducers.push({
                code: code,
                fnc: actionDetails.reducer
            });
        }
    });

    // the output of the actionMap: actions & reducer
    model.actions = listOfActions;
    model.reducer = function () {
        var state = arguments.length <= 0 || arguments[0] === undefined ? model.initialState : arguments[0];
        var action = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var reducerInfo = find(listOfReducers, function (reducer) {
            return reducer.code === action.type;
        });
        if (reducerInfo) state = reducerInfo.fnc(state, action);
        return state;
    };
}

module.exports = {
    parseActionMap: parseActionMap,
    publicAPI: {} // no public exports
};
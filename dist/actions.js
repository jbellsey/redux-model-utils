'use strict';

var store = require('./store').getStore;

// returns a redux-standard action object. it always has a {type} key,
// plus whatever values you request in the [valueNames] and [values] arrays.
// this should not typically be needed by client applications; use the other
// tools provided below.
//
function makeAction(type, valueNames, values) {
    var action = { type: type };
    valueNames.forEach(function (arg, index) {
        action[valueNames[index]] = values[index];
    });
    return action;
}

// builds a partially-applied function for creating actions dynamically.
// this is the most common way to build and dispatch actions.
//
// example:
//      let add = makeActionCreator('adder', 'number');
//      add(4);
//
function makeActionCreator(type) {
    for (var _len = arguments.length, argNames = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        argNames[_key - 1] = arguments[_key];
    }

    return function () {
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
        }

        var action = makeAction(type, argNames, args);
        store().dispatch(action);
    };
}

// this lets you patch into the process, instead of dispatching an action directly.
// inside your callback, you can call other (synchronous) actions within your async code.
//
//      let asyncAdd = makeAsyncAction(args => {
//            add(args.number);
//      }, 'number');
//
function makeAsyncAction(cb) {
    for (var _len3 = arguments.length, argNames = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        argNames[_key3 - 1] = arguments[_key3];
    }

    return function () {
        for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
            args[_key4] = arguments[_key4];
        }

        // make a placeholder action object, just to collect the given args. its type will be null,
        // but its other keys will match the requested argument names, just as with normal action creators.
        //
        var argObject = makeAction(null, argNames, args),

        // this thunk is sent to the dispatcher. it will only work properly if the user
        // has installed and configured the [redux-thunk] library
        //
        thunk = function thunk(dispatch, getState) {
            return cb(argObject, dispatch, getState);
        };

        // we pass back the result of the user's callback. e.g., return a promise for chaining
        return store().dispatch(thunk);
    };
}

module.exports = {
    makeActionCreator: makeActionCreator,
    makeAsyncAction: makeAsyncAction
};
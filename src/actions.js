var store = require('./store').getStore;

// returns a redux-standard action object. it always has a {type} key,
// plus whatever values you request in the [valueNames] and [values] arrays
//
function makeAction(type, valueNames, values) {
    let action = {type};
    valueNames.forEach((arg, index) => {
        action[valueNames[index]] = values[index];
    });
    return action;
}

// builds a partially-applied function for creating actions dynamically.
// this is the most common way to build actions.
// example:
//      let add = makeActionCreator('adder', 'number');
//      add(4);
//
function makeActionCreator(type, ...argNames) {

    return (...args) => {
        let action = makeAction(type, argNames, args);
        store().dispatch(action);
    }
}

// this lets you patch into the process, instead of dispatching an action directly.
// inside your callback, you can call other (synchronous) actions within your async code.
//
//      let asyncAdd = makeAsyncAction(args => {
//            add(args.number);
//      }, 'number');
//
function makeAsyncAction(cb, ...argNames) {

    return (...args) => {

        // make a placeholder action, just to collect the given args. its type will be null,
        // but its other keys will match the requested arguments, just as with normal action creators.
        //
        let argObject = makeAction(null, argNames, args),
            thunk     = (dispatch, getState) => cb(argObject, dispatch, getState);
        store().dispatch(thunk);
    }
}

module.exports = {
    makeAction,
    makeActionCreator,
    makeAsyncAction
}
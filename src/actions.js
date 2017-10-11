import {getStore} from './store';

// returns a redux-standard action object. it always has a {type} key,
// plus whatever values you request in the [valueNames] and [values] arrays.
// this is not needed by client applications; use the other tools provided below.
//
function makeAction(type, valueNames, values) {
  let action = {type};
  valueNames.forEach((arg, index) => {
    action[valueNames[index]] = values[index];
  });
  return action;
}

// builds a partially-applied function for creating actions dynamically.
// this is the most common way to build and dispatch actions in redux.
//
// example:
//      let add = makeActionCreator('adder', 'number');
//      add(4);
//
export function makeActionCreator(type, ...argNames) {

  return (...args) => {
    let action = makeAction(type, argNames, args);
    getStore().dispatch(action);
  }
}

// this lets you patch into the process, instead of dispatching an action directly.
// inside your callback, you can call other (synchronous) actions within your async code.
//
//      let asyncAdd = makeAsyncAction(args => {
//            add(args.number);
//      }, 'number');
//
export function makeAsyncAction(cb, ...argNames) {

  return (...args) => {

    // make a placeholder action object, just to collect the given args. its type will be null,
    // but its other keys will match the requested argument names, just as with normal action creators.
    //
    let argObject = makeAction(null, argNames, args),

        // this thunk is sent to the dispatcher. it will only work properly if the user
        // has installed and configured the [redux-thunk] library
        //
        thunk     = (dispatch, getState) => cb(argObject, dispatch, getState);

    // we pass back the result of the user's callback. e.g., return a promise for chaining
    return getStore().dispatch(thunk);
  }
}

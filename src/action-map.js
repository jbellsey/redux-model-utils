import {makeActionCreator, makeAsyncAction} from './actions';

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

  let value;
  for (let i = 0; i < arr.length; ++i) {
    if (predicate(value = arr[i]))
      return value;
  }
  return undefined;
}

export default function parseActionMap(model) {

  let listOfActions        = {},
      listOfPrivateActions = {},
      listOfReducers       = [],
      anyPrivate           = false;

  Object.keys(model.actionMap).forEach(key => {

    let actionDetails = model.actionMap[key],
        code          = `${model.name}_${key}`,
        params        = actionDetails.params,
        putHere;

    if (actionDetails.private) {
      putHere = listOfPrivateActions;
      anyPrivate = true;
    }
    else
      putHere = listOfActions;

    if (typeof params === 'string')
      params = [params];
    else if (!params)
      params = [];

    // add an action-creator. async is handled differently
    if (actionDetails.async) {
      putHere[key] = makeAsyncAction(actionDetails.async, ...params);
    }
    // thunk is a synonym for async. used when the action isn't actually async, but
    // has to fire off other actions
    else if (actionDetails.thunk) {
      putHere[key] = makeAsyncAction(actionDetails.thunk, ...params);
    }
    else {
      putHere[key] = makeActionCreator(code, ...params);

      // install the reducer
      listOfReducers.push({
        code,
        fnc: actionDetails.reducer
      });
    }
  });

  // the output of the actionMap: public actions, private actions, and reducer
  model.actions = listOfActions;
  model.privateActions = listOfPrivateActions;
  model.reducer = (state = model.initialState, action = {}) => {

    let matcher     = reducer => reducer.code === action.type,
        reducerInfo = find(listOfReducers, matcher);

    if (!reducerInfo)
      reducerInfo = find(listOfPrivateActions, matcher);

    if (reducerInfo)
      state = reducerInfo.fnc(state, action);
    return state;
  };

  // this can be used one time only.
  // it retrieves the list of private actions, and severs
  // that list from the public model.
  //
  if (anyPrivate) {
    model.severPrivateActions = () => {
      let trulyPrivateActions = model.privateActions;
      model.privateActions = null;
      return trulyPrivateActions;
    }
  }
}

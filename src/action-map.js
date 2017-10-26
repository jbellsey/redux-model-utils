import {makeActionCreator, makeAsyncAction} from './actions';
import {find, isObject, isFunction} from './utils';


function isAction(obj) {
  return isObject(obj)
    && (isFunction(obj.reducer) || isFunction(obj.async) || isFunction(obj.thunk));
}

function mapActions(actionMap, namespace, mapInfo) {

  let {actionTree, privateTree, listOfReducers} = mapInfo;

  Object.keys(actionMap).forEach(key => {

    let actionDetails = actionMap[key],
        code          = `${namespace}~${key}`,
        {params, async, thunk, reducer, private: isPrivateAction,   // these are the reserved words that indicate an action
          ...subActions} = actionDetails,   // everything else becomes a sub-action
        putHere, actionMethod;

    // first deal with the action at the top level of this object. it may or may not exist.
    if (isAction(actionDetails)) {
      if (isPrivateAction) {
        putHere = privateTree;
        mapInfo.anyPrivate = true;
      }
      else
        putHere = actionTree;

      if (typeof params === 'string')
        params = [params];
      else if (!params)
        params = [];

      // add an action-creator. async is handled differently. (thunk is a synonym)
      const asyncHandler = async || thunk;
      if (asyncHandler)
        actionMethod = makeAsyncAction(asyncHandler, ...params);
      else {
        actionMethod = makeActionCreator(code, ...params);

        // install the reducer. private reducers go here as well
        listOfReducers.push({
          code,
          fnc: reducer
        });
      }
      putHere[key] = actionMethod;
    }

    // next, deal with nested actions. the root level (handled above) may or
    // may not exist. so sub-actions may be nested inside a new object, or they may
    // be nested as new properties attached directly to the function at the root.
    //
    if (Object.keys(subActions).length > 0) {
      // set up mapInfo at the new nest level
      mapInfo.actionTree  = actionTree[key]  = actionMethod || {};
      mapInfo.privateTree = privateTree[key] = actionMethod || {};

      // scan all of the sub-actions
      mapActions(actionDetails, key, mapInfo);

      // put mapInfo back the way it was
      mapInfo.actionTree  = actionTree;
      mapInfo.privateTree = privateTree;
    }
  });
}

export default function parseActionMap(model) {

  // this blob will be used by mapActions to track status. consider it
  // a giant return value
  //
  let mapInfo = {
    actionTree:     {},
    privateTree:    {},
    listOfReducers: [],
    anyPrivate:     false
  };

  mapActions(model.actionMap, model.name, mapInfo);

  // the output of the actionMap: public actions, private actions, and a single master reducer
  model.actions = mapInfo.actionTree;
  model.privateActions = mapInfo.privateTree;
  model.reducer = (state = model.initialState, action = {}) => {

    let matcher     = reducer => reducer.code === action.type,
        reducerInfo = find(mapInfo.listOfReducers, matcher);

    if (reducerInfo)
      state = reducerInfo.fnc(state, action);
    return state;
  };

  // this can be used one time only.
  // it retrieves the list of private actions, and severs
  // that list from the public model.
  //
  if (mapInfo.anyPrivate) {
    model.severPrivateActions = () => {
      let trulyPrivateActions = model.privateActions;
      model.privateActions = null;
      return trulyPrivateActions;
    }
  }
}

import {makeActionCreator, makeAsyncAction} from './actions';
import {isObject, isFunction} from './utils';


function isAction(obj) {
  return isObject(obj)
    && (isFunction(obj.reducer) || isFunction(obj.async) || isFunction(obj.thunk));
}

function mapActions(actionMap, namespace, mapInfo) {

  let {actionTree, privateTree, allReducers, model} = mapInfo;

  Object.keys(actionMap).forEach(key => {

    let actionDetails = actionMap[key],
        {
          // these are the reserved words that indicate an action
          params, async, thunk, reducer,
          actionType = `${namespace}/${key}`,
          private: isPrivateAction,

          // everything else becomes a sub-action
          ...subActions
        } = actionDetails,
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
        actionMethod = makeActionCreator(actionType, ...params);

        // install the reducer. private reducers go here as well
        if (allReducers[actionType])
          console.warn(`redux-model-utils: multiple reducers are installed on model[${model.name}] for action type = "${actionType}"`);
        allReducers[actionType] = reducer;
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
      mapInfo.privateTree = privateTree[key] = actionMethod || {};  // (yes, this needs its own empty object)

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
    model,
    actionTree:  {},
    privateTree: {},
    allReducers: {},
    anyPrivate:  false
  };

  mapActions(model.actionMap, model.name, mapInfo);

  // the output of the actionMap: public actions, private actions, and a single master reducer
  model.actions = mapInfo.actionTree;
  model._rmu.privateActions = mapInfo.privateTree;
  model.reducer = (state = model.initialState, action = {}) => {
    const reducer = mapInfo.allReducers[action.type];
    if (reducer)
      state = reducer(state, action);
    return state;
  };

  // this can be used one time only.
  // it retrieves the list of private actions, and severs
  // that list from the public model.
  //
  if (mapInfo.anyPrivate) {
    model.severPrivateActions = () => {
      const trulyPrivateActions = model._rmu.privateActions;
      model._rmu.privateActions = model.severPrivateActions = null;
      return trulyPrivateActions;
    }
  }

  // eliminate the original action map
  model.actionMap = null;
}

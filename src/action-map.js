import {makeActionCreator, makeAsyncAction} from './actions';
import {isObject, objectHasKeys, isFunction} from './utils';


function isAction(obj) {
  return isObject(obj)
    && (isFunction(obj.reducer) || isFunction(obj.async) || isFunction(obj.thunk));
}

// this function is not pure; it will modify "allReducers" in place
//
function mapActions(actionMap, namespace, model, allReducers) {

  let anyPrivate = false,
      publicTree,
      privateTree;

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
        putHere,
        actionMethod;

    // first deal with the action at the top level of this object. it may or may not exist.
    if (isAction(actionDetails)) {
      if (isPrivateAction) {
        privateTree = privateTree || {};
        putHere = privateTree;
        anyPrivate = true;
      }
      else {
        publicTree = publicTree || {};
        putHere = publicTree;
      }

      // coerce params into an array
      if (typeof params === 'string')
        params = [params];
      else if (!params)
        params = [];

      // add an action-creator. async/thunk is handled differently
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
    if (objectHasKeys(subActions)) {
      // scan all of the sub-actions
      let {
          publicTree:  subPublicTree,
          privateTree: subPrivateTree,
          anyPrivate:  subAnyPrivate
        }
        = mapActions(subActions, actionType, model, allReducers);

      // merge in the results
      if (subPublicTree) {
        publicTree = publicTree || {};
        publicTree[key] = publicTree[key] || {};
        Object.assign(publicTree[key], subPublicTree);
      }

      if (subPrivateTree) {
        privateTree = privateTree || {};
        privateTree[key] = privateTree[key] || {};
        Object.assign(privateTree[key], subPrivateTree);
      }

      if (subAnyPrivate)
        anyPrivate = true;
    }
  });

  return {
    publicTree,
    privateTree,
    anyPrivate
  };
}

export default function parseActionMap(model) {

  let allReducers = {},
      {publicTree, privateTree, anyPrivate}
        = mapActions(model.actionMap, model.name, model, allReducers);

  model.actions = publicTree;
  model._rmu.privateActions = privateTree;

  // the master reducer
  model.reducer = (state = model.initialState, action = {}) => {
    const reducer = allReducers[action.type];
    if (reducer)
      state = reducer(state, action);
    return state;
  };

  // this can be used one time only.
  // it retrieves the list of private actions, and severs
  // that list from the public model.
  //
  if (anyPrivate) {
    model.severPrivateActions = () => {
      const trulyPrivateActions = model._rmu.privateActions;
      model._rmu.privateActions = model.severPrivateActions = null;
      return trulyPrivateActions;
    }
  }

  // eliminate the original action map
  model.actionMap = null;
}

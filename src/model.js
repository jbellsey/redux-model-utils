import {reactify} from './react';
import buildAccessors from './accessors';
import parseActionMap from './action-map';
import subscribe from './subscribe';

let allModelNames = [];

export function refreshForTesting() {
  allModelNames = [];
}

function validateAndCleanup(model) {

  if (allModelNames.indexOf(model.name) !== -1)
    throw new Error(`redux-model-utils: Two models have the same name (${model.name})`);
  else
    allModelNames.push(model.name);

  if (model.reducer)
    console.error('redux-model-utils: You cannot provide a master "reducer" method; it is created for you.');

  if (!(model.actionMap || model.initialState))
    console.error('redux-model-utils: You must provide actionMap and initialState objects.');

  // pre cleanup
  if (!model.options)
    model.options = {};
  if (!model.selectors)
    model.selectors = {};
}

// modify the public API for each model.
//
export function modelBuilder(model) {

  validateAndCleanup(model);

  // the presence of this key is an indicator. it also contains our private stuff.
  Object.defineProperty(model, '_rmu', {
    enumerable: false,
    value:      {}
  });

  // pass through the subscribe method, so views don't have to import this library
  //
  model.subscribe = subscribe;

  //----------
  // the user must specify actions & reducer in the form of an actionMap
  parseActionMap(model);

  // TODO: make ez-selectors
  // i.e., if no selectors are provided, map the top level of the initialState object.
  // so this will work for action maps only

  //----------
  // for usage of this library with react, prepare a selector map for use with
  // the connect() function provided by react-redux. does not affect non-react apps.
  //
  reactify(model);

  //----------
  // build a list of accessors for getting the underlying data
  buildAccessors(model);

  return model;
}

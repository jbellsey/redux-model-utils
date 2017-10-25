import {reactify} from './react';
import buildAccessors from './accessors';
import parseActionMap from './action-map';
import subscribe from './subscribe';

let allModelNames = [];

// modify the public API for each model.
//
export function modelBuilder(model) {

  if (allModelNames.indexOf(model.name) !== -1)
    throw new Error(`redux-model-utils: Two models have the same name (${model.name})`);
  else
    allModelNames.push(model.name);

  // juice the model name, for conflict-free living
  model.rawName = model.name;
  model.name = `model$_${model.name}`;

  //----------
  // merge in common functionality for all models
  //

  // pass through the subscribe method, so views don't have to import this library
  //
  model.subscribe = subscribe;

  //----------
  // the user can specify actions & reducer in the form of an actionMap; see above
  if (model.actionMap && model.initialState)
    parseActionMap(model);

  // TODO: make ez-selectors
  // i.e., if no selectors are provided, map the top level of the initialState object.
  // so this will work for action maps only

  //----------
  // MAGIC code
  //

  if (typeof model.options === 'object') {
    // TODO
  }

  //----------
  // for usage of this library with react, prepare a selector map for use with
  // the connect() function provided by react-redux. does not affect non-react apps.
  //
  reactify(model);

  //----------
  // build a list of accessors for getting the underlying data
  buildAccessors(model);

  //----------
  // close it up!
  //
  model._magic_rmu = true;

  return model;
}

import {lookup} from './utils';

// builds a function that returns a new map of selectors.
// the new map is scoped to the model name. used for setting
// up react-redux
//
function externalizeSelectors(selectors, model) {

  let modelName = model.name,
      namespace = model.options.propsNamespace;

  if (namespace !== undefined && typeof namespace !== 'string') {
    console.warn('redux-model-utils: propsNamespace must be a string');
    namespace = null;
  }

  return state => {

    const props = Object.keys(selectors).reduce((map, sel) => {

      // note: older versions of this code had fallbacks for when state[modelName]
      // didn't resolve correctly. this should never happen.
      //
      map[sel] = lookup(state, selectors[sel], modelName);
      return map;
    }, {});

    return namespace ? {[namespace]: props} : props;
  };
}

export function reactify(model) {

  // the default map of selectors to props
  model.reactSelectors = externalizeSelectors(model.selectors || {}, model);

  // the user can request additional maps be created. each key in the "propsMap"
  // field on the model is converted into a new set of reactSelectors:
  //
  //  model.propsMaps = {key1: selectors, key2: moreSelectors}
  //
  model.propsMaps = Object.keys(model.propsMaps || {}).reduce((newPropsMaps, oneMapName) => {
    newPropsMaps[oneMapName] = externalizeSelectors(model.propsMaps[oneMapName], model);
    return newPropsMaps;
  }, {});
}

// merge the reactSelectors from multiple models for use in a single connected component.
// duplicate keys will be last-in priority. accepts a list of either models or reactified maps.
//
export function mergeReactSelectors(...objects) {

  return state => {

    let props = {};
    (objects || []).forEach(oneObject => {

      // is it a model? then pull its already-prepared reactSelectors.
      // otherwise, it's a propsMap that has already been reactified
      if (oneObject._magic_rmu)
        oneObject = oneObject.reactSelectors;

      Object.assign(props, oneObject(state));
    });
    return props;
  };
}

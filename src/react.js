import {lookup} from './utils';

// selectors are individual functions: state => prop.
// what we want is a single function: state => props (plural)
//
function buildStateMappingFunction(selectors, model) {

  let modelName = model.name,
      namespace = model.options.propsNamespace;

  if (namespace !== undefined && typeof namespace !== 'string') {
    console.warn('redux-model-utils: propsNamespace must be a string');
    namespace = null;
  }

  const mapStateToProps = state => {

    const props = Object.keys(selectors).reduce((props, selectorName) => {
      props[selectorName] = lookup(state, selectors[selectorName], modelName);
      return props;
    }, {});

    return namespace ? {[namespace]: props} : props;
  };

  // add a hint that this mapping function is namespaced. we need this when merging (below).
  // the hint is added to the function itself, not to its output
  //
  if (namespace) {
    Object.defineProperty(mapStateToProps, '_rmu_namespace', {
      enumerable: false,
      value:      namespace
    });
  }
  return mapStateToProps;
}

export function reactify(model) {

  // the default map of selectors to props
  model.mapStateToProps = buildStateMappingFunction(model.selectors || {}, model);

  // a deprecated synonym:
  Object.defineProperty(model, 'reactSelectors', {
    enumerable: false,
    get: () => {
      console.warn('redux-model-utils: The use of "model.reactSelectors" is deprecated. Use "model.mapStateToProps" instead.');
      return model.mapStateToProps;
    }
  });

  // the user can request additional maps be created. each key in "model.propsMaps"
  // is converted into a new mapping function, usable in @connect
  //
  //  model.propsMaps = {key1: selectors, key2: moreSelectors}
  //
  model.propsMaps = Object.keys(model.propsMaps || {}).reduce((newPropsMaps, oneMapName) => {
    newPropsMaps[oneMapName] = buildStateMappingFunction(model.propsMaps[oneMapName], model);
    return newPropsMaps;
  }, {});
}

// merge the "mapStateToProps" outputs from multiple models for use in a single connected component.
// duplicate keys will be last-in priority. accepts a list of either models or reactified maps.
// for models that have a propsNamespace option, ALL of the propsMaps are namespaced.
//
export function mergePropsMaps(...objects) {
  return state => {

    let props = {};
    (objects || []).forEach(oneObject => {

      // is it a model? then pull its already-prepared state-to-props function.
      // otherwise, it's a propsMap that has already been reactified
      let mapStateToProps = oneObject._rmu ? oneObject.mapStateToProps : oneObject;

      // should never happen:
      if (typeof mapStateToProps !== 'function')
        return;

      // namespaced props-maps need a bit more care, to ensure that we merge properly
      let propsForThisMap = mapStateToProps(state),
          ns = mapStateToProps._rmu_namespace;
      if (ns) {
        props[ns] = props[ns] || {};
        Object.assign(props[ns], propsForThisMap[ns]);
      }
      else
        Object.assign(props, propsForThisMap);
    });
    return props;
  };
}

export function mergeReactSelectors(...objects) {
  console.warn('redux-model-utils: The use of "mergeReactSelectors" is deprecated. Use "mergePropsMaps" instead.');
  return mergePropsMaps(...objects);
}

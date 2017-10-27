import {getStore} from './store';
import {lookup} from './utils';

// create direct getters for accessing the underlying model: "model.data.property"
// one accessor is created for each selector in your list (and with the same name)
// we also create a top-level accessor "model.allData" to retrieve the full state.
//
export default function buildAccessors(model) {

  model.data = {};

  // each selector gets an accessor on model.data
  Object.keys(model.selectors).forEach(key => {
    Object.defineProperty(model.data, key, {
      get: () => {
        let state = getStore().getState();
        return lookup(state, model.selectors[key], model.name);
      }
    });
  });

  Object.defineProperty(model, 'allData', {
    get: () => {
      let state = getStore().getState(),
          subState = state[model.name];
      return (typeof subState === 'object') ? subState : state;
    }
  });
}

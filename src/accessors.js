import lookup from './lookup';
import {getStore} from './store';

// create direct getters for accessing the underlying model: "model.data.property"
// one accessor is created for each selector in your list (and with the same name)
// we also create a top-level accessor "model.allData" to retrieve the full state.
//
export default function buildAccessors(model) {

  let data = {};

  Object.keys(model.selectors).forEach(key => {
    Object.defineProperty(data, key, {
      get: () => {
        let state = getStore().getState();
        return lookup(state, model.selectors[key]);
      }
    });
  });
  model.data = data;

  Object.defineProperty(model, 'allData', {
    get: () => {
      let state = getStore().getState();
      if (typeof state[model.name] === 'object')
        state = state[model.name];
      return state;
    }
  });
}

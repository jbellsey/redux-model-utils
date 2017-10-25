import {getStore} from './store';

// create a direct getter for accessing the underlying model: "model.data.property".
// "model.data" will return the entire state tree for a given model. use cautiosly,
// as it's the actual state, not a copy.
//
export default function buildAccessors(model) {

  Object.defineProperty(model, 'data', {
    get: () => {
      let state = getStore().getState(),
          subState = state[model.name];

      // this test should always be true
      return (typeof subState === 'object') ? subState : state;
    }
  });

  // earlier versions of this library exposed "allData", which did the same thing.
  Object.defineProperty(model, 'allData', {
    get: () => {
      console.warn('Warning: the "allData" accessor is deprecated. Use model.data instead.');
      return model.data;
    }
  });
}

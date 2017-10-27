import configureStore from 'redux-mock-store';
import {setStore} from '../../src/store';
import thunk from 'redux-thunk';

//----------
// store helper. designed specifically to support one or more models built with redux-model-utils
//
export default function mockStore(models) {
  if (!Array.isArray(models))
    models = [models];
  let   currentState = {};
  const getState        = () => currentState,
        getModelState   = (model = models[0]) => currentState[model.name],
        modelDispatcher = model => () => next => action => {
          currentState[model.name] = model.reducer(currentState[model.name], action);
          return next(action);
        },
        modelMiddlewares = models.map(modelDispatcher),
        middlewares      = modelMiddlewares.concat(thunk),
        store            = configureStore(middlewares)(getState);

  setStore(store);
  spyOn(store, 'dispatch').and.callThrough();
  currentState = models.reduce((state, model) => {
    state[model.name] = model.reducer();
    return state;
  }, {});
  store.getModelState = getModelState;
  return store;
}

// a store with no models
export function mockModelFreeStore() {
  let   currentState = {};
  const getState    = () => currentState,
        middlewares = [thunk],
        store       = configureStore(middlewares)(getState);

  setStore(store);
  spyOn(store, 'dispatch').and.callThrough();
  return store;
}

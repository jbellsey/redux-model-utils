import configureStore from 'redux-mock-store';
import {setStore} from '../../src/store';
import thunk from 'redux-thunk';

//----------
// store helper. designed specifically to support a single model built with redux-model-utils
//

export default function mockStore(model) {
  let currentState = {},
      {name: modelName} = model;
  const getState        = () => currentState,
        getModelState   = () => currentState[modelName],
        modelDispatcher = model => () => next => action => {
          currentState = {[modelName]: model.reducer(currentState[modelName], action)};
          return next(action);
        },
        modelMiddleware = [modelDispatcher(model)],
        middlewares     = modelMiddleware.concat(thunk),
        store           = configureStore(middlewares)(getState);

  setStore(store);
  spyOn(store, 'dispatch').and.callThrough();
  currentState = {[modelName]: model.reducer()};
  store.getModelState = getModelState;
  return store;
}

export function mockModelFreeStore() {
  let   currentState = {};
  const getState    = () => currentState,
        middlewares = [thunk],
        store       = configureStore(middlewares)(getState);

  setStore(store);
  spyOn(store, 'dispatch').and.callThrough();
  return store;
}

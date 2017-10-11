//---- store management
//
// several of our modules need access to the main store.
// users must call setStore() immediately after creating the store.
//

let store;

/*
    takes an array of models, and builds a map of reducers for passing
    to combineReducers(). for example:

        let models        = [require('./models/geo'), require('./models/reddit')],
            reducerMap    = buildReducerMap(models),
            masterReducer = redux.combineReducers(reducerMap),
            masterStore   = createStoreWithMiddleware(masterReducer);

    the result is an object like this:

        reducerMap = {
            'geo':    geo.reducer,
            'reddit': reddit.reducer
        }

    see [model.js] as well, where we modify the model's selectors to account
    for how stores are now one level deeper.
*/
export function buildReducerMap(modelArray) {
  return (modelArray || []).reduce((map, model) => {
    map[model.name] = model.reducer;
    return map;
  }, {});
}

export function getStore() {
  return store;
}

export function setStore(s) {
  store = s;
}

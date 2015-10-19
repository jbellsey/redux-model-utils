//---- store management
//
// several modules need access to the main store.
// so users must call setStore() before running any actions;
// ideally, immediately after creating the store.
//

var store;

// takes an array of models, and builds a map of reducers for passing
// to combineReducers(). for example:
//
//      var models        = [require('./models/geo'), require('./models/reddit')],
//          reducerMap    = buildReducerMap(models),
//          masterReducer = redux.combineReducers(reducerMap),
//          masterStore   = createStoreWithMiddleware(masterReducer);
//
function buildReducerMap(modelArray) {
    return modelArray.reduce((obj, model) => {
        obj[model.name] = model.reducer;
        return obj;
    }, {});
}

module.exports = {

    buildReducerMap,

    setStore: (s) => store = s,
    getStore: ()  => store
};

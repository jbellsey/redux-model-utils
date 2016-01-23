"use strict";

//---- store management
//
// several of our modules need access to the main store.
// users must call setStore() immediately after creating the store.
//

var store;

/*
    takes an array of models, and builds a map of reducers for passing
    to combineReducers(). for example:

        var models        = [require('./models/geo'), require('./models/reddit')],
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
function buildReducerMap(modelArray) {
    return (modelArray || []).reduce(function (map, model) {
        map[model.name] = model.reducer;
        return map;
    }, {});
}

module.exports = {

    buildReducerMap: buildReducerMap,

    setStore: function setStore(s) {
        return store = s;
    },
    getStore: function getStore() {
        return store;
    }
};
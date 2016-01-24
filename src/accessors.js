var object = require('./object'),
    store  = require('./store');

// create direct getters for accessing the underlying model: "model.data.property"
// one accessor is created for each selector in your list (and with the same name)
// we also create a top-level accessor "model.allData" to retrieve the full state.
//
function buildAccessors(model) {

    let data = {};

    Object.keys(model.selectors).forEach(key => {
        Object.defineProperty(data, key, {
            get: () => object.lookup(store.getStore().getState(), model.selectors[key])
        });
    });
    model.data = data;

    Object.defineProperty(model, 'allData', {
        get: () => object.clone(store.getStore().getState()[model.name])
    });
}

module.exports = {
    buildAccessors,
    publicAPI: {}   // no public exports
};

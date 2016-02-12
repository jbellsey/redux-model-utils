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
            get: () => {
                let state = store.getStore().getState();
                return object.lookup(state, model.selectors[key]);
            }
        });
    });
    model.data = data;

    Object.defineProperty(model, 'allData', {
        get: () => {
            let state = store.getStore().getState();
            if (typeof state[model.name] === 'object')
                state = state[model.name];
            return object.clone(state);
        }
    });
}

module.exports = {
    buildAccessors,
    publicAPI: {}   // no public exports
};

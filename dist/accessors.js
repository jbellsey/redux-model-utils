'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var lookup = require('./lookup'),
    store = require('./store');

// create direct getters for accessing the underlying model: "model.data.property"
// one accessor is created for each selector in your list (and with the same name)
// we also create a top-level accessor "model.allData" to retrieve the full state.
//
function buildAccessors(model) {

    var data = {};

    Object.keys(model.selectors).forEach(function (key) {
        Object.defineProperty(data, key, {
            get: function get() {
                var state = store.getStore().getState();
                return lookup(state, model.selectors[key]);
            }
        });
    });
    model.data = data;

    Object.defineProperty(model, 'allData', {
        get: function get() {
            var state = store.getStore().getState();
            if (_typeof(state[model.name]) === 'object') state = state[model.name];
            return state;
        }
    });
}

module.exports = {
    buildAccessors: buildAccessors,
    publicAPI: {} // no public exports
};
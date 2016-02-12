'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var deepAssign = require('deep-assign'),
    lookup = require('./object').lookup;

// builds a function that returns a new map of selectors.
// the new map is scoped to the model name. used for setting
// up react-redux
//
function externalizeSelectors(selectors, modelName) {

    return function (state) {

        return Object.keys(selectors).reduce(function (map, sel) {

            var thisSelector = selectors[sel],
                val,
                subState;

            if (typeof thisSelector === 'function') {
                subState = state[modelName];
                val = thisSelector((typeof subState === 'undefined' ? 'undefined' : _typeof(subState)) === 'object' ? subState : state);
            } else if (typeof thisSelector === 'string') {
                subState = state[modelName];
                val = lookup((typeof subState === 'undefined' ? 'undefined' : _typeof(subState)) === 'object' ? subState : state, thisSelector);
            }
            map[sel] = val;

            return map;
        }, {});
    };
}

function reactify(model) {

    // the default map of selectors to props
    model.reactSelectors = externalizeSelectors(model.selectors || {}, model.name);

    // the user can request additional maps be created. each key in the "propsMap"
    // field on the model is converted into a new set of reactSelectors:
    //
    //  model.propsMaps = {key:selectors}
    //
    model.propsMaps = Object.keys(model.propsMaps || {}).reduce(function (newPropsMaps, oneMapName) {
        newPropsMaps[oneMapName] = externalizeSelectors(model.propsMaps[oneMapName], model.name);
        return newPropsMaps;
    }, {});
}

// merge the reactSelectors from multiple models for use in a single connected component.
// duplicate keys will be last-in priority. accepts a list of either models or reactified maps.
//
function mergeReactSelectors() {
    for (var _len = arguments.length, objects = Array(_len), _key = 0; _key < _len; _key++) {
        objects[_key] = arguments[_key];
    }

    return function (state) {

        var props = {};
        (objects || []).forEach(function (oneObject) {

            // is it a model? then pull its already-prepared reactSelectors.
            // otherwise, it's a propsMap that has already been reactified
            if (oneObject._magic_rmu) oneObject = oneObject.reactSelectors(state);

            deepAssign(props, oneObject);
        });
        return props;
    };
}

module.exports = {

    // these exports are only available inside this library
    reactify: reactify,

    // and these are visible to consumers
    publicAPI: {
        mergeReactSelectors: mergeReactSelectors
    }
};
var deepAssign = require('deep-assign'),
    lookup     = require('./object').lookup;

// builds a function that returns a new map of selectors.
// the new map is scoped to the model name. used for setting
// up react-redux
//
function externalizeSelectors(selectors, modelName) {

    return state => {

        return Object.keys(selectors).reduce((map, sel) => {

            let thisSelector = selectors[sel];

            if (typeof thisSelector === 'function')
                map[sel] = thisSelector(state[modelName]);
            else if (typeof thisSelector === 'string')
                map[sel] = lookup(state, `${modelName}.${thisSelector}`);

            return map;
        }, {});
    };
}

function reactify(model) {
    model.reactSelectors = externalizeSelectors(model.selectors || {}, model.name);
}

// merge the reactSelectors from multiple models for use in a single connected component.
// duplicate keys will be last-in priority
//
function mergeReactSelectors(...models) {

    return state => {

        let props = {};
        (models || []).forEach(model => deepAssign(props, model.reactSelectors(state)));
        return props;
    };
}

module.exports = {

    // these exports are only available inside this library
    reactify,

    // and these are visible to consumers
    publicAPI: {
        mergeReactSelectors
    }
};
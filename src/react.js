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

    // the default map of selectors to props
    model.reactSelectors = externalizeSelectors(model.selectors || {}, model.name);

    // the user can request additional maps be created. each key in the "propsMap"
    // field on the model is converted into a new set of reactSelectors:
    //
    //  model.propsMaps = {key:selectors}
    //
    model.propsMaps = Object.keys(model.propsMaps || {}).reduce((newPropsMaps, oneMapName) => {
        newPropsMaps[oneMapName] = externalizeSelectors(model.propsMaps[oneMapName], model.name);
        return newPropsMaps;
    }, {});
}

// merge the reactSelectors from multiple models for use in a single connected component.
// duplicate keys will be last-in priority. accepts a list of either models or reactified maps.
//
function mergeReactSelectors(...objects) {

    return state => {

        let props = {};
        (objects || []).forEach(oneObject => {

            // is it a model? then pull its already-prepared reactSelectors.
            // otherwise, it's a propsMap that has already been reactified
            if (oneObject._magic_rmu)
                oneObject = oneObject.reactSelectors(state);

            deepAssign(props, oneObject);
        });
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
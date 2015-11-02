// builds a function that returns a new map of selectors.
// the new map is scoped to the model name. used for setting
// up react-redux
//
function externalizeSelectors(selectors, modelName) {

    return state => {

        return Object.keys(selectors).reduce((map, sel) => {

            // TODO: accepts FUNCTION selectors ONLY (for now)
            //
            if (typeof selectors[sel] !== 'function')
                throw new Error('react-utils: When using React, your selectors must be functions');

            map[sel] = selectors[sel](state[modelName]);
            return map;
        }, {});
    };
}

function reactify(model) {

    model.reactSelectors = externalizeSelectors(model.selectors || {}, model.name);
    model.newID = () => `${model.name}-${++id}`;
}

module.exports = {

    // this is only available inside the library
    reactify,

    // no public exports
    publicAPI: {}
};
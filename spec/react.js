var RU    = require('../src/index'),
    store = require('./_store');

describe('REACT module:', () => {

    var initial  = {
            userID: 0,
            prefs: {
                color: 'red',
                size: 'large'
            }
        },
        modelName = 'react-model',
        modelSeed = {
            name: modelName,
            actions: {},
            initialState: RU.clone(initial),
            selectors: {
                // string selectors
                color: 'prefs.color',
                size: 'prefs.size',

                // function selector to build a custom prop
                custom: (state) => state.prefs.color + '~' + state.prefs.size
            },
            reducer: state => state
        },
        model = RU.modelBuilder(modelSeed);

    it('builds reactSelectors correctly', () => {

        // build a state object, set up as a sub-model {model:data, model:data}
        let state = {};
        state[modelName] = RU.clone(initial);

        // we should get SOMETHING for react selectors, at least
        expect(model.reactSelectors).not.toBeUndefined();

        // run @connect on the selectors; it should map to usable props
        let connectedSelectors = model.reactSelectors(state);
        expect(connectedSelectors.color).toBe('red');

        // test a custom prop function. user can do pretty much any maniuplation
        // of state in a selector function
        expect(connectedSelectors.custom).toBe('red~large');
    });

    // TODO: test mergeReactSelectors
});

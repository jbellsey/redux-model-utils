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
            },
            reducer: state => state
        };

    it('builds reactSelectors correctly', () => {

        // build a state object, set up as a sub-model {model:data, model:data}
        let modelDupe = RU.clone(modelSeed),
            state = {};
        state[modelName] = RU.clone(initial);

        // custom selector to build a custom prop (we do this after CLONE, so it doesn't leak to other tests)
        modelDupe.selectors.custom = (state) => state.prefs.color + '~' + state.prefs.size;
        let model = RU.modelBuilder(modelDupe);

        // we should get SOMETHING for react selectors, at least
        expect(model.reactSelectors).not.toBeUndefined();

        // run @connect on the selectors; it should map to usable props
        let connectedSelectors = model.reactSelectors(state);
        expect(connectedSelectors.color).toBe('red');

        // test a custom prop function. user can do pretty much any maniuplation
        // of state in a selector function
        expect(connectedSelectors.custom).toBe('red~large');
    });

    it('builds custom react props maps correctly', () => {

        // make a custom set of selectors
        let customSelectors = {
                firstLetterOfColor: state => state.prefs.color.charAt(0)
            },
            modelDupe = RU.clone(modelSeed);

        // attach the custom selectors as propsMaps
        modelDupe.propsMaps = {
            firstOnly: customSelectors
        };

        // build a model & state object, set up as a sub-model {model:data, model:data}
        let model = RU.modelBuilder(modelDupe),
            state = {};
        state[modelName] = RU.clone(initial);

        // double-check our main reactSelectors (same test as above)
        let connectedSelectors = model.reactSelectors(state);
        expect(connectedSelectors.color).toBe('red');

        // now test the custom props map
        let customSelectorMap = model.propsMaps.firstOnly(state);
        expect(customSelectorMap.firstLetterOfColor).toBe('r');
    });

    // TODO: test mergeReactSelectors
});

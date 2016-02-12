var RU    = require('../src/index'),
    store = require('./_store');

describe('MODEL module:', () => {

    var seed = {
            name: 'test-model',
            actionMap: {},
            initialState: {},
            selectors: {}
        };

    it('refuses to create models with the same name', () => {

        var setup = () => {
            RU.modelBuilder(seed);
            RU.modelBuilder(seed);
        };
        expect(setup).toThrow();
    });
});

describe('DATA ACCESSORS module:', () => {

    var initial  = {
            userID: 0,
            prefs: {
                color: 'red',
                size: 'large'
            }
        },
        modelSeed = {
            name: 'accessors-model',
            actionMap: {},
            initialState: RU.clone(initial),
            selectors: {
                color: 'prefs.color',
                size: 'prefs.size'
            }
        },
        model = RU.modelBuilder(modelSeed);

    it('creates and handles data accessors for string-selectors and function-selectors', () => {

        // TODO: more tests
        var mockStore = store.resetStore(model, null, 0);
        mockStore.forceFullScope(true);
        expect(model.data.color).toBe('red');
    });
});

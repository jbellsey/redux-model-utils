var RU    = require('../src/index'),
    store = require('./_store');

describe('DATA ACCESSORS module:', () => {

    var initial  = {
            userID: 0,
            prefs: {
                color: 'red',
                size: 'large'
            }
        },
        modelSeed = {
            name: 'test-model',
            actionMap: {},
            initialState: RU.clone(initial),
            selectors: {
                color: 'prefs.color',
                size: 'prefs.size'
            }
        },
        model = RU.modelBuilder(modelSeed);

    it('creates and handles data accessors for string-selectors and function-selectors', () => {

        var mockStore = store.resetStore(model, null, 0);

        let oldScope = mockStore.forceFullScope(true);
        expect(model.data.color).toBe('red');
        mockStore.forceFullScope(oldScope);
    });
});

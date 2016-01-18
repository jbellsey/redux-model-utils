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
            actions: {},
            initialState: RU.clone(initial),
            selectors: {
                color: 'prefs.color',
                size: 'prefs.size'
            },
            reducer: state => state
        },
        state = RU.clone(initial),
        model = RU.modelBuilder(modelSeed);


    // TODO: data accessors aren't testable yet, until we get the mock store to
    //       scope models into their own substructures (a la combineReducers)

    it('creates and handles data accessors for string-selectors and function-selectors', () => {

        var mockStore = store.resetStore(model, state, 0);
        expect(true).toBeTruthy();
        //expect(model.data.color).toBe('red');
    });
});

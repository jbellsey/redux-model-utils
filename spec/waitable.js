var RU    = require('../src/index'),
    store = require('./_store');

describe('WAITABLE module:', () => {

    var initial  = {
            userID: 0,
            prefs: {
                color: 'red',
                size: 'large'
            }
        },
        counter   = 0,
        modelSeed = {
            options: {
                waitable: true
            },
            reducer,
            actions:   {
                setColor: RU.makeActionCreator('setColor', 'col')
            },
            selectors: {}
        },
        model;

    function reducer(state, action = {}) {
        if (!state)
            state = RU.clone(initial);
        if (action.type === 'setColor')
            return RU.cloneAndAssign(state, 'prefs.color', action.col);
        return state;
    }

    beforeEach(() => {
        modelSeed.name = `wait-model-${counter++}`;
        model = RU.modelBuilder(RU.clone(modelSeed));
    });

    it('installs new actions and selectors', () => {

        expect(model.actions.wait).not.toBeUndefined();
        expect(model.actions.stopWaiting).not.toBeUndefined();
        expect(model.selectors.waiting).not.toBeUndefined();
    });

    it('properly runs the wait action, setting the "waiting" flag', () => {

        var mockStore = store.resetStore(model, null, 1);

        model.actions.wait();
        expect(mockStore.getState(model).waiting).toBeTruthy();
    });

    it('properly runs the stopWaiting action, UNsetting the "waiting" flag', () => {

        var mockStore = store.resetStore(model, null, 2);

        model.actions.wait();
        expect(mockStore.getState(model).waiting).toBeTruthy();
        model.actions.stopWaiting();
        expect(mockStore.getState(model).waiting).toBeFalsy();
    });
});
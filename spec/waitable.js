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
        modelSeed = {
            name: 'test-model',
            options: {
                waitable: true
            },
            reducer,
            actions:   {},
            selectors: {}
        },
        state, model;

    function reducer(state = initial, action = {}) {

        switch (action.type) {
            case 'setColor':
                return RU.cloneAndAssign(state, 'prefs.color', action.col);

            default:
                return state;
        }
    }

    beforeEach(() => {
        state = RU.clone(initial);
        model = RU.modelBuilder(RU.clone(modelSeed));
    });

    it('installs new actions and selectors', () => {

        expect(model.actions.wait).not.toBeUndefined();
        expect(model.actions.stopWaiting).not.toBeUndefined();
        expect(model.selectors.waiting).not.toBeUndefined();
    });

    it('properly runs the wait action, setting the "waiting" flag', () => {

        var mockStore = store.resetStore(model, state, 1);

        model.actions.wait();
        expect(mockStore.getState().waiting).toBeTruthy();
    });

    it('properly runs the stopWaiting action, UNsetting the "waiting" flag', () => {

        var mockStore = store.resetStore(model, state, 2);

        model.actions.wait();
        expect(mockStore.getState().waiting).toBeTruthy();
        model.actions.stopWaiting();
        expect(mockStore.getState().waiting).toBeFalsy();
    });

    it('lets other actions pass through to the original reducer', () => {

        var mockStore = store.resetStore(model, state, 2),
            setColor = RU.makeActionCreator('setColor', 'col'),
            finalState;

        model.actions.wait();
        setColor('green');

        finalState = mockStore.getState();
        expect(finalState.waiting).toBeTruthy();
        expect(finalState.prefs.color).toBe('green');
    });
});
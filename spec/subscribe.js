var RU    = require('../src/index'),
    store = require('./_store');

describe('SUBSCRIBE module:', () => {

        var setColor = RU.makeActionCreator('setColor', 'col'),
            initial  = {
                userID: 0,
                prefs: {
                    color: 'red',
                    size: 'large'
                }
            },
            state;

        beforeEach(() => state = RU.clone(initial));

        function reducer(state = initial, action = {}) {

            switch (action.type) {
                case 'setColor':
                    return RU.cloneAndAssign(state, 'prefs.color', action.col);

                default:
                    return state;
            }
        }

    //-----------

    it('runs a basic reducer properly', () => {

        var expected  = [{ type:'setColor', col:'green' }],
            mockStore = store.resetStore(reducer, state, expected, () => {
                var state = mockStore.getState();
                expect(state.prefs.color).toBe('green');
                expect(state.prefs.size).toBe('large');
            });

        setColor('green');
    });

    //-----------

    it('runs a raw subscriber properly (not using our wrapper)', () => {

        var expected  = [{ type:'setColor', col:'yellow' }],
            mockStore = store.resetStore(reducer, state, expected, () => {
                var state = mockStore.getState();
                expect(state.prefs.color).toBe('yellow');
            }),
            invocationCount = 0,
            subscriber = () => ++invocationCount;

        mockStore.subscribe(subscriber);
        setColor('yellow');
        expect(invocationCount).toBe(1);    // only called dispatch once
    });

    it('runs our custom subscriber properly', () => {

        var expected  = [{ type:'setColor', col:'gray' }],
            mockStore = store.resetStore(reducer, state, expected, () => {
                var state = mockStore.getState();
                expect(state.prefs.color).toBe('gray');
            }),
            invocationCount = 0;

        RU.subscribe('prefs.color', () => ++invocationCount);
        setColor('gray');
        expect(invocationCount).toBe(2);    // one extra for initialization
    });

    it('runs properly with a function selector', () => {

        var expected  = [{ type:'setColor', col:'teal' }],
            mockStore = store.resetStore(reducer, state, expected, () => {
                var state = mockStore.getState();
                expect(state.prefs.color).toBe('teal');
            }),
            selector  = state => state.prefs.color,
            invocationCount = 0;

        RU.subscribe(selector, () => ++invocationCount);
        setColor('teal');
        expect(invocationCount).toBe(2);    // one extra for initialization
    });

    it('respects "noInit" flag', () => {

        var expected  = [{ type:'setColor', col:'purple' }],
            mockStore = store.resetStore(reducer, state, expected, () => {
                var state = mockStore.getState();
                expect(state.prefs.color).toBe('purple');
            }),
            invocationCount = 0;

        RU.subscribe('prefs.color', () => ++invocationCount, {noInit:1});
        setColor('purple');
        expect(invocationCount).toBe(1);    // !
    });

    it('receives the correct value', () => {

        var expected  = [{ type:'setColor', col:'mint' }],
            mockStore = store.resetStore(reducer, state, expected, () => {
                var state = mockStore.getState();
                expect(state.prefs.color).toBe('mint');
            });

        RU.subscribe('prefs.color', newColor => expect(newColor).toBe('mint'), {noInit:1});
        setColor('mint');
    });


    it('is only invoked when the specific property changes', () => {

        var oneAction = { type:'setColor', col:'pink' },
            expected  = [oneAction, oneAction, oneAction],
            mockStore = store.resetStore(reducer, state, expected, () => {
                var state = mockStore.getState();
                expect(state.prefs.color).toBe('pink');
            }),
            sizeInvocations = 0,
            colorInvocations = 0;

        RU.subscribe('prefs.size',  () => ++sizeInvocations);
        RU.subscribe('prefs.color', () => ++colorInvocations);
        setColor('pink');
        setColor('pink');
        setColor('pink');
        expect(sizeInvocations).toBe(1);     // ! (one for init)
        expect(colorInvocations).toBe(2);    // ! (one for init, and one for all the changes)
    });

});
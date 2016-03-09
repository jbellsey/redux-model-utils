var assignDeep  = require('assign-deep'),
    clone       = require('clone'),
    RU          = require('../src/index'),
    store       = require('./_store');

describe('SUBSCRIBE module:', () => {

        var setColor = RU.makeActionCreator('setColor', 'col'),
            counter  = 0,
            initial  = {
                userID: 0,
                prefs: {
                    color: 'red',
                    size: 'large'
                }
            },
            selectors = {
                color: 'prefs.color',
                size: 'prefs.size',
                colorFnc: state => state.prefs.color
            },
            reducer = (state, action = {}) => {

                if (!state)
                    state = clone(initial);

                switch (action.type) {
                    case 'setColor':
                        return assignDeep({}, state, {prefs: {color: action.col}});

                    default:
                        return state;
                }
            },
            modelSeed = {
                actions: {},
                selectors: selectors,
                reducer
            },
            model;

        beforeEach(() => {
            modelSeed.name = `subscribe-model-${counter++}`;
            model = RU.modelBuilder(clone(modelSeed));
        });

    //-----------

    it('runs a basic reducer properly', () => {

        var expected  = [{ type:'setColor', col:'green' }],
            mockStore = store.resetStore(model, null, expected, () => {
                var state = mockStore.getState(model);
                expect(state.prefs.color).toBe('green');
                expect(state.prefs.size).toBe('large');
            });

        setColor('green');
    });

    //-----------

    it('runs a raw subscriber properly (not using our wrapper)', () => {

        var expected  = [{ type:'setColor', col:'yellow' }],
            mockStore = store.resetStore(model, null, expected, () => {
                var state = mockStore.getState(model);
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
            mockStore = store.resetStore(model, null, expected, () => {
                var state = mockStore.getState(model);
                expect(state.prefs.color).toBe('gray');
            }),
            invocationCount = 0;

        RU.subscribe('prefs.color', () => ++invocationCount);
        setColor('gray');
        expect(invocationCount).toBe(1);
    });

    it('runs properly with a function selector', () => {

        var expected  = [{ type:'setColor', col:'teal' }],
            mockStore = store.resetStore(model, null, expected, () => {
                var state = mockStore.getState(model);
                expect(state.prefs.color).toBe('teal');
            }),
            invocationCount = 0;

        RU.subscribe(model.selectors.colorFnc, () => ++invocationCount);
        setColor('teal');
        expect(invocationCount).toBe(2);
    });

    it('respects "noInit" flag', () => {

        var expected  = [{ type:'setColor', col:'purple' }],
            mockStore = store.resetStore(model, null, expected, () => {
                var state = mockStore.getState(model);
                expect(state.prefs.color).toBe('purple');
            }),
            invocationCount = 0;

        RU.subscribe('prefs.color', () => ++invocationCount, {noInit:1});
        setColor('purple');
        expect(invocationCount).toBe(0);
    });

    it('receives the correct value', () => {

        var expected  = [{ type:'setColor', col:'mint' }],
            mockStore = store.resetStore(model, null, expected, () => {
                var state = mockStore.getState(model);
                expect(state.prefs.color).toBe('mint');
            });

        RU.subscribe('prefs.color', newColor => expect(newColor).toBe('mint'), {noInit:1});
        setColor('mint');
    });


    it('is only invoked when the specific property changes', () => {

        var oneAction = { type:'setColor', col:'pink' },
            expected  = [oneAction, oneAction, oneAction],
            mockStore = store.resetStore(model, null, expected, () => {
                var state = mockStore.getState(model);
                expect(state.prefs.color).toBe('pink');
            }),
            sizeInvocations = 0,
            colorInvocations = 0;

        RU.subscribe('prefs.size',  () => ++sizeInvocations);
        RU.subscribe('prefs.color', () => ++colorInvocations);
        setColor('pink');
        setColor('pink');
        setColor('pink');
        expect(sizeInvocations).toBe(1);
        expect(colorInvocations).toBe(1);
    });


    it('runs custom equality tests', () => {

        var mockStore = store.resetStore(model),
            invokeCt = 0;

        RU.subscribe(
            model.name + '.prefs',
            newPrefs => {
                ++invokeCt;
                expect(newPrefs.color).toEqual('bone');
            },
            {
                equals: (oldPrefs, newPrefs) => (oldPrefs && oldPrefs.color) === (newPrefs && newPrefs.color),
                noInit: true
            }
        );

        setColor('bone');
        expect(invokeCt).toEqual(1);
        expect(mockStore.getState(model).prefs.color).toEqual('bone');
    });
});
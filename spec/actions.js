var clone       = require('clone'),
    assignDeep  = require('assign-deep'),
    RU          = require('../src/index'),
    store       = require('./_store'),
    mockStore;

describe('ACTIONS module:', () => {

    //-----------

    it('makes action creators', () => {

        var expected  = [{ type:'incr', value:4 }],
            incr      = RU.makeActionCreator('incr', 'value');

        mockStore = store.resetStore(null, {}, expected);

        incr(4);    // triggers an expect inside the dispatch mock
        expect(mockStore.dispatch).toHaveBeenCalled();
    });

    //-----------

    it('properly runs async action creators', done => {

        var expected = [
                {type:'startOperation'},
                {type:'finishOperation', results:111}
            ],
            start    = RU.makeActionCreator('startOperation'),
            finish   = RU.makeActionCreator('finishOperation', 'results'),
            fetcher  = RU.makeAsyncAction(args => {

                expect(args.userID).toBe(99);

                // run a synchronous action
                start();

                // do the actual work
                setTimeout(() => {

                    // run another synchronous action
                    finish(111);
                    done();
                }, 1);
            }, 'userID');

        mockStore = store.resetStore(null, {}, expected);

        fetcher(99);    // triggers an expect inside the dispatch mock
        expect(mockStore.dispatch).toHaveBeenCalled();
        expect(mockStore.dispatch.calls.count()).toEqual(2);
    });

});

describe('ACTION MAP module:', () => {

    var initial  = {
            userID: 0,
            prefs: {
                color: 'red',
                size: 'large'
            }
        },
        selectors = {
            color: 'prefs.color',
            size: 'prefs.size'
        },
        counter = 0,
        modelSeed = {
            actionMap: {
                makeBlue: {
                    reducer: state => assignDeep({}, state, {prefs: {color: 'blue'}})
                },
                makeAnyColor: {
                    params: 'color',
                    reducer: (state, action) => assignDeep({}, state, {prefs: {color: action.color}})
                },
                changeColorAndSize: {
                    params: ['color', 'size'],
                    reducer: (state, action) => assignDeep({}, state, {prefs: {color: action.color, size: action.size}})
                },
                timer100: {
                    async: () => new Promise(resolve => setTimeout(resolve, 10))
                },
                privateAction: {
                    private: true,
                    reducer: state => assignDeep({}, state, {prefs: {color: 'peacock'}})
                },
                anotherPrivateAction: {
                    private: true,
                    reducer: state => assignDeep({}, state, {prefs: {color: 'sandstone'}})
                },
                privateAsync: {
                    private: true,
                    async: () => new Promise(resolve => setTimeout(resolve, 10))
                }
            },
            initialState: initial,
            selectors: selectors
        },
        model;

    describe('parses an action map and:', () => {

        beforeEach(() => {
            modelSeed.name = `test-model-${counter++}`;
            model = RU.modelBuilder(clone(modelSeed));
            mockStore = store.resetStore(model);
        });

        it('runs with no params', () => {
            model.actions.makeBlue();
            expect(mockStore.getState(model).prefs.color).toBe('blue');
        });

        it('runs with a single param', () => {
            model.actions.makeAnyColor('green');
            expect(mockStore.getState(model).prefs.color).toBe('green');
        });

        it('runs an [array of params]', () => {
            model.actions.changeColorAndSize('purple', 'tiny');
            expect(mockStore.getState(model).prefs.color).toBe('purple');
            expect(mockStore.getState(model).prefs.size).toBe('tiny');
        });

        it('runs an async action', done => {
            model.actions.timer100().then(done);
        });

        it('keeps private actions separate', () => {
            expect(model.actions.privateAction).not.toBeDefined();
            expect(model.privateActions.privateAction).toBeDefined();
        });

        it('runs private actions properly', done => {
            model.privateActions.privateAction();
            expect(mockStore.getState(model).prefs.color).toBe('peacock');
            model.privateActions.privateAsync().then(done);
        });

        it('allows privateActions object to be severed from the model', () => {
            var trulyPrivate = model.severPrivateActions();

            // should be disconnected
            expect(model.privateActions).toBeNull();

            // should run when called from our truly private object
            trulyPrivate.anotherPrivateAction();
            expect(mockStore.getState(model).prefs.color).toBe('sandstone');
        });
    });
});

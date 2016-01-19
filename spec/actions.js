var RU    = require('../src/index'),
    store = require('./_store');

describe('ACTIONS module:', () => {


    //-----------

    it('makes action creators', () => {

        var expected  = [{ type:'incr', value:4 }],
            incr      = RU.makeActionCreator('incr', 'value'),
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
            }, 'userID'),
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
        modelSeed = {
            name: 'test-model',
            actionMap: {
                makeBlue: {
                    code: 'BLUE',
                    reducer: state => RU.cloneAndAssign(state, 'prefs.color', 'blue')
                },
                makeAnyColor: {
                    code: 'ANY',
                    params: 'color',
                    reducer: (state, action) => RU.cloneAndAssign(state, 'prefs.color', action.color)
                },
                changeColorAndSize: {
                    code: 'ColorAndSize',
                    params: ['color', 'size'],
                    reducer: (state, action) => {
                        var s = RU.clone(state);
                        s.prefs.color = action.color;
                        s.prefs.size  = action.size;
                        return s;
                    }
                },
                timer1000: {
                    async: () => new Promise(resolve => setTimeout(resolve, 1000))
                }
            },
            initialState: initial,
            selectors: selectors
        },
        state, model;

    var prep = () => {
        state = RU.clone(initial);
        model = RU.modelBuilder(modelSeed);
    };

    it('parses an action map and runs basic actions', done => {

        prep();
        var mockStore = store.resetStore(model, state, 4);

        // runs with no params
        model.actions.makeBlue();
        expect(mockStore.getState().prefs.color).toBe('blue');

        // runs with a single param
        model.actions.makeAnyColor('green');
        expect(mockStore.getState().prefs.color).toBe('green');

        // runs an [array of params]
        model.actions.changeColorAndSize('purple', 'tiny');
        expect(mockStore.getState().prefs.color).toBe('purple');
        expect(mockStore.getState().prefs.size).toBe('tiny');

        // async
        model.actions.timer1000().then(done)
    });

});
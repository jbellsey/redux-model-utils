var RU    = require('../src/index'),
    store = require('./_store');

describe('ACTIONS module:', () => {


    //-----------

    it('properly makes code objects', () => {

        var strings = ['blue', 'red'],
            codes = RU.makeCodes(strings);
        expect(codes.blue).toBe('blue');
    });

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
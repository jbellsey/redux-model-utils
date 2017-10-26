import clone from 'clone';
import mockStore, {mockModelFreeStore} from './support/mock-store';
import {makeActionCreator, makeAsyncAction} from '../src/actions';
import {modelBuilder} from '../src/model';
import {tick} from './support/utils';

describe('ACTIONS module:', () => {

  //-----------

  it('makes action creators', () => {

    let incr  = makeActionCreator('incr', 'value'),
        store = mockModelFreeStore();

    incr(4);    // triggers an expect inside the dispatch mock
    expect(store.dispatch).toHaveBeenCalled();
  });

  //-----------

  it('properly runs async action creators', done => {

    let start   = makeActionCreator('startOperation'),
        finish  = makeActionCreator('finishOperation', 'results'),
        status  = 0,
        fetcher = makeAsyncAction(args => {

          expect(args.userID).toBe(99);
          status = 1;

          // run a synchronous action
          start();
          status = 2;

          // do the actual work. normally we'd return a promise directly;
          // here we patch the promise with a magic value to test against
          let retVal = tick()
            .then(() => {
              // run another synchronous action
              status = 3;
              finish(111);
              done();
            });
          retVal.character = 'goofy';
          return retVal;
        }, 'userID'),
        store   = mockModelFreeStore();

    let returnVal = fetcher(99);    // triggers an expect inside the dispatch mock
    expect(store.dispatch).toHaveBeenCalled();
    expect(store.dispatch.calls.count()).toEqual(2);
    expect(status).toEqual(2);  // should have reached the first action, but not the timeout
    expect(returnVal.character).toEqual('goofy');     // the async action passes back the return value
  });

});

describe('ACTION MAP module:', () => {

  let initial   = {
        userID: 0,
        prefs:  {
          color: 'red',
          size:  'large'
        }
      },
      selectors = {
        color:    'prefs.color',
        size:     'prefs.size',
        colorFnc: state => state.prefs.color
      },
      counter   = 0,
      modelSeed = {
        actionMap: {
          makeBlue: {
            reducer: state => ({...state, prefs: {color: 'blue'}})
          },
          makeAnyColor: {
            params:  'color',
            reducer: (state, {color}) => ({...state, prefs: {color}})
          },
          changeColorAndSize: {
            params:  ['color', 'size'],
            reducer: (state, {color, size}) => ({...state, prefs: {color, size}})
          },
          timer100: {
            async: () => tick(10)
          },
          timer100_thunk: {
            thunk: () => tick(10)
          },
          privateAction: {
            private: true,
            reducer: state => ({...state, prefs: {color: 'peacock'}})
          },
          anotherPrivateAction: {
            private: true,
            reducer: state => ({...state, prefs: {color: 'sandstone'}})
          },
          privateAsync:         {
            private: true,
            async:   () => tick(10)
          }
        },
        initialState: initial,
        selectors:    selectors
      },
      model;

  describe('parses an action map and:', () => {

    let store;

    beforeEach(() => {
      modelSeed.name = `test-model-${counter++}`;
      model = modelBuilder(clone(modelSeed));
      store = mockStore(model);
    });

    it('runs with no params', () => {
      model.actions.makeBlue();
      expect(store.getModelState().prefs.color).toBe('blue');
    });

    it('runs with a single param', () => {
      model.actions.makeAnyColor('green');
      expect(store.getModelState().prefs.color).toBe('green');
    });

    it('runs an [array of params]', () => {
      model.actions.changeColorAndSize('purple', 'tiny');
      expect(store.getModelState().prefs.color).toBe('purple');
      expect(store.getModelState().prefs.size).toBe('tiny');
    });

    it('runs an async action', done => {
      model.actions.timer100().then(done);
    });

    it('runs an async action with the "thunk" option', done => {
      model.actions.timer100_thunk().then(done);
    });

    it('keeps private actions separate', () => {
      expect(model.actions.privateAction).not.toBeDefined();
      expect(model.privateActions.privateAction).toBeDefined();
    });

    it('runs private actions properly', done => {
      model.privateActions.privateAction();
      expect(store.getModelState().prefs.color).toBe('peacock');
      model.privateActions.privateAsync().then(done);
    });

    it('allows privateActions object to be severed from the model', () => {
      const trulyPrivateActions = model.severPrivateActions();

      // should be disconnected from the model
      expect(model.privateActions).toBeNull();

      // should run when called from our truly private object
      trulyPrivateActions.anotherPrivateAction();
      expect(store.getModelState().prefs.color).toBe('sandstone');
    });
  });
});

describe('NESTED actions', () => {
  let initial   = {
        userID: 0,
        workResult: 0,
        prefs:  {
          color: 'red',
          size:  'large'
        }
      },
      selectors = {
        color:    'prefs.color',
        size:     'prefs.size',
        colorFnc: state => state.prefs.color
      },
      modelSeed = {
        actionMap: {
          makeAnyColor: {
            params:  'color',
            reducer: (state, {color}) => ({...state, prefs: {color}})
          },
          timer100: {
            async: () => tick(10)
          },
          timer100_thunk: {
            thunk: () => tick(10)
          },
          color: {
            reddish: {
              reducer: state => ({...state, prefs: {color: 'reddish'}})
            },
            bluish: {
              reducer: state => ({...state, prefs: {color: 'bluish'}})
            },
            greenish: {
              private: true,
              reducer: state => ({...state, prefs: {color: 'greenish'}})
            }
          },
          save: {
            user: {
              // no state changing in this action. used to ensure that the promise
              // is returned correctly
              async: () => tick(10).then(() => ({name: 'john'}))
            },
            details: {
              // a typical async method which calls a private action
              params: 'id',
              async: () => tick(10).then(() =>{
                privateActions.save._storeUser(99)
              })
            },
            _storeUser: {
              // private nested action
              private: true,
              params: 'id',
              reducer: (state, {id}) => ({...state, userID: id})
            }
          },

          // this one has an action at the top level ("doWork"), as well as nested actions
          doWork: {
            async: () => tick(10).then(() =>{
              privateActions.doWork._storeWork(303)
            }),
            _storeWork: {
              private: true,
              params: 'val',
              reducer: (state, {val}) => ({...state, workResult: val})
            }
          }
        },
        initialState: initial,
        selectors:    selectors
      },
      model, store, privateActions;

  beforeEach(() => {
    modelSeed.name = 'nested';
    model = modelBuilder(clone(modelSeed));
    privateActions = model.severPrivateActions();
    store = mockStore(model);
  });

  it('should make a nested action map', done => {

    // top level actions should still work
    model.actions.makeAnyColor('charcoal');
    expect(store.getModelState().prefs.color).toBe('charcoal');

    // a few public nested actions
    model.actions.color.reddish();
    expect(store.getModelState().prefs.color).toBe('reddish');
    model.actions.color.bluish();
    expect(store.getModelState().prefs.color).toBe('bluish');

    // greenish is a private nested action
    expect(model.actions.color.greenish).toBe(undefined);
    privateActions.color.greenish();
    expect(store.getModelState().prefs.color).toBe('greenish');

    // async nested with a return value
    model.actions.save.user()
      .then(userData => {
        expect(userData.name).toBe('john');
      })
      // async nested, including a call to a private sub-action
      .then(() => model.actions.save.details())
      .then(() => {
        expect(store.getModelState().userID).toBe(99);
      })
      // nested, with an action at the top level of the nest
      .then(() => model.actions.doWork())
      .then(() => {
        expect(store.getModelState().workResult).toBe(303);
      })
      .then(done);
  });
});

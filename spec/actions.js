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
            actionType:    'catapult',
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

      // users should never access _rmu directly. this is an internal test only.
      expect(model._rmu.privateActions.privateAction).toBeDefined();
    });

    it('runs private actions properly', done => {
      model._rmu.privateActions.privateAction();
      expect(store.getModelState().prefs.color).toBe('peacock');
      model._rmu.privateActions.privateAsync().then(done);
    });

    it('allows privateActions object to be severed from the model', () => {
      const trulyPrivateActions = model.severPrivateActions();

      // should be disconnected from the model
      expect(model._rmu.privateActions).toBeNull();

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
              actionType: 'reddify',  // a manually assigned actionType. not shared yet.
              reducer:    state => ({...state, prefs: {color: 'reddish'}})
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

describe('SHARED ACTION TYPES & multiple models:', () => {

  let sharedCodes = {
        red:   'shared-red',
        blue:  'shared-blue',
        small: 'shared-small',
        XL:    'shared-XL'
      },
      M1 = {
        name:         'm1',
        initialState: {prefs: {color: 'gray', size: 'large'}},
        selectors:    {color: 'prefs.color', size: 'prefs.size'},
        actionMap:    {
          yellow: {
            reducer: state => ({...state, prefs: {color: 'yellow'}})
          },
          sharedRed: {
            actionType: sharedCodes.red,
            reducer:    state => ({...state, prefs: {color: 'red'}})
          },
          sharedBlue: {
            actionType: sharedCodes.blue,
            reducer:    state => ({...state, prefs: {color: 'blue'}})
          },
          // shared codes in nested actions
          size: {
            sharedSmall: {
              actionType: sharedCodes.small,
              reducer:    state => ({...state, prefs: {size: 'small'}})
            },
            // and a private action that uses a shared action type
            sharedXL: {
              private: true,
              actionType: sharedCodes.XL,
              reducer:    state => ({...state, prefs: {size: 'XL'}})
            }
          }
        }
      },
      M2 = {
        name:         'm2',
        initialState: {userData: {color: 'gray', size: 'large'}},
        selectors:    {color: 'userData.color', size: 'userData.size'},
        actionMap:    {
          purple: {
            reducer: state => ({...state, userData: {color: 'purple'}})
          },
          sharedRed: {
            actionType: sharedCodes.red,
            reducer:    state => ({...state, userData: {color: 'red'}})
          },
          sharedBlue: {
            actionType: sharedCodes.blue,
            reducer:    state => ({...state, userData: {color: 'blue'}})
          },
          // shared codes in nested actions
          size: {
            sharedSmall: {
              actionType: sharedCodes.small,
              reducer:    state => ({...state, userData: {size: 'small'}})
            },
            // this version of XL is not private
            sharedXL: {
              actionType: sharedCodes.XL,
              reducer:    state => ({...state, userData: {size: 'XL'}})
            }
          }
        }
      };

  describe('parses an action map and:', () => {

    let store, model1, model2,
        counter = 100;

    beforeEach(() => {
      ++counter;
      M1.name = `M1-${counter}`;
      M2.name = `M2-${counter}`;
      model1  = modelBuilder(clone(M1));
      model2  = modelBuilder(clone(M2));
      store   = mockStore([model1, model2]);
    });

    it('run independent actions independently', () => {

      model1.actions.yellow();
      expect(model1.data.color).toBe('yellow');
      expect(model2.data.color).toBe('gray');

      model2.actions.purple();
      expect(model1.data.color).toBe('yellow');
      expect(model2.data.color).toBe('purple');
    });

    it('allows multiple models to share an action type, and to respond to the same action type', () => {

      expect(model1.data.color).toBe('gray');
      expect(model2.data.color).toBe('gray');

      // one action, two models respond
      model1.actions.sharedRed();
      expect(model1.data.color).toBe('red');
      expect(model2.data.color).toBe('red');

      model2.actions.sharedBlue();
      expect(model1.data.color).toBe('blue');
      expect(model2.data.color).toBe('blue');
    });

    it('allows shared action types in nested and private actions', () => {

      expect(model1.data.size).toBe('large');
      expect(model2.data.size).toBe('large');

      // one action, two models respond
      model1.actions.size.sharedSmall();
      expect(model1.data.size).toBe('small');
      expect(model2.data.size).toBe('small');

      model2.actions.size.sharedXL();
      expect(model1.data.size).toBe('XL');
      expect(model2.data.size).toBe('XL');
    });

  });
});

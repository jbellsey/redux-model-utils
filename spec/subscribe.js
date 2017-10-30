import clone from 'clone';
import assignDeep from 'assign-deep';
import {modelBuilder} from '../src/model';
import mockStore from './support/mock-store';
import subscribe from '../src/subscribe';

describe('SUBSCRIBE module:', () => {

  let counter   = 0,
      initial   = {
        userID: 0,
        prefs:  {
          color: 'red',
          size:  'large'
        }
      },
      modelSeed = {
        initialState: initial,
        actionMap: {
          setColor: {
            params: 'color',
            reducer: (state, {color}) => assignDeep({}, state, {prefs: {color}})
          },
          setSize: {
            params: 'size',
            reducer: (state, {size}) => assignDeep({}, state, {prefs: {size}})
          }
        },
        selectors: {
          color:    'prefs.color',
          size:     'prefs.size',
          colorFnc: state => state.prefs.color
        }
      },
      model;

  beforeEach(() => {
    modelSeed.name = `subscribe-model-${counter++}`;
    model = modelBuilder(clone(modelSeed));
  });

  //-----------

  it('runs our custom subscriber properly, when used with a string selector', () => {

    let store           = mockStore(model),
        invocationCount = 0,
        subscriber      = () => ++invocationCount;

    model.subscribe(model.selectors.color, subscriber, {noInit: true});

    model.actions.setColor('yellow');
    expect(store.getModelState().prefs.color).toBe('yellow');
    expect(invocationCount).toBe(1);

    model.actions.setColor('turq');
    expect(store.getModelState().prefs.color).toBe('turq');
    expect(invocationCount).toBe(2);

    model.actions.setSize('XXXL');
    expect(invocationCount).toBe(2);
  });

  it('runs our custom subscriber properly, when used with a function selector', () => {

    let store           = mockStore(model),
        invocationCount = 0,
        subscriber      = () => ++invocationCount;

    model.subscribe(model.selectors.colorFnc, subscriber, {noInit: true});

    model.actions.setColor('kelly');
    expect(store.getModelState().prefs.color).toBe('kelly');
    expect(invocationCount).toBe(1);

    model.actions.setColor('royal');
    expect(store.getModelState().prefs.color).toBe('royal');
    expect(invocationCount).toBe(2);

    model.actions.setSize('Petite');
    expect(invocationCount).toBe(2);
  });

  it('runs once for init, when not suppressed', () => {

    let invocationCount = 0,
        subscriber      = () => ++invocationCount;

    mockStore(model);
    model.subscribe(model.selectors.colorFnc, subscriber);  // note: "noInit" flag omitted

    expect(invocationCount).toBe(1);  // init

    model.actions.setColor('poiple');
    expect(invocationCount).toBe(2);
  });


  it('receives the correct value', () => {

    function cb(newColor, oldColor) {
      expect(newColor).toBe('mint');
      expect(oldColor).toBe('red');
    }

    mockStore(model);
    subscribe('prefs.color', cb, {noInit: 1});
    model.actions.setColor('mint');
  });

  it('is only invoked when the specific property changes', () => {

    let colorInvocations = 0;
    mockStore(model);

    model.subscribe('prefs.color', () => ++colorInvocations, {noInit: true});
    model.actions.setColor('pink');
    model.actions.setColor('pink');
    model.actions.setColor('pink');
    expect(colorInvocations).toBe(1);
    model.actions.setColor('goldenrod');
    model.actions.setColor('goldenrod');
    expect(colorInvocations).toBe(2);
    model.actions.setColor('pink');
    model.actions.setColor('pink');
    expect(colorInvocations).toBe(3);
  });

  it('fails without a custom equality test', () => {

    let invokeCt = 0;

    mockStore(model);

    model.subscribe(
      'prefs',
      () => ++invokeCt,
      {
        // because the selector is "prefs", this defaults to "oldState.prefs === newState.prefs"
        // with objects, that's obviously a bad idea. we really want to test prefs.color; see below
        equals: null,
        noInit: true
      }
    );

    model.actions.setColor('bone');
    expect(invokeCt).toEqual(1);

    // without a good equality test, the handler is invoked again (incorrectly)
    model.actions.setColor('bone');
    expect(invokeCt).toEqual(2);
  });

  it('runs custom equality tests', () => {

    let store    = mockStore(model),
        invokeCt = 0;

    model.subscribe(
      'prefs',
      () => ++invokeCt,
      {
        // we look deeper than the selector itself, into prefs.color
        equals: (oldPrefs, newPrefs) => (oldPrefs && oldPrefs.color) === (newPrefs && newPrefs.color),
        noInit: true
      }
    );

    model.actions.setColor('bone');
    expect(invokeCt).toEqual(1);
    expect(store.getModelState().prefs.color).toEqual('bone');

    model.actions.setColor('bone');
    expect(invokeCt).toEqual(1);    // no extra invocation
    expect(store.getModelState().prefs.color).toEqual('bone');

    model.actions.setColor('taupe');
    expect(invokeCt).toEqual(2);
    expect(store.getModelState().prefs.color).toEqual('taupe');
  });
});
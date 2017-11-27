import clone from 'clone';
import assignDeep from 'assign-deep';
import {modelBuilder, refreshForTesting} from '../src/model';
import {mergePropsMaps, mergeReactSelectors} from '../src/react';
import mockStore from './support/mock-store';

describe('REACT module:', () => {

  let initial = {
        userID: 0,
        prefs:  {
          color: 'red',
          size:  'large'
        }
      },
      modelSeed = {
        actionMap:      {
          // a single action, which we only call via the selector
          makeBlue: {reducer: state => assignDeep({}, state, {prefs: {color: 'blue'}})},
        },
        initialState: clone(initial),
        selectors:    {
          // string selectors
          color: 'prefs.color',
          size:  'prefs.size',

          // and a selector that simply exposes model methods
          actions: () => model.actions
        }
      },
      model,
      makeModel = (seed = modelSeed, name = `react-model`) => {
        refreshForTesting();
        seed = clone(seed);
        seed.name = name;
        return model = modelBuilder(seed)
      };

  it('builds mapStateToProps correctly', () => {

    // build a state object, set up as a sub-model {model:data, model:data}
    let modelDupe = clone(modelSeed);

    // custom selector to build a custom prop (we do this after CLONE, so it doesn't leak to other tests)
    modelDupe.selectors.custom = state => state.prefs.color + '~' + state.prefs.size;
    let model = makeModel(modelDupe),
        state = {[model.name]: clone(initial)};

    // we should get SOMETHING for react selectors, at least
    expect(model.mapStateToProps).not.toBeUndefined();

    // run @connect on the selectors; it should map to usable props
    let props = model.mapStateToProps(state);
    expect(props.color).toBe('red');

    // test a custom prop function. user can do pretty much any maniuplation
    // of state in a selector function
    expect(props.custom).toBe('red~large');
  });

  it('warns about using reactSelectors, but still allows it', () => {
    const expectedWarning = 'redux-model-utils: The use of "model.reactSelectors" is deprecated. Use "model.mapStateToProps" instead.',
          oldWarn = console.warn;
    console.warn = jasmine.createSpy();

    let modelDupe = clone(modelSeed),
        model = makeModel(modelDupe),
        state = {[model.name]: clone(initial)},
        props = model.reactSelectors(state);

    expect(props.color).toBe('red');
    expect(console.warn).toHaveBeenCalledWith(expectedWarning);
    console.warn = oldWarn;
  })

  it('allows a model to expose all of its methods as a prop', () => {

    // build a state object, set up as a sub-model {model:data, model:data}
    let model = makeModel(),
        store = mockStore(model),
        props = model.mapStateToProps(store.getState());

    expect(typeof props.actions.makeBlue).toBe('function');
    expect(props.color).toBe('red');

    // run the action, then refresh the selectors
    props.actions.makeBlue();
    props = model.mapStateToProps(store.getState());
    expect(props.color).toBe('blue');
  });

  it('builds custom react props maps correctly', () => {

    // make a custom set of selectors
    let customSelectors = {
          firstLetterOfColor: state => state.prefs.color.charAt(0)
        },
        modelDupe = clone(modelSeed);

    // attach the custom selectors as propsMaps
    modelDupe.propsMaps = {
      firstOnly: customSelectors
    };

    // build a model & state object, set up as a sub-model {model:data, model:data}
    let model = makeModel(modelDupe),
        state = {[model.name]: clone(initial)};

    // double-check our main mapStateToProps (same test as above)
    let connectedSelectors = model.mapStateToProps(state);
    expect(connectedSelectors.color).toBe('red');

    // now test the custom props map
    let customSelectorMap = model.propsMaps.firstOnly(state);
    expect(customSelectorMap.firstLetterOfColor).toBe('r');
  });

  it('namespaces props maps when requested', () => {

    // make a custom set of selectors
    let modelDupe = clone(modelSeed);
    modelDupe.options = {propsNamespace: 'bucket'};

    // build a model & state object, set up as a sub-model {model:data, model:data}
    let model = makeModel(modelDupe),
        state = {[model.name]: clone(initial)},
        props = model.mapStateToProps(state);

    expect(props.bucket.color).toBe('red');
  });

  it('merges multiple props maps correctly', () => {

    // make two custom set of selectors
    let modelDupe = clone(modelSeed);

    // attach the custom selectors as propsMaps
    modelDupe.propsMaps = {
      firstOnly: {
        firstLetterOfColor: state => state.prefs.color.charAt(0)
      },
      lastOnly: {
        lastLetterOfColor: state => state.prefs.color.charAt(state.prefs.color.length - 1)
      }
    };

    let model = makeModel(modelDupe),
        state = {[model.name]: clone(initial)},
        props = model.mapStateToProps(state);

    expect(props.color).toBe('red');

    // now test the custom props map (not merged yet)
    let customProps = model.propsMaps.firstOnly(state);
    expect(customProps.firstLetterOfColor).toBe('r');
    expect(customProps.lastLetterOfColor).toBeUndefined();

    let mergedMap = mergePropsMaps(model.propsMaps.firstOnly, model.propsMaps.lastOnly),
        mergedProps = mergedMap(state);
    expect(mergedProps.firstLetterOfColor).toBe('r');
    expect(mergedProps.lastLetterOfColor).toBe('d');
  });

  it('warns about using mergeReactSelectors, but still allows it', () => {

    let modelDupe = clone(modelSeed),
        oldWarn = console.warn,
        expectedWarning = 'redux-model-utils: The use of "mergeReactSelectors" is deprecated. Use "mergePropsMaps" instead.';
    console.warn = jasmine.createSpy();

    modelDupe.propsMaps = {
      firstOnly: { firstLetterOfColor: state => state.prefs.color.charAt(0)},
      lastOnly:  { lastLetterOfColor: state => state.prefs.color.charAt(state.prefs.color.length - 1)}
    };

    let model = makeModel(modelDupe),
        state = {[model.name]: initial},
        mergedMap   = mergeReactSelectors(model.propsMaps.firstOnly, model.propsMaps.lastOnly),
        mergedProps = mergedMap(state);

    expect(mergedProps.firstLetterOfColor).toBe('r');
    expect(mergedProps.lastLetterOfColor).toBe('d');

    expect(console.warn).toHaveBeenCalledWith(expectedWarning);
    console.warn = oldWarn;
  });

  it('applies the namespace to merged props maps correctly', () => {

    // make two custom set of selectors
    let modelDupe = clone(modelSeed);

    // attach the custom selectors as propsMaps
    modelDupe.options = {propsNamespace: 'catapult'};
    modelDupe.propsMaps = {
      firstOnly: { firstLetterOfColor: state => state.prefs.color.charAt(0) },
      lastOnly:  { lastLetterOfColor: state => state.prefs.color.charAt(state.prefs.color.length - 1)}
    };

    let model = makeModel(modelDupe),
        state = {[model.name]: initial},
        props = model.mapStateToProps(state);

    expect(props.catapult.color).toBe('red');

    // now test that the custom props map (not merged yet) have been individually namespaced
    let customProps = model.propsMaps.firstOnly(state);
    expect(customProps.catapult.firstLetterOfColor).toBe('r');
    expect(customProps.catapult.lastLetterOfColor).toBeUndefined();

    // test a merged version
    let mergedMap = mergePropsMaps(model.propsMaps.firstOnly, model.propsMaps.lastOnly),
        mergedProps = mergedMap(state);
    expect(mergedProps.catapult.firstLetterOfColor).toBe('r');
    expect(mergedProps.catapult.lastLetterOfColor).toBe('d');
  });
});

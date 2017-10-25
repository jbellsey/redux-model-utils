import clone from 'clone';
import {modelBuilder} from '../src/model';
import {mergeReactSelectors} from '../src/react';

describe('REACT module:', () => {

  let initial   = {
        userID: 0,
        prefs:  {
          color: 'red',
          size:  'large'
        }
      },
      counter   = 0,
      modelSeed = {
        actions:      {},
        initialState: clone(initial),
        selectors:    {
          // string selectors
          color: 'prefs.color',
          size:  'prefs.size',
        },
        reducer: state => state
      },
      makeModel = (model = modelSeed) => {
        model.name = `react-model-${counter++}`;
        return modelBuilder(model)
      };

  it('builds reactSelectors correctly', () => {

    // build a state object, set up as a sub-model {model:data, model:data}
    let modelDupe = clone(modelSeed),
        state     = {};

    // custom selector to build a custom prop (we do this after CLONE, so it doesn't leak to other tests)
    modelDupe.selectors.custom = state => state.prefs.color + '~' + state.prefs.size;
    let model = makeModel(modelDupe);
    state[model.name] = clone(initial);

    // we should get SOMETHING for react selectors, at least
    expect(model.reactSelectors).not.toBeUndefined();

    // run @connect on the selectors; it should map to usable props
    let connectedSelectors = model.reactSelectors(state);
    expect(connectedSelectors.color).toBe('red');

    // test a custom prop function. user can do pretty much any maniuplation
    // of state in a selector function
    expect(connectedSelectors.custom).toBe('red~large');
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

    // double-check our main reactSelectors (same test as above)
    let connectedSelectors = model.reactSelectors(state);
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
        state = {[modelDupe.name]: clone(initial)};

    let connectedSelectors = model.reactSelectors(state);
    expect(connectedSelectors.bucket.color).toBe('red');
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
        state = {[modelDupe.name]: clone(initial)};

    // double-check our main reactSelectors (same test as above)
    let connectedSelectors = model.reactSelectors(state);
    expect(connectedSelectors.color).toBe('red');

    // now test the custom props map (not merged yet)
    let customSelectorMap = model.propsMaps.firstOnly(state);
    expect(customSelectorMap.firstLetterOfColor).toBe('r');
    expect(customSelectorMap.lastLetterOfColor).toBeUndefined();

    let mergedMap = mergeReactSelectors(modelDupe.propsMaps.firstOnly, modelDupe.propsMaps.lastOnly),
        mergedProps = mergedMap(state);
    expect(mergedProps.firstLetterOfColor).toBe('r');
    expect(mergedProps.lastLetterOfColor).toBe('d');
  });
});

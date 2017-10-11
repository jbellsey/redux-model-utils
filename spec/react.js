import clone from 'clone';
import modelBuilder from '../src/model';

describe('REACT module:', () => {

  var initial   = {
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
        reducer:      state => state
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

    state[modelDupe.name] = clone(initial);

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
        modelDupe       = clone(modelSeed);

    // attach the custom selectors as propsMaps
    modelDupe.propsMaps = {
      firstOnly: customSelectors
    };

    // build a model & state object, set up as a sub-model {model:data, model:data}
    let model = makeModel(modelDupe),
        state = {};
    state[modelDupe.name] = clone(initial);

    // double-check our main reactSelectors (same test as above)
    let connectedSelectors = model.reactSelectors(state);
    expect(connectedSelectors.color).toBe('red');

    // now test the custom props map
    let customSelectorMap = model.propsMaps.firstOnly(state);
    expect(customSelectorMap.firstLetterOfColor).toBe('r');
  });

  // TODO: test mergeReactSelectors
});

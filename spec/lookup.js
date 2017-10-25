import lookup from '../src/lookup';

function makeStoreData(modelName) {
  const rawData = {
    userID: 0,
    prefs:  {
      color: 'red',
      size:  'large'
    }
  };
  if (modelName)
    return {[modelName]: rawData};
  else
    return rawData;
}

describe('LOOKUP module:', () => {

  //-----------

  it('uses dot-notation strings for lookup', () => {

    const storeState = makeStoreData(),
          selector = 'prefs.size';
    expect(lookup(storeState, selector)).toBe('large');
  });

  it('uses dot-notation strings for lookup inside a model', () => {

    const modelName = 'paloalto',
          storeState = makeStoreData(modelName),
          selector = 'prefs.size';
    expect(lookup(storeState, selector, modelName)).toBe('large');
  });

  it('uses function selectors for lookup', () => {

    const storeState = makeStoreData(),
          selector   = state => state.prefs.color;
    expect(lookup(storeState, selector)).toBe('red');
  });

  it('uses function selectors for lookup inside a model', () => {

    const modelName  = 'larkspur',
          storeState = makeStoreData(modelName),
          selector   = state => state.prefs.color;
    expect(lookup(storeState, selector)).toBe(undefined);
    expect(lookup(storeState, selector, modelName)).toBe('red');
  });

});
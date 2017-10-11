import lookup from '../src/lookup';

describe('LOOKUP module:', () => {

  var store;
  beforeEach(() => {
    store = {
      userID: 0,
      prefs:  {
        color: 'red',
        size:  'large'
      }
    };
  });

  //-----------

  it('uses dot-notation strings for lookup', () => {

    var selector = 'prefs.size';
    expect(lookup(store, selector)).toBe('large');
  });

  it('uses function selectors for lookup', () => {

    var selector = state => state.prefs.color;
    expect(lookup(store, selector)).toBe('red');
  });

});
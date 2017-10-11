import clone from 'clone';
import resetStore from './_store';
import modelBuilder from '../src/model';

describe('MODEL module:', () => {

  var seed = {
    name:         'test-model',
    actionMap:    {},
    initialState: {},
    selectors:    {}
  };

  it('refuses to create models with the same name', () => {

    var setup = () => {
      modelBuilder(seed);
      modelBuilder(seed);
    };
    expect(setup).toThrow();
  });
});

describe('DATA ACCESSORS module:', () => {

  var initial   = {
        userID: 0,
        prefs:  {
          color: 'red',
          size:  'large'
        }
      },
      modelSeed = {
        name:         'accessors-model',
        actionMap:    {},
        initialState: clone(initial),
        selectors:    {
          color: 'prefs.color',
          size:  'prefs.size'
        }
      },
      model     = modelBuilder(modelSeed);

  it('creates and handles data accessors for string-selectors and function-selectors', () => {

    // TODO: more tests
    var mockStore = resetStore(model, null, 0);
    mockStore.forceFullScope(true);
    expect(model.data.color).toBe('red');
  });
});

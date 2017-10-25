import clone from 'clone';
import {modelBuilder} from '../src/model';
import mockStore from './support/mock-store';

describe('MODEL module:', () => {

  const seed = {
    name:         'test-model',
    actionMap:    {},
    initialState: {},
    selectors:    {}
  };

  it('refuses to create models with the same name', () => {

    const setup = () => {
      modelBuilder(seed);
      modelBuilder(seed);
    };
    expect(setup).toThrow();
  });
});

describe('DATA ACCESSORS module:', () => {

  let initial   = {
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
        selectors:    {}
      },
      model = modelBuilder(modelSeed);

  it('passes back the full model state on "data"', () => {
    mockStore(model);
    expect(model.data.prefs.color).toBe('red');
  });
});

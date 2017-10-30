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
      modelBuilder(clone(seed));
      modelBuilder(clone(seed));
    };
    expect(setup).toThrow();
  });
});

describe('DATA ACCESSORS module:', () => {

  let initial   = {
        userID: 33,
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
          id:    state => `User#${state.userID}`
        }
      },
      model = modelBuilder(clone(modelSeed));

  it('passes back the full model state on "allData"', () => {
    mockStore(model);
    expect(model.allData.prefs.color).toBe('red');
  });

  it('passes back data for each selector on "data"', () => {
    mockStore(model);
    expect(model.data.color).toBe('red');
    expect(model.data.id).toBe('User#33');
  });
});

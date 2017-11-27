# Testing your application

There's a store-mocking tool in the spec directory
[here](../spec/support/mock-store.js). You're encouraged to use it
in your application. It's not exposed in this repo, so
you'll have to copy the source into your application. 

You can see some of our testing patterns in the
spec directory of this repo, especially our tests for
action maps. Or have a at the following tests,
written in [tape](https://github.com/substack/tape)
and [sinon](http://sinonjs.org/). Use them as templates if you like.

## Testing your models

Please copy our [mock store](../spec/support/mock-store.js).
To use it, you'll need to install
[redux-mock-store](https://github.com/arnaudbenard/redux-mock-store),
upon which it's based.

Models are just thin objects that abstract Redux functionality. However, because you're
insulated from the underlying API (e.g., you never call `dispatch`),
you have to provide some support structure before testing your actions.


##### account-model.spec.js
```js
import accountModel from '../account-model.js';
import mockStore from '../spec-helpers/mock-store.js';

tape('non-existent account query', t => {

  const userID = 100,
        store = mockStore(accountModel);
        
  // stub the API call
  api.getUser = sinon.spy(() => Promise.resolve({status: 404});    
       
  // invoke an async action on a model. it returns a promise.
  return accountModel.actions.loadUser(userID)
    .catch(err => {
      t.equal(err.response.status, 404, 'error status should be correct');

      const state = store.getState();
      t.equal(state.accountError.status, 404, 'error status should be stored in the store');
    });
});
```

## Testing your views

Be sure you export your *un*-connected component, which is much easier to test than
the connected component. Since you'll be stubbing your model, you won't need to
import your model or set up your store in your tests. For example:

##### account-model.js
```js
const model = modelBuilder({
  name: 'account',
  actionMap: {loadUser: {/*...*/}, saveUser: {/*...*/}},
  initialState: {
    accountID: -1,
    username: ''
  },
  selectors: {
    accountID: state => state.accountID,
    username:  state => state.username,
    accountActions: () => model.actions
  }
});
export default model;
```

##### account-view.js
```js
class AccountView extends React.Component {
  // ...
}
AccountView.propTypes = {
  // props from the model (redux store)
  accountID: PropTypes.number.isRequired,
  username:  PropTypes.string.isRequired,
  
  // model actions
  accountActions: PropTypes.shape({
    loadUser: PropTypes.func.isRequired,
    saveUser: PropTypes.func.isRequired
  }).isRequired;
};

// export the UNconnected component (as a named export) for testing.
export {AccountView};

// and the connected component (as the default export) for use in your app
export default connect(accountModel.mapStateToProps)(AccountView);
```

##### account-view.spec.js
```js
import {AccountView} from '../account-view.js';  // load the UNconnected component
import UsernameView from '../username-view.js';

// because we're providing all of the necessary props, rather than
// letting connect() do it for us, we don't need to set up a store
// or even stub model actions.
//
function prepareAccountModelProps(propOverrides) {
  return _.merge({
    accountID: 99,
    username:  'chunknorris01',
    accountActions: {
      loadUser: sinon.spy(),
      saveUser: sinon.spy()
    }
  }, propOverrides);
}

tape('AccountView shows the username in the correct component', t => {

  const props = prepareAccountModelProps({
          username: 'imotep'
        }),
        acctManagerView = mount(<AccountView {...props} />),
        usernameView = acctManagerView.find(UsernameView);

  t.ok(usernameView.exists(), 'a UsernameView component should be rendered');
  t.equal(usernameView.prop('username'), 'imotep'), 'the correct username should be passed as a prop');
  t.end();
});


```
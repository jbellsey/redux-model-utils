
```
npm install --save redux-model-utils
```

*File size*: 3k (min/gzip).

# Redux model utilities

You have in your hands a set of model-building utilities for Redux apps. Like Redux itself, this library
works very well whether or not you use React for rendering.

To use this library, you'll need to build your models using the patterns described below. These
patterns, in effect, ARE the library.

Before jumping into the [full documentation](docs),
let's take a look at what your code will look like when
you use this library.

## Model-building patterns

This library takes Redux and wraps it in a thin, almost object-oriented facade.
Each feature in your app can be represented by a single object (or "model"). Each
model has its own private methods (i.e., action creators), and its own private
data (i.e., its slice of the store). Views interact with the store
by invoking these methods, and retrieve data either by using React-Redux's `connect`
utility, or by subscribing to a slice of the store.

Behind the scenes, the methods dispatch actions and use reducers to reconcile the model data. (It's all Redux, in the end.)
But from a developer's perspective, this is an internal implementation detail. To use
one of these models, you will never use the `dispatch` method, nor `mapStateToProps`,
nor will you need to create action codes.

Consider a simple model to track user data. The following is pseudo-code, just to 
illustrate where we're going:

##### pseudocode-only.js
```js
// private data:
const userID = 0,
      preferences = {
        lang: 'en',
        shirtSize: 'L'
      };

// public methods
export function loadUser(id) {}
export function saveUser() {}
export function updateLanguagePref(newLang) {}

// public accessors
export const language = () => longLanguageName[preferences.lang];
export const shirtSize = () => longSizeName[preferences.shirtSize];
```

Here's the skeletal representation using Redux Model Utilities:

##### user-model.js
```js
const model = modelBuilder({

  name: 'userModel',

  // the store data
  initialState: {
    userID: 0,
    preferences: {
      lang:      'en',
      shirtSize: 'L'
    }
  },

  // the model's "methods". these are transformed into callable functions on "actions".
  // for example: model.actions.loadUser(88). the actions are typically passed to
  // connected components as a prop (see below)
  actionMap: {
    // this describes a function on model.actions.loadUser()
    loadUser: {
      params: 'id',
      
      // this reducer is atomic; it's only invoked when this action is dispatched
      reducer: (state, {id}) => ({...state, {userID: id}})
    },
    // and a function on model.actions.saveUser(), etc
    saveUser: {/* ... */},
    updateLanguagePref: {/* ... */}
  },

  // the following "selectors" are passed as props to your connected components.
  // selectors can expose data in raw form (directly from state) or manipulated.
  selectors: {
    // your connected component gets "this.props.language"
    language:  state => state.preferences.lang,
    shirtSize: state => state.preferences.shirtSize,

    // the following prop gives connected components direct access to the model's methods
    // e.g., "this.props.userActions.loadUser(0)"
    userActions:  () => model.actions
  }
});
export default model;
```

## Why?

This not only removes most of the Redux boilerplate, but it also gives you:

* **Atomic reducers**. Each action has a single-purpose reducer. There are no
  `switch` statements. (You can share action types if you like, so you can have multiple
  reducers handle the same action.)

* **Encapsulation**. The model has everything it needs to manage a single feature in your app.
  There are no separate `mapStateToProps` calls in container components, no separate action code
  files.

There are also tools for async actions, private actions, shared actions, and more. Read the
[full docs on actions](docs/actions.md).

### Easy connection to React components

If you're using this library in a React app, you're in luck.
No need to write `mapStateToProps` or `mapDispatchToProps`.
It's all done for you when you connect a model to a component.

```javascript
// here, we create a connected component around the user model above
//
import userModel from './models/user-model.js';

class UserSettingsPage extends Component {
    render() {
        let {language, shirtSize, userActions} = this.props;
        // ...

        return <button onClick={() => userActions.saveUser()}>Save</button>
    }
}
export default connect(userModel.reactSelectors)(UserSettingsPage);
```

Details in the [React docs](docs/react.md).

### Direct read-only access to the model state

Here's a snippet from a model used for non-UI data,
which shows how you can peek into the properties of any model, not just those which you `connect`
to your components. Caveat follows the code.

```javascript
let initialState = {
        token:     null,
        pollTimer: null
    },
    // selectors are also converted into read-only properties
    // on the model's "data" object, as shown a few lines down
    selectors = {
        token:     state => state.token,
        pollTimer: state => state.pollTimer
    },
    uiModel = modelBuilder({/*... */});

// ... then later, in your view ...
let token = uiModel.data.token;
```

This means you don't need to `connect` every model to every component.
Peek into any model you like, and you'll get the latest values from the
master Redux store.

*Caveat*: This is convenient, but not always a best practice. In React apps,
you'll typically use `mergeReactSelectors` if your views need to respond
to changes across multiple models. And in non-React apps, you'll typically use
`subscribe` to track changes. So use with caution.

### Change-notification (subscriptions)

Built on top of Redux's subscription tool, this subscription will only alert
you when a property changes. Use this for cross-cutting concerns. (In non-React apps, this
will be your main rendering trigger.)

```javascript
let unsubscribe = uiModel.subscribe(uiModel.selectors.shirtSize, (newShirtSize, oldShirtSize) => {
    // callback is called once at initialization time, and then only
    // when the property changes
    console.log(`Font size changed from ${oldFontSize} to ${newFontSize}`);
});
```


# Learn more

* [Read a full example](docs/example.md)
* [Browse the docs](docs)
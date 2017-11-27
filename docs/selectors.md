
# Selectors

Selectors are recipes; they hold the algorithm for retrieving a usable value
from your store. Sometimes the recipe is simple (`return state.userID`), and
sometimes it's complex (`return unexpiredVisibleTodos(state)`).

They are mainly used to generate props from state for React components.
But they can also be used to watch properties in your model from somewhere
other than a connected component. (See data accessors, below.)

They come in two forms. Each has its advantages and disadvantages.

* A **string** selector is a representation of the path to the property in dot notation, starting at the root of your model's `state`.
* A **function** selector maps the `state` object into a property. It can contain as much logic as needed.

So for an model state like this:

```js
let initialState = {
      userID: 0,
      preferences: {
        colorScheme: 'dark',
        fontSize:    'large'
      }
    };
```
You could define selectors in one of these two ways:

```js
let stringSelectors = {
      userID:      'userID',
      colorScheme: 'preferences.colorScheme',
      fontSize:    'preferences.fontSize'
    };

// ...or...

let functionSelectors = {
      userID:      state => state.userID,
      colorScheme: state => state.preferences.colorScheme,
      fontSize:    state => state.preferences.fontSize
    };
```

If you need to do more logic than a direct property retrieval, you
can do it in a function:

```js
let selectors = {
      visibleTodos: state => state.todos.filter(todo => !!todo.visible)
    };
```

If you like, you can also use [Reselect](https://github.com/reactjs/reselect)
to memoize your selectors.


# Exposing model actions as a selector

In order to reduce coupling between your views and your models, we recommend
exposing your model's actions as a selector:

```js
let selectors = {
      userID:      state => state.userID,
      userActions: () => model.actions
    };
```

This gives your component a new prop `userActions`, which has all of the
actions from your model. Your views should invoke actions from here, rather
than by using the model's actions directly:

```js
const LogoutButton = props => {

  // call the action via its prop:
  const clickHandler = props.userActions.logout;

  // DO NOT DO THIS:
  //  const clickHandler = userModel.actions.logout;
  // as it is much harder to stub a model than a prop

  return <button onClick = {clickHandler}>Logout</button>;
};
```

# React

The selectors are used when connecting your model to a component.
See [react.md](our React docs).

# Data accessors

As a convenience, you also get an accessor for each selector, so you can retrieve
data from the store at any time. An object called `data` is created for you and
attached to your model; its keys match those in your selectors.

```javascript
// the "data" object has one key for each selector:
let {userID, color, fontSize} = userModel.data;
```

To get the full store, use the object called `allData`. This object
returns a full copy of the entire store, exactly as you
structured it. Note that this bypasses your selectors, so you can't
retrieve calculated data this way. You also need to know the structure
of your data. So this should typically only be used inside your model:

```javascript
let allData = prefsModel.allData,
    {userID, preferences: {color, fontSize}} = allData;
```

### Caveat:
While this may be convenient at times, it may not be the most robust
solution for working with multiple models. In general, a React app
should use props maps to have a component receive props
from multiple models. In non-React apps, you'll typically use
`subscribe` to track changes. 

Use with caution, as this feature is likely to be deprecated in a future release.


```
npm install --save jbellsey/redux-model-utils
```

# Redux model utilities

You have in your hands a set of model-building utilities for Redux apps. Like Redux itself, this library
works very well whether or not you use React for rendering.

To use this library, you'll need to build your models using the patterns described below. These
patterns, in effect, ARE the library.

Before jumping into the [full documentation](docs),
let's take a look at what your code will look like when
you use this library.

# Model-building patterns

### Atomic actions and reducers

Here's an incomplete code snippet that shows something called an *action map*. An action map
bundles together everything needed for a single, public, executable action. Witness:

```javascript
let actionMap = {
    // each key in the map is converted into an action-creator of the same name
    addTodo: {
        code:   'TODO_ADD',         // private to this module. consumers don't see this
        params: ['text'],           // parameters for the action creator
        reducer(state, action) {    // atomic reducer for this one action
            state.todos = [...state.todos, action.text];
            return state;
        }
    },
    removeTodo: {
        // (similar)
    }
};

// ... then later, in your view ...
todoModel.actions.addTodo('Go for a soda');
```

No more `switch` statements in big reducers that handle multiple actions.
No need for public-facing action codes.
No need to do your own `dispatch`.

While action maps are sweet, you don't have to use them.
You can use another utility function `makeActionCreator`,
which is straight from the Redux docs.

```javascript
let addTodo = reduxModelUtils.makeActionCreator('TODO_ADD', 'text');
addTodo('Sell car');    // dispatch is called for you
```

There are also tools for async actions. Read the
[full docs on actions](docs/actions.md).

### Direct read-only access to the model state

Here's a snippet from a model used for non-UI data,
which shows how you can peek into the properties of any model, not just those which you `connect`
to your components. Caveat follows the code.

```javascript
let initialState = {
        token:     null,
        pollTimer: null
    },
    // selectors are described in detail later. briefly: they
    // are  roadmaps that allow a consumer to retrieve
    // a property in the state. they are also converted into
    // read-only properties on the model's "data" object, as
    // shown a few lines down
    selectors = {
        token:     state => state.token,
        pollTimer: state => state.pollTimer
    };

// ... then later, in your view ...
let token = uiModel.data.token;
```

This means you don't need to `connect` every model to every component.
Peek into any model you like, and you'll get the latest values from the
master Redux store.

*Caveat*: This is convenient, but not often a best practice. In React apps,
you'll typically use `mergeReactSelectors` if your views need to respond
to changes across multiple models. And in non-React apps, you'll typically use
`subscribe` to track changes. So use with caution.

### Change-notification (subscriptions)

Built on top of Redux's subscription tool, this allows you to get notified only when
a property is changed. Use this for cross-cutting concerns. (In non-React apps, this
will be your main rendering trigger.)

```javascript
let unsubscribe = uiModel.subscribe(uiModel.selectors.fontSize, (newFontSize, oldFontSize) => {
    // callback is called once at initialization time, and then only
    // when the property changes
    console.log(`Font size changed from ${oldFontSize} to ${newFontSize}`);
});
```

### Instant functionality

Adding a spinner to your async operations just got trivial. In one
line of code, you can add two actions to your model (`wait()` and
`stopWaiting()`) and a boolean flag to the store (`waiting`).

Similarly, adding undo to your model with [redux-undo](https://github.com/omnidan/redux-undo)
is super-easy. With one line of code, you get `undo()` and `redo()`
actions, as well as observables for tracking the size of the undo stack.

The code required to add these features is very simple, but needs some
explanation, so we'll show it to you in a bit.

### Common object-management utilities

A few utilities for working with JavaScript objects are provided.
In addition to `clone()`, which does a deep copy of an object, you
also get property-management tools like `lookup()`, `assign()` and `cloneAndAssign()`.
These are described below.

# Learn more!

• [Read a full example](docs/example.md)
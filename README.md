
```
npm install --save redux-model-utils
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
No need for action codes. No need to do your own `dispatch`.

This is true encapsulation for your models. Your actions and reducers are together,
where they belong.

There are also tools for async actions, private actions, and more. Read the
[full docs on actions](docs/actions.md).

### Easy connection to React components

If you're using this library in a React app, you're in luck.
No need to write `mapStateToProps` or `mapDispatchToProps`.
It's all done for you when you connect a model to a component.

```javascript
// selectors are described in detail later. briefly: they
// are roadmaps that allow a consumer to retrieve
// a property in the state. they also map to props when
// you connect a model to a component.
//
let selectors = {
    todos:    state => state.todos,
    listName: state => state.listName
};

// ... then later, in your connected (smart) component ...
//
class TodoList extends Component {
    render() {
        // your component will get props that match your model's selectors
        let {todos, listName} = this.props;
        // ... etc
    }
}
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
    };

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

The code required to add this feature is very simple, but needs some
explanation, so we'll show it to you in a bit.


# Learn more

* [Read a full example](docs/example.md)
* [Browse the docs](docs)
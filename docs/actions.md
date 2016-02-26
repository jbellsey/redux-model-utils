
# Actions & action maps

There are two ways to bundle actions into your model. You can either
attach normal action-creators and handle them in a monolithic reducer
function (one reducer per model), or you can create an action map
with atomic reducer functions (one reducer per action).

Action maps are way better, so we'll describe them first.

# Action maps

### Action map example

An action map allows you to fully describe an action in one package,
which we call an *action definition*. Each key in the `actionMap` object
is a single action definition.

Here again is the example from earlier:

```javascript
let actionMap = {
    addTodo: {
        params: ['text'],           // parameters for the action creator
        reducer(state, action) {    // each reducer handles only a single action
            state.todos = [...state.todos, action.text];
            return state;
        }
    },
    removeTodo: {
        params: ['index'],
        reducer(state, action) {
            state.todos = [
                ...state.todos.slice(0, action.index),
                ...state.todos.slice(action.index + 1)
            ];
            return state;
        }
    }
};
```

Here is how you call an action-creator from your view:

```javascript
model.actions.removeTodo(4);
```

The `actionMap` property of your model is not used by callers.
The `modelBuilder` tool converts your action map into an `actions`
object, as described below.

### Action map guidelines

Each key -- or action definition -- in your action map is converted
into an action-creator, and placed onto a public-facing `actions`
object in your model.
In this example, the parser will unpack
your action definitions and create two keys in the `actions` object:
`addTodo` and `removeTodo`.

After parsing, the action map is not used.

You must also provide a reducer function for responding to that action.
The reducer will be called only when the given action is processed. So
there's no need for switch statements. The reducer is private and atomic.

You can optionally indicate what parameters are passed to the action
creator. The `params` property is an array of strings (parameter names).
If no parameters are needed, you can omit this property.
If only a single parameter is needed, you can use a string rather than an array of strings.

When you use an action map, you should _not_ attach an `actions` object or a `reducer`
function to your model. These will be created for you. Without a master reducer,
you can't mix an action map with any other actions on the same model.

Normally your master reducer is where you apply your initial state (usually in the
form of a default argument). Well, without a master reducer, that's not an option.
Instead, you must provide a fully-specified `initialState` object on the model.

```javascript
module.exports = reduxModelUtils.modelBuilder({

    name: 'todos',
    selectors,      // not shown in this example

    // if you use an action map, you must provide these two objects:
    actionMap,
    initalState: {todos:[]}
});
```

### Asynchronous actions in an action map

To build an asynchronous action using an action map, include a property `async`
in your action definition. This is a function which takes a `params` object,
just as a normal reducer gets an `action` object as a parameter. The `async`
function can return a promise for chaining.

The action definition for an asynchronous action should include a `params`
key, just as described above. It can be a string, or an array of strings,
or you can omit it altogether if no parameters are needed.

Asynchronous action definitions should not be given a reducer.

```javascript
let actionMap = {

    // example of an async action with no params: a one-second timed promise
    timer1000: {
        async: () => new Promise(resolve => setTimeout(resolve, 1000))
    },

    save: {
        params: 'recordID',
        async(params) {
            // you can call synchronous actions inside an async action.
            // here we make use of the "waitable" magic trigger,
            model.actions.wait();
            return api.save(params.recordID)
                      .then(() => model.stopWaiting());
        }
    }
};
// keep a reference to the constructed model, so we can call its actions above
let model = module.exports = reduxModelUtils.modelBuilder( /* ... */ );

// ... then later, in your view ...
model.actions.save(44).then(closeForm);
model.actions.timer1000().then(smile);
```

### About private action codes

The codes for actions built from an action map are private.
You should not write code that depends on these internal action codes.

Because codes are not shared, other reducers cannot handle actions
created by an action map.

If your application needs to have multiple reducers handle a single action,
you have a few options.

First, use the `subscribe` option. Instead of writing code inside
a reducer, build a callback handler that watches a value in your model for
changes. When the model changes, your callback is invoked, and you
can issue other actions.

If that isn't an option, and you truly need public action codes that can
be handled by multiple reducers, you can't use an action map. The next
section is for you.

### Creating private actions

There are good reasons to make actions that are private to your model.
See the async example in the [API docs](api-model.md) for a use-case
and a model which has both public and private action-creators.

To make an action map with private actions is a two-step process.
First, add a `private` key to any action definition that
you want to keep private. Then, after your model is built, call
`severPrivateActions` to ensure no other caller can use your action.

```javascript
let actionMap = {

        // this action is private. it's called after the (public) save
        // operation is complete
        _storeData: {
            private: true,  // flag it
            params: 'data',
            reducer: (state, action) => {
                state = clone(state);
                state.data = action.data;
            }
        },

        // this is the public interface for saving data. when the
        // data returns, we call a private action
        save: {
            params: 'recordID',
            async(params) {
                return api.save(params.recordID).then(
                    // note that the private action is not attached to the model
                    data => privateActions._storeData(data)
                )
            }
        }
    },

    model = module.exports = reduxModelUtils.modelBuilder( /* ... */ ),

    // here we extract a module-local reference to the private actions
    privateActions = model.severPrivateActions();

// ... then later, in your view ...
model.actions.save(44).then(closeForm);

// this will throw an error, since the private actions were severed
model.actions._storeData({});
```


# Normal action-creators

You don't actually need to use action maps. But you should! But you don't need to,
so here's how you can do it with a more "stock" implementation.

We provide a utility called `makeActionCreator`, which -- this will shock you --
builds an action creator. As with all actions you build with this library,
it is automatically dispatched for you.

Here's the same example from above, rewritten with public actions:

```javascript
const
    reduxModelUtils = require('redux-model-utils'),

    initialState = {
        todos: []
    },
    selectors = {
        todos: 'todos'
    },

    // these codes aren't exported in this example. but they can easily
    // be moved to a separate module (e.g., "actionCodes.js") for sharing
    actionCodes = {
        TODO_ADD:    'TODO_ADD',
        TODO_REMOVE: 'TODO_REMOVE'
    },
    // here we build the public action-creators, using the action codes above.
    // the parameters for the action-creator are described here as well
    actions = {
        addTodo:    reduxModelUtils.makeActionCreator(actionCodes.TODO_ADD,    'text'),
        removeTodo: reduxModelUtils.makeActionCreator(actionCodes.TODO_REMOVE, 'index')
    };

// here we build a normal, monolithic reducer which handles multiple actions
//
function reducer(state = initialState, action = {}) {

    switch (action.type) {

        case actionCodes.TODO_ADD:
            state.todos = [...state.todos, action.text];
            return state;

        case actionCodes.TODO_REMOVE:
            state.todos = [
                ...state.todos.slice(0, action.index),
                ...state.todos.slice(action.index + 1)
            ];
            return state;
    }
    return state;
}

module.exports = reduxModelUtils.modelBuilder({
    name: 'todos',
    selectors,

    // here we export "actions" and "reducer",
    // rather than "actionMap" and "initialState"
    actions,
    reducer
});
```

This looks more like standard Redux. We only added one convenience function
(`makeActionCreator`), which is something most Redux applications do anyway.

The action codes can now be shared with other reducers, since they aren't
private or managed internally by the library. Simply move the definition of
the codes to another module so they can be imported wherever you need them.

### Asynchronous actions

Instead of `makeActionCreator`, use `makeAsyncAction`, which takes a callback
and a list of parameter names:

```javascript
let callback = (args) => fetch(`http://myapi.com/u/${args.userID}`),
    loadUser = reduxModelUtils.makeAsyncAction(callback, 'userID');

// ... then later ...
userModel.loadUser(4).then(displayUserData);
```

A fuller example and more details are in the [API docs](api-model.md).
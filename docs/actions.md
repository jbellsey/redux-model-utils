
# Action maps

We expose some basic factory functions (e.g., `makeActionCreator`). However,
the power of this library is in the creation of action maps. They free you
from creating custom action codes and monolithic reducers.

(Most of this doc is a guide. There is a reference at the bottom of this file.)

### Action map example

An action map allows you to fully describe an action in one package,
which we call an *action definition*. Each key in the `actionMap` object
is a single action definition.

Here again is the example from earlier:

```javascript
let actionMap = {
  addTodo: {
    // parameters for the action creator
    params: ['text'],

    // each reducer handles only a single action
    reducer(state, action) {
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

Your first question might be: "Yes, but where are the action codes?"
They are created for you. There's no need to manually assign them.
The `modelBuilder` tool can easily create unique action codes from
the keys of your action map.

### Action map guidelines

Each key -- or action definition -- in your action map is converted
into an action-creator, and placed onto a public-facing `actions`
object in your model. In this example, the parser will unpack
your action definitions and create two action-creators in the `actions` object:
`addTodo` and `removeTodo`.

After parsing, the action map is not used.

You must also provide a reducer function for responding to that action.
The reducer will be called only when the given action is processed. So
there's no need for switch statements. The reducer is private and atomic.

You can optionally indicate what parameters are passed to the action
creator. The `params` property is an array of strings (parameter names).
If no parameters are needed, you can omit this property.
If only a single parameter is needed, you can use a string rather than an array of strings.

Where is the master reducer for the model? It too is created for you, and will
pass control to the appropriate reducer when an action is dispatched.

And what of the initial state? In normal redux, you normally apply the initial
state as a default argument to your master reducer. Alas, when you use an
action map, the master reducer is generated for you. So you must instead
provide a fully-specified `initialState` object on the model.

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

To build an asynchronous action using an action map, omit the `reducer`,
and instead include an `async` method
in your action definition. This is a function which takes a `params` object,
just as a normal reducer gets an `action` object as a parameter. The `async`
function can return a promise for chaining.

The action definition for an asynchronous action can include a `params`
key, just as described above. It can be a string, or an array of strings,
or you can omit it altogether if no parameters are needed.

```javascript
let actionMap = {

    // example of an async action with no params: a one-second timed promise
    timer1000: {
        async: () => new Promise(resolve => setTimeout(resolve, 1000))
    },

    // a more typical async action
    save: {
        params: 'recordID',
        async(params) {
            // you can call synchronous actions inside an async action.
            // here we make use of the "waitable" magic trigger.
            model.actions.wait();

            // we return a promise, which callers can use for chaining
            return api.save(params.recordID)
                      .then(() => model.stopWaiting());
        }
    }
};
// keep a reference to the constructed model, so we can call its actions above
let model = module.exports = reduxModelUtils.modelBuilder( /* ... */ );

// ... then later, in your view ...
model.actions.save(44).then(closeForm);     // chain the returned promise
model.actions.timer1000().then(smile);
```

### Thunks vs. async actions

Sometimes you will have an action which isn't strictly asynchronous,
but needs to be written as a thunk instead of as an action-creator.
Redux does not allow you to fire an action from within a reducer, so
if you need to execute multiple actions from one method, you have to
use an async action rather than a normal action-creator.

If your async action isn't truly asynchronous, you're welcome to
use the synonym `thunk` in your action map. This is purely for clarity;
there is no functional difference from using the `async` option.

```javascript
let actionMap = {

    // synchronous actions
    storeUserData: {
        params: 'data',
        reducer: (state, action) => {/* ... */}
    },
    storeDeviceData: {
        params: 'data',
        reducer: (state, action) => {/* ... */}
    },

    // thunk. not async.
    storeAllData: {
        params: ['userData', 'deviceData'],
        thunk: params => {
            model.actions.storeUserData(params.userData);
            model.actions.storeDeviceData(params.deviceData);
        }
    }
};
```

### About action codes

Action codes are created for you automatically. You should not rely on
them; think of them as an internal impelementation detail.

However, you can override this behavior, and manually assign your own
action code. This is useful for two main reasons:

* If you have a hybrid Redux installation, where some actions are dispatched
  by a part of the app that is unaware of Redux Model Utils. By manually assigning
  the code for an action, you can have your model listen for such actions.
* If you want multiple reducers (in different models) to respond to the same
  action. In this case, assign the same code to both handlers, and both reducers
  will be invoked.
  
To manually assign an action code, use the `code` property on an action definition:

```javascript
let actionMap = {

    addNotification: {
        code:   'MISC/NOTIFICATION/ADD',  // your own custom action code
        params: 'newNotification',
        reducer: (state, action) => {/* ... */}
    },
    storeDeviceData: {
        params: 'data',
        reducer: (state, params) => {/* ... */}
    },

    // thunk. not async.
    storeAllData: {
        params: ['userData', 'deviceData'],
        thunk: params => {
            model.actions.storeUserData(params.userData);
            model.actions.storeDeviceData(params.deviceData);
        }
    }
};
```

### Private actions inside an action map

There are good reasons to make actions that are private to your model.
For example, consider an async action that wraps an API call to retrieve
data from your server. After the API returns, you want to merge the data
into your store. But the merging operation should be private, only available
to the API action, and not to other components or views.

To make an action map with private actions is a two-step process.
First, add a `private` key to any action definition that
you want to keep private. Then, after your model is built, call
`severPrivateActions` to ensure no other caller can use your action.
This will return a new set of action-creators, and remove them
from the model's main `actions` object.

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
    // api returns, we call the private action, to merge the
    // new data into the store
    save: {
        params: 'recordID',
        async(params) {
            // note that the private action is not attached to the model
            return api.save(params.recordID).then(
                data => privateActions._storeData(data)
            )
        }
    }
},

model = module.exports = reduxModelUtils.modelBuilder( /* ... */ ),

// here we remove the private actions from the model, and attach
// them to a local variable which is only accessible inside this module
privateActions = model.severPrivateActions();

// ... then later, in your view ...
model.actions.save(44).then(closeForm);

// this will throw an error, since the private actions were severed
model.actions._storeData({});
```

### Nested actions

You can organize your action map however you like. Actions can be nested, giving you the
flexibility to group actions together.

```javascript
let actionMap = {

  // watch the nesting:
  user: {
    load: {
      params: 'id',
      async: ({id}) => apiCall(id).then(userData => {
        privateActions.user.load._store(userData)
      }),

      // private action used only here to store the result of the query
      _store: {
        params: 'userData',
        reducer: () => {}
      }
    },
    save: {
      params: 'userData',
      async: () => {}
    }
  },

  prefs: {
    save: {
      params: 'prefs',
      async: () => {}
    }
  }
};

/*
  this will create the following actions:

      model.user.load(id)
      privateActions.user.load._store(userData)
      model.user.save(userData)

      model.prefs.save(prefs)
*/
```

## Summary

Each action definition can have one or more of the following keys:

* `params`: an array of strings (parameter names) passed to the action (or thunk). If there is exactly
  one parameter, you can use a string instead of an array.

* `reducer`: the atomic reducer for this action. Like any reducer in Redux, it is a pure function that takes
   two parameters: `state` and `action`.

* `async` or `thunk`: these are synonyms, and they are mutually exclusive, along with `reducer`. (You must provide
   exactly one key out of the three.) You do not modify the store directly in an async thunk. Instead, you can run
   asynchronous operations and fire off normal actions as needed. It takes a single parameter, an object containing
   the parameters defined in `params`. The return value of your thunk is passed back to the caller, to make it easy
   to chain promises.

* `code`: optionally indicate the action code to be used for this action. See the discussion above.

* `private`: a boolean. If true, the action will be marked as private, and included in the object returned
   by `severPrivateActions`, as described above.

If you include any other keys in an action definition, they must be objects that are also action maps.
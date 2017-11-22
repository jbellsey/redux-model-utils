# Action maps

We expose some basic factory functions (e.g., `makeActionCreator`) that you
might find useful. However,
the power of this library is in the creation of action maps. They free you
from creating custom action types and monolithic reducers.

(Most of this doc is a guide. There is a reference at the bottom of this file.)

## Action map example

An action map allows you to fully describe actions as self-contained packages,
which we call *action definitions*. Each key in the `actionMap` object
is a single action definition.

Here is the example from earlier:

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

After running your model through `modelBuilder`, two things happen:

* The action map is parsed, and transformed into a corresponding set of functions
  on `model.actions`. These functions are what you will use to dispatch actions.
* A single master reducer is created, which will be installed into Redux. It
  manages the logic that delegates to the atomic reducers.

## Invoking actions

Here is how you call an action-creator from your view:

```javascript
model.actions.removeTodo(4);
```

Notice that internally, your `actionMap` object was transformed
into an `actions` object, with callable functions.

Your first question might be: "Yes, but where are the action types?"
They are created for you. There's no need to manually assign them.
The `modelBuilder` tool can easily create unique action codes from
the keys of your action map. (You can manually override this behavior,
as described below.)

Your second question might be: why must my view know so much about the model?
The coupling is too tight! See [selectors.md](selectors.md) for how you can expose actions in a much
more loosely-coupled manner. In short, you should not be calling actions directly
this way; instead, expose actions as a prop for your components to invoke indirectly.

## Action map guidelines

Each key -- or action definition -- in your action map is converted
into an action-creator, and placed onto an `actions`
object in your model. In this example, the parser will unpack
your action definitions and create two action-creators:
`addTodo` and `removeTodo`.

After running your model through the model builder, the original action map is not used.

Each action definition must provide a reducer function for responding to that action.
The reducer will be called only when the given action is processed. So
there's no need for switch statements. The reducer is private and atomic.
A master reducer is created for you, and it delegates as needed.

You can optionally indicate what parameters are passed to the action
creator. The `params` property is an array of strings (parameter names).

And what of the initial state? You must
provide a fully-specified `initialState` object on the model.

```javascript
module.exports = reduxModelUtils.modelBuilder({
    name: 'todos',
    selectors,      // not shown in this example

    actionMap,
    initalState: {todos:[]}
});
```

## Asynchronous actions in an action map

To build an asynchronous action using an action map, omit the `reducer` key,
and instead include an `async` method
in your action definition. This is a function which takes a `params` object,
just as a normal reducer gets an `action` object as a parameter. The `async`
function can return a promise for chaining.

The action definition for an asynchronous action can also include a `params` key.

```javascript
let actionMap = {

    // some standard synchronous actions
    wait: {
      reducer: state => ({...state, {waiting: true}})
    },
    stopWaiting: {
      reducer: state => ({...state, {waiting: false}})
    }

    // example of an async action with no params: a one-second timer.
    // it returns a promise for chaining
    timer1000: {
        async: () => new Promise(resolve => setTimeout(resolve, 1000))
    },

    // a more typical async action
    save: {
        params: 'record',
        async(params) {
            // you can call synchronous actions inside an async action.
            model.actions.wait();

            // we return a promise, which callers can use for chaining.
            // we also invoke another synchronous action after the api returns.
            return api.save(params.recordID)
                      .then(model.actions.stopWaiting);
        }
    }
};

// keep a reference to the constructed model, so we can call its actions above
let model = reduxModelUtils.modelBuilder( /* ... */ );
export default model;

// ... then later, in your view ...
model.actions.save(44).then(closeForm);     // chain the returned promise
model.actions.timer1000().then(smile);
```

## Thunks vs. async actions

You can use thunks in action maps. They behave identically to asynchronous
actions. Simply use the `thunk` key instead of `async`.

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

## About action codes

Action codes are created for you automatically. You should not rely on
them; think of them as an internal impelementation detail.

However, you can override this behavior, and manually assign your own
action type. This is useful for two main reasons:

* If you have a hybrid Redux installation, where some actions are dispatched
  by a part of the app that is unaware of Redux Model Utils. By manually assigning
  the action's type, you can have your model listen for actions dispatched from
  other parts of your app.
* If you want multiple reducers in different models to respond to the same
  action. In this case, assign the same type to both handlers, and both reducers
  will be invoked.

To manually assign an action type, use the `actionType` property on an action definition:

```javascript
let actionMap = {
    addNotification: {
        actionType: 'MISC/NOTIFICATION/ADD',  // your own custom action type
        params:     ['text', 'link'],
        reducer:    (state, action) => {/* ... */}
    }
};
```

## Private actions inside an action map

There are good reasons to make actions that are private to your model.
For example, consider an async action that wraps an API call to retrieve
data from your server. After the API returns, you want to merge the data
into your store. But the merging operation should be private, only available
within the API action, and not to other components or views.

To make an action map with private actions is a two-step process.
First, add a key `private: true` to any action definition that
you want to keep private. Then, after your model is built, call
`severPrivateActions` to remove all private actions from the model's
`actions` object. This ensures that no other caller can use your action.

The `severPrivateActions` function will return a new set of action-creators:

```javascript
let actionMap = {
	    // this action is private. it's called after the (public) save
	    // operation is complete
	    _storeData: {
	        private: true,  // flag it
	        params: 'data',
	        reducer: (state, action) => ({...state, {data: action.data}})
	    },
	
	    // this is the public interface for saving data. when the
	    // api returns, we call the private action, to merge the
	    // new data into the store
	    save: {
	        params: 'recordID',
	        async(params) {
	            // note that the private action is not in the model's "actions" object
	            return api.save(params.recordID).then(
	                data => privateActions._storeData(data)
	            )
	        }
	    }
	},
	
	model = reduxModelUtils.modelBuilder( /* ... */ ),
	
	// here we remove all private actions from the model's actions object, and
	// attach them to a local variable which is only accessible inside this module
	privateActions = model.severPrivateActions();

export default model;


// ... then later, in your view ...
model.actions.save(44).then(closeForm);

// this will throw an error, since the private actions were severed
model.actions._storeData({});
```

In situations like this, you might also want to nest your actions, so that
the relationship between the `save` action and its own private `_storeData`
action is explicit.

## Nested actions

You can organize your action map however you like. Actions can be nested, giving you the
flexibility to group actions together. There is no technical limit to the depth of nesting.

Note that nested actions are not automatically private. 

```javascript
let actionMap = {

  // watch the nesting inside this action map:
  user: {
    // this action will be available as model.actions.user.load()
    load: {
      params: 'id',
      async: ({id}) => apiCall(id).then(userData => {
        // the private action "_store" is nested inside privateActions
        privateActions.user.load._store(userData);
      }),

      // this private action is used only here to store the result of the query.
      // it's nested inside "load" to clarify its relationship. and it's private
      // to prevent meddling outsiders from using it.
      _store: {
        private: true,
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

      model.actions.user.load(id)
      privateActions.user.load._store(userData)
      model.action.user.save(userData)

      model.actions.prefs.save(prefs)
*/
```

## Summary

Each action definition can have one or more of the following keys:

* `params`: an array of strings (parameter names) passed to the action (or thunk). If there is exactly
  one parameter, you can use a string instead of an array. If no parameters are required, you can
  omit this key.

* `reducer`: the atomic reducer for this action. Like any reducer in Redux, it is a pure function that takes
   two parameters: `state` and `action`.

* `async` or `thunk`: these are synonyms, and they are mutually exclusive, along with `reducer`. (You must provide
   exactly one key out of the three.) You do not modify the store directly in an async thunk. Instead, you can run
   asynchronous operations and fire off normal actions as needed. It takes a single parameter, an object containing
   the parameters defined in `params`. The return value of your thunk is passed back to the caller, to make it easy
   to chain promises.

* `actionType`: optionally indicate the action type (string) to be used for this action. 
   See the discussion above.

* `private`: a boolean. If true, the action will be marked as private, and included in the object returned
   by `severPrivateActions`, as described above.

If you include any other keys in an action definition, they must be objects that are also action maps.
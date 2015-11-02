
# Why? What do I get?

### Easy subscriptions

Here's the verbose way to set up a subscription:

```javascript
function select(state) {
  return state.some.deep.property;
}

let currentValue;
function handleChange() {
  let previousValue = currentValue;
  currentValue = select(store.getState());

  if (previousValue !== currentValue) {
    console.log('Some deep nested property changed from', previousValue, 'to', currentValue);
  }
}

let unsubscribe = store.subscribe(handleChange);
```

Here's our way. Your callback is only invoked when the value has changed, so you can
usually omit the second parameter. Notice that the view only speaks to the model,
not the store.

```javascript
let unsubscribe = users.subscribe(users.selectors.userList, (users, previousUserList) => {
    console.log('User list changed from', previousUserList, 'to', users);
});
```

### Handy action-creation

The `makeActionCreator()` code is standard-issue; we're all using it.
Note that this will bundle a call to `store.dipsatch()`, which is why the
use of this function is optional.

```
let addTodo = reduxUtils.makeActionCreator('ADD_TODO', 'text');
addTodo('Sell car');
```

There's also a friendly way to manage your async actions.

```javascript
let query = reduxUtils.makeAsyncAction(args => {
            
        // run a synchronous action
        invalidateCache();
    
        // start an asyc operation
        retreiveDataFor(args.username, newData => {
    
            // when it's done, run another synchronous action
            setUserData(newData);
        });
    }, 'username');
query('jeff');
```

### Add instant functionality

Adding a spinner to your async operations just got trivial. In one
line of code, you can add two actions to your model (`wait()` and 
`stopWaiting()`) and a boolean flag to the store (`waiting`).

Similarly, adding undo to your model with [redux-undo](https://github.com/omnidan/redux-undo)
is super-easy. With one line of code, you get `undo()` and `redo()`
actions, as well as observables for tracking the size of the undo stack.

The code required to add these features is very simple, but needs some 
explanation, so we'll defer for a bit.
 
### Common object-management utilities

In addition to `clone()`, which does a deep copy of an object, there are several other
utilities for working with objects, including `lookup()`, `assign()` and `cloneAndAssign()`.
These are described below.

# Setup

### Internal dependencies

This library uses `node-clone`, `deep-assign`, and of course `redux`. 


### Installation & project setup

To install:

```
npm install --save jbellsey/redux-utils
```

In addition, you must make the following changes or additions to your code:

* If you use the async action creator, you must install and set up `redux-thunk`
* If you use the undoable feature, you must install `redux-undo`
* You must use `combineReducers()` to build your map of reducers, even if you only have one.
  The library expects the stores to be managed separately, one per model, which `combineReducers()`
  does for you. There is a utility method `buildReducerMap()` to make this easy.
* Immediately after creating your store, you must call `setStore()`

# Context

This library is not tied to React. You can use it with jQuery apps if that's your thing.
(Not that there's anything wrong with that.)

However, you can easily use it in a React app. Details below.

# Model structure

Part of the power of this library is not just in the functions it provides, but in
the structure it imposes on your models.

```javascript
var model = {

    //--- required properties
    
    name,       // string
    
    reducer,    // your reducer function
    actions,    // object; lists available action-creators
    selectors,  // object; see below

    //--- optional properties
    
    options     // object; options for model creation
}

// before exporting your model, run it through this munger. see below.
module.exports = reduxUtils.modelBuilder(model);
```

You must provide a `name` for your model, which must be globally unique, but
not necessarily sluggish. (I.e., it can have mixed case and/or punctuation.)

You must have a `reducer` property, which points to your reducer function.
There is nothing special about its signature; just build a normal reducer. See the
full example below.

You must provide a list of `selectors`. These are strings or functions that are used
to select specific properties in your model's store, and are described in the next
section. One selector is needed for each observable property. You may also choose
to define selectors for properties that are not externally observable, but are only 
needed inside the reducer. That's up to you.

You should (but do not need to) provide a list of `actions`. These are the publicly 
available action creators for interacting with your model. 

You can optionally pass in some **magic triggers**. At present, there are two:
`waitable` and `undoable`. Setting these flags will install some custom actions
and selectors on your model; details below.

# About selectors

Selectors are roadmaps; they hold the algorithm to finding a specific property in
your store.

They come in two forms. Each has its advantages and disadvantages, but they are
both fully implemented.

A **string** selector is a representation of the path to the property in dot notation.
A **function** selector maps a `state` object to a property nested inside.

So for an object like this:
```javascript
let store = {
    userID: 0,
    preferences: {
        colorScheme: 'dark',
        fontSize: 'large'
    }
};
```
You would define selectors in one of these two ways:
```javascript
let stringSelectors = {
    userID:      'userID',
    colorScheme: 'preferences.colorScheme',
    fontSize:    'preferences.fontSize'
};
// or
let functionSelectors = {
    userID:      state => state.userID,
    colorScheme: state => state.preferences.colorScheme,
    fontSize:    state => state.preferences.fontSize
};
```

### Strings vs. functions

Functions are hip. They compose. They're fun to write.

Strings are old-skool. They seem more brittle. They don't tell your IDE anything about semantic content.

The main purpose for writing selectors in the first place is to hide your implementation
from consumers (i.e., views). Views will typically need to know nothing about your internal data structures.
The secondary purpose is to keep your reducer code clean.
 
A view uses your selectors in the `subscribe()` function, which accepts either strings or functions. So from the
perspective of writing your views, there's literally no difference. 

Inside your model code, however, you may find strings handy. If you're not composing selectors (and
you're probably not), we have some convenient utility methods for setting a model property, but only
if you use string selectors. And if you use lodash (e.g., `pluck`), you may find strings particularly useful.

To put it another way: a selector _string_ can be used for both reading and writing state.
A selector _function_ can only be used for reading.

### Selector strings

```javascript
// a string selector is usable in the reducer. keeps things dry.
var locationSelectorString = 'preferences.location';

function reducer(state = initialState, action = {}) {

    switch (action.type) {
    
        case actionCodes.SET_LOCATION:
            // so nice. even the reducer doesn't expressly know about the model structure
            return reduxUtils.cloneAndAssign(state, locationSelectorString, action.location);
    }
    return state;
}
```
In one line of code, you duplicate the state and change one deeply-nested property. But this
only works with a string selector. To do the same with a function selector, well, you can't.
You have to do it manually. 

### Selector functions

A selector function may be beneficial in many ways. But one way it falls short is that it's
unusable inside your reducer. 

```javascript
// a function selector is not usable inside the reducer
var locationSelectorFunc = state => state.preferences.location;

function reducer(state = initialState, action = {}) {

    switch (action.type) {
    
        case actionCodes.SET_LOCATION:
            // more verbose. and less dry.
            return reduxUtils.cloneAndMerge(state, {
                preferences: {
                    location: action.location;
                }
            });
    }
    return state;
}
```
Here we've used our `cloneAndMerge()` function to duplicate the state and merge
in the new location value. 

The merge operation uses
[deep-assign](https://github.com/sindresorhus/deep-assign), which is a smarter
version of `Object.assign()`. The latter (and all polyfills) will clobber the entire 
`preferences` object, so if you had other keys, they would be lost when the user only wanted
to set the location. The `deep-assign` library solves that problem, which is why
it's used as a helper in this library.

But you still have the verbosity problem. If you prefer the longer version, go for it. 

# Actions

Here is a map of actions. It is not strictly required by any of the library code, but as a pattern
it is quite useful. This is a typical way to construct the map inside your model:

```javascript
// putting codes into an object is not mandatory. it's handy for staying dry, since
// the codes are used for creating actions and for responding to them.
//
let actionCodes = {
    CTR_INCR: 'CTR_INCR',
    CTR_DECR: 'CTR_DECR'
};

// the action creators are Standard Issue. we just wrap them into a mapping object
//
let actions = {
    incr: reduxUtils.makeActionCreator(actionCodes.CTR_INCR, 'value'),
    decr: reduxUtils.makeActionCreator(actionCodes.CTR_DECR, 'value')
};
```

When you export the `actions` object, your view code can invoke actions easily
by calling your code like this: `model.actions.incr(4)`. 

Of course, if you prefer your actions to be objects, or functions without
an automatic dispatch, you can create them that way as well. This library 
adds shorthand for many common patterns, but doesn't prevent you from using
your own.

```javascript
// you can do this too; it's standard redux.
//
let actions = {
    incr: (value) => { type: actionCodes.CTR_INCR, value },  
    decr: (value) => { type: actionCodes.CTR_DECR, value }  
}

// ... then, in your view, you need to import redux, so you can use dispatch:
//
dispatch(model.actions.incr(4))
```

# OMG JUST SHOW ME

Here's a full example of a model which manages the geolocation of your device.
It's simple but shows off many of the features of this library, as well as some
useful patterns for constructing models. 

This model has one public action (`getLocation()`),
which triggers an async request to the browser for its latitude and longitude.
It has one private action (`setLocation()`), which is called after we get the
coordinates back from the API. There is
one observable property (`location`), which is an object with the device's
coordinates.

The view code will be shown next.

```javascript
var   reduxUtils  = require('redux-utils');

const // prepare an empty store. you're doing this already.
      initialState = {
          location: {}
      },
      // dot-notation strings to look at properties of our model, as described above.
      // in our case, the model is only one level deep, so there are no dots :)
      selectors = {
          location: 'location'
      },
      // action codes are not exported; they are private to the model
      actionCodes = {
          SET_LOCATION: 'SET_LOCATION'
      },
      // these private actions are also not exported. the "setLocation" action is synchronous
      privateActions = {
          setLocation: reduxUtils.makeActionCreator(actionCodes.SET_LOCATION, 'location')
      },
      // this list of actions (only one in this case) is exported and public. there are
      // two additional public actions (wait and stopWaiting) that are installed because
      // we set the "waitable" option on the export statement below.
      actions = {
          // querying the device location is async. we have a tool for that.
          // also, the action itself takes no parameters.
          getLocation: reduxUtils.makeAsyncAction(() => {

              // create some callbacks for the geolocation API
              let err = () => {
                      privateActions.setLocation({});
                      
                      // this (synchronous) action is magically installed because 
                      // we flagged the model as "waitable"
                      actions.stopWaiting();
                  },
                  success = position => {
                      privateActions.setLocation({
                          latitude:  position.coords.latitude,
                          longitude: position.coords.longitude
                      });
                      actions.stopWaiting();
                  };

              // run a synchronous action, which is installed by our use of "waitable" below
              actions.wait();

              // do the actual work: ask the browser where it is
              if (navigator && "geolocation" in navigator)
                  navigator.geolocation.getCurrentPosition(success, err, {maximumAge: 60000});
              else
                  err();
          })
      };

// nothing to see here; just a normal reducer
function reducer(state = initialState, action = {}) {

    switch (action.type) {
        case actionCodes.SET_LOCATION:
            // use the provided function "cloneAndAssign" to keep the reducer pure.
            // note the use of "selectors.location", which tells the copier what property
            // to overwrite. in other words, here is the impure version of what we're doing:
            //      state.location = action.location
            return reduxUtils.cloneAndAssign(state, selectors.location, action.location);
    }
    return state;
}

// run the model object through a custom tool ("modelBuilder"), which whips it into shape
module.exports = reduxUtils.modelBuilder({

    name: 'geo',

    // this causes two new actions to be installed (wait and stopWaiting), and a new
    // property on the model called "waiting"
    options: {
        waitable: true
    }

    // export the core attributes of the model
    reducer,
    actions,
    selectors
});
```

The view which uses the model is utterly trivial. Note that it doesn't need to 
import either `redux` or `redux-utils`; just the relevant model.

```javascript
var geo     = require('./models/geo'),
    btn     = document.getElementById('geoTrigger'),
    output  = document.getElementById('geoOutput');

// trigger a model action when the button is clicked
btn.addEventListener('click', () => geo.actions.getLocation());

// listen for changes to the location
geo.subscribe(geo.selectors.location, loc => {
    // do something with the new data. e.g.:
    output.innerHTML = JSON.stringify(loc);
});

// listen for changes to the "waiting" flag, so we can put up a spinner
geo.subscribe(geo.selectors.waiting, waiting => {
    // do something with the new data. e.g.:
    console.log('waiting for location data:', !!waiting);
});

```

# Magic triggers

Triggers are set by listing them on the `options` property of your model.

### Waitiable

The purpose of this feature is to make it easy to build a spinner
for your async operations.

A "waitable" model will be modified to provide two new actions 
(`wait()` and `stopWaiting()`) and an observable property (`waiting`).
You will also get a selector (`model.selector.waiting`) to assist
in subscribing to changes.

Calling the new actions doesn't actually do anything other than
modify the value of `waiting`. You have to manage the spinner yourself
in the view. Keep in mind that these new actions have a built-in call
to `dispatch()`.

The actions do not nest; the `waiting` property is currently a boolean,
not a stack size.

To request this functionality on your model, add it to an `options` object:

```javascript
module.exports = reduxUtils.modelBuilder({

    name: 'geo',
    options: {
        waitable: true  // <= that's it
    }
    reducer,
    actions,
    selectors
});
```

See the full example above for a waitable in action, complete with
actions and a subscriber.
 
### Undoable

There is also a magic trigger to convert a model into an undoable.
This operates similarly to a waitable, in that this trigger installs
some new actions and new observables. 

Note that the actual undo functionality is provided by the
[redux-undo](https://github.com/omnidan/redux-undo) library. You must
install this library yourself if you request undoable models. Also,
this "magic undo" feature is optional. You can instead install and 
configure `redux-undo` in any way you like.

Setting the undoable trigger will provide your model with two new actions (`undo()`
and `redo()`), each of which has a built-in call to `dispatch()`.
You also get two observable properties `undoLength` and `redoLength`,
which track the size of the corresponding stacks. Selectors of the same names are
also created and installed into your model's `selectors` object.

To use this functionality in your model, you must pass in a reference
to the `redux-undo` plugin. You can also (optionally) pass a configuration 
object, which is passed through to the plugin.

When you request undoable functionality, your list of selectors will be modified.
This is because `redux-undo` modifies the structure of your store; the current 
state of your model is now embedded inside a `present:{}` object. 
Any code outside your reducer needs to look one level deeper to access
the current state of the model. 

So if you have a selector string for `todos`, it will be converted to 
`present.todos` for you. (Or, if you're using a selector
function, it will be composed with `state => state.present`.) This is all handled
for you behind the scenes.

Inside your reducer, the `state` object you are given to work with is already
scoped inside the `present` object, so your selectors do not need to dereference it.
The easiest way to manage this duality is to keep a reference to your original
`selectors` object, and use that inside your reducer. Views will see the dereferenced
selectors, and your reducer will see the originals.

The following example shows how to set up your model. The use of the undoable
actions and observables is left as an exercise for the reader. 

```javascript
// load the plugin. you might use 'import', if you're into that kind of thing
let reduxUndo = require('redux-undo');

module.exports = reduxUtils.modelBuilder({
    name: 'todos',
    options: {
        undoable: {
            // pass in the entire plugin
            plugin: reduxUndo,
            
            // this config object is passed to the plugin
            config: {
                filter: reduxUndo.distinctState()
            }
        }
    },
    reducer,
    actions,
    selectors
});
```

# Usage with React

This library was designed to make redux more usable in all your apps, whether or
not they use React. If you do use React, here's what you need to do.

First, you must import and set up the [react-redux](https://github.com/rackt/react-redux/)
library. Then, in your model:

```javascript
module.exports = reduxUtils.modelBuilder({
    name: 'todos',
    options: {
        react: {}   // <= yes, an empty object
    },
    reducer,
    actions,
    selectors
});
```

The empty object on `options.react` is a trigger to install the functionality described
next. It's an object rather than a boolean to allow for expansion in the future.

When you request React features in your model, you will get a new selector map
called `reactSelectors`. You pass this map to the `connect()` function provided
by `react-redux`.

Note that in order to use this feature, your selectors must be functions rather than
strings.

In addition, your model will be given a new method `newID()`, which you can use to
assign a unique ID to your model elements. Do not persist this ID to your database,
as it creates IDs that are not guaranteed to be globally unique. If you need a true
guid, or if you prefer to generates IDs another way, feel free to ignore this method.

Here's a fuller example:

```javascript
// YOUR MODEL.js
//
export var TodoModel = reduxUtils.modelBuilder({
    name,
    reducer,
    actions,
    selectors,
    options: {react:{}}
});
```
```javascript
// YOUR COMPONENT.js
//
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {TodoModel} from './todo-model.js';

// do not export your component
class TodoList extends Component {

    // ~ snip ~

    // you can call your model's actions inside event handlers 
    addNote() {
        TodoModel.actions.add('OMG duuuuude');
    }
}

// export the result of the connect function
export default connect(
    TodoModel.reactSelectors    // <= this selector map is created for you
)(TodoList);

// you can use the decorator form instead if you prefer:
// @connect(TodoModel.reactSelectors) ...
```

That's it. To recap:

* Build your selector map using functions (no strings, sorry!)
* Add `options: { react: {} }` to your model
* Use your model's new `reactSelectors` object in the `connect()` function of react-redux.

# API

The API is roughly separated into three contexts:
* Tools for **model building**
* Tools for **project setup**
* Tools for **views**

### Model-building tools

This library expects your models to have a particular structure. Please see
the section above for a full explanation.

##### modelBuilder(model)

You must run your model through this utility before exporting it. It has no
options.

```javascript
module.exports = reduxUtils.modelBuilder({
    name: "reddit",
    reducer,
    actions,
    selectors
});
```

##### makeActionCreator(type, ...argNames)

You're probably already doing this. See [the docs](http://rackt.org/redux/docs/basics/Actions.html).
This version is not any different. Note that actions invoked this way are dispatched for you.
If you need a different way to dispatch, or if you need action objects without a built-in
dispatch, just don't use this tool.

```javascript
let actions = {
    incr:  reduxUtils.makeActionCreator('CTR_INCR', 'value'),
    decr:  reduxUtils.makeActionCreator('CTR_DECR', 'value'),
};
```

##### makeAsyncAction(cb, ...argNames)

This utility enables easy async actions. **Note**: if you use this tool, you must
also install and configure [redux-thunk](https://github.com/gaearon/redux-thunk).

The callback's signature is `args => {}`, where `args` is an object map of the 
arguments you indicate in `argNames`. The callback does not return any value.

Here's a common pattern for running an AJAX query:

```javascript
// these private actions are used inside async actions. they are not exposed.
// also, this example doesn't include the reducer code for them.
//
let privateActions = {
    
    // this action might invalidate the cache
    startQuery: reduxUtils.makeActionCreator('QU_START'),
    
    // this will store the results in your model when the query is finished
    endQuery:   reduxUtils.makeActionCreator('QU_END', 'results')
},
let actions = {
    // make an async action that takes one argument ('username').
    // it will be invoked in your view code like this:
    //      model.query('harry');
    query: reduxUtils.makeAsyncAction(argObj => {

        // run a synchronous action, perhaps to invalidate the cache.
        // you might also call 'actions.wait()' if your model is a waitable
        //
        privateActions.startQuery();

        // start the async operation
        fetch(`http://myapi.com/u/${argObj.username}`)
              .then(response => {
              
                  // query is done. run another synchronous action to store the data.
                  // you might also call 'actions.stopWaiting()'
                  privateActions.endQuery(response);
              });
    }, 'username')
};
```

##### makeCodes(codes)

To keep your models dry, you will typically assign action codes to constants. That
way you can use the same code in an action creator and in your reducer.

This is a common pattern for setting up action codes:

```javascript
let actionCodes = {
    CTR_INCR: 'CTR_INCR',
    CTR_DECR: 'CTR_DECR'
}
```

The `makeCodes()` utility lets you skip half of the typing by using an array instead.

```javascript
let actionCodes = makeCodes([
    'CTR_INCR',
    'CTR_DECR'
]);
```

The result is the same: an object map of keys and strings. The benefit of using this
utility is usually minimal, but may be useful when building longer lists. The 
downside is that your IDE may provide less assistance with autocompletion.

##### clone(obj)

Makes a full deep clone of the object. Uses the excellent [clone](https://github.com/pvorb/node-clone)
library. 

##### cloneAndMerge(sourceObject, ...mergeOjects)

First, makes a full copy of `sourceObject`. It then uses `deep-assign` to 
overwrite (or merge) properties from the provided `mergeObjects`. This is
typically a more robust operation than using `Object.assign()`, as discussed above.

```javascript
let store = {
    userID: 0,
    preferences: {
        colorScheme: 'dark',
        fontSize: 'large'
    }
};

// create a full copy of store, overwriting a single property.
// this is your most basic and useful pattern for reducers
//
let newStore = cloneAndMerge(store, {
    preferences: {
        colorScheme: 'light'   // does not overwrite any other properties        
    }
});
// => {userID: 0, preferences: {colorScheme: 'light', fontSize: 'large'}}
```

##### cloneAndAssign(obj, selectorString, newValue)

This is a special-purpose version of `cloneAndMerge`. It does
a single property replacement inside a deep object. (Sounds like something
you might do in a reducer, perhaps?)

This function first makes a full clone of `obj`. It then uses the selector string (in dot
notation, as described above; functions not allowed!) to push `newValue` into the 
appropriate place in the new object.

```javascript
let store = {
    userID: 0,
    preferences: {
        colorScheme: 'dark',
        fontSize: 'large'
    }
};

let newStore = reduxUtils.cloneAndAssign(store, 'preferences.fontSize', 'small')
// => {userID: 0, preferences: {colorScheme: 'dark', fontSize: 'small'}}
```

You will probably use these two functions (`cloneAndAssign` and `cloneAndMerge`)
in your reducer for almost every action. Here is a more complete example that has a string 
and an array of objects in the store:

```javascript
var reduxUtils = require('redux-utils');

const
    initialState = {
        todos: [],
        listName: 'my todo list'
    },
    selectors = {
        todos:    'todos',      // this example uses strings; see the reducer below
        listName: 'listName'
    },
    actionCodes = {
        ADD_TODO:      'ADD_TODO',
        SET_LIST_NAME: 'SET_LIST_NAME'
    },
    actions = {
        addTodo:     reduxUtils.makeActionCreator(actionCodes.ADD_TODO, 'text'),
        setListName: reduxUtils.makeActionCreator(actionCodes.SET_LIST_NAME, 'text')
    };

function reducer(state = initialState, action = {}) {

    switch (action.type) {

        // for arrays, we use 'clone()' on the state object to duplicate it first. 
        // this also duplicates the internal array. selectors (strings or functions)
        // aren't useful here; we have to directly manipulate the state object.
        //
        case actionCodes.ADD_TODO:
            state = reduxUtils.clone(state);
            state.todos.push({
                text: action.text,
                completed: false
            });
            return state;

        // for scalar properties, we use 'cloneAndAssign()' with a selector string.
        // we like one-liners.
        case actionCodes.SET_LIST_NAME:
            return reduxUtils.cloneAndAssign(state, selectors.listName, action.text);
    }
    return state;
}

module.exports = reduxUtils.modelBuilder({
    name: 'todos',
    reducer,
    actions,
    selectors
});
```

##### assign(obj, selectorString, newValue)

This function performs the same operation as `cloneAndAssign()`, except ... _wait for it_ ...
without cloning the object first. It is destructive, impure, and all sorts of other 
mean, nasty things. Use with caution.

This function accepts selectors in string form only.

##### lookup(obj, selector)

Provides a read operation inside your object, using the provided selector.
This complements the write operation provided by `assign()` and `cloneAndAssign()`.
You probably won't need to use this.

Because this is a read operation, the selector can be either a string or a lookup function.

### Setup tools

These tools will be used inside your main store creation operation. In fact, 
before we look at the APIs themselves, here's an example of a store setup routine.

Every line of code in the following example is required. You may use a different
syntax (e.g., `import` instead of `require`), and you may have additional middleware
to install, but you may not omit anything in the setup example here. 

```javascript
var redux      = require('redux'),
    thunk      = require('redux-thunk'),
    reduxUtils = require('redux-utils'),

    models = [
        require('./models/appdata'),
        require('./models/todos')
        // ... etc
    ],

    createStoreWithMiddleware = redux.applyMiddleware(thunk)(redux.createStore),

    // prepare an object for combineReducers
    allReducers = reduxUtils.buildReducerMap(models),

    // unify all models into a single reducer
    masterReducer = redux.combineReducers(allReducers),

    masterStore = createStoreWithMiddleware(masterReducer);

reduxUtils.setStore(masterStore);
module.exports = masterStore;
```

The one exception: if your app does not use async actions, you can omit the
installation and setup of `redux-thunk`.


##### buildReducerMap(modelArray)

See the example above. This takes an array of models, and prepares them for 
passing to `combineReducers()`. The result is an object whose keys are the
model names (provided by you as a `name` property on each model), and whose
values are the reducers for each model.

You can do this manually if you prefer.

##### setStore(store)

You must call this immediately after creating your store. That is all.

##### getStore()

You probably won't need to use this, but it's available.

### View-related tools

There is only one additional tool that you'll use in your view code.

##### subscribe(selector, cb, opts)

Here `selector` is a provided by the model, and may be either a string or a function.
`cb` is your handler for responding to changes in the model, and
`opts` allow you to configure the subscription.

The signature of the callback is `(newValue, previousValue) => {}`. In most
situations, you won't even need the previous value, since the callback is only
invoked when the portion of the model referenced by `selector` changes. So you'll
typically use a simpler signature: `newValue => {}`.

The options object currently accepts only one attribute: `noInit`. If you set 
this to `true`, your callback will not be invoked at initalization time. In most
cases, you should omit this option, as you'll want your callback to get initialized
with a starting value.

The `subscribe` function passes back the same `unsubscribe` hook that you get from
the redux store.

Here's some code from a view. It's not complete, but shows the typical subscription
pattern.

```javascript
var todos = require('./models/todos');

todos.subscribe(todos.selectors.todos, todoList => {
    // do something with the new data
    console.log('todos changed', todoList);
});
```
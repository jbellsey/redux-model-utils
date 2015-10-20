
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
usually omit the second parameter.

```javascript
let unsubscribe = users.subscribe(users.accessors.userList, (users, previousUserList) => {
    console.log('User list changed from', previousUserList, 'to', users);
});
```

### Handy action-creation

The `makeActionCreator()` code is standard-issue; we're all using it. But it's included
here as well:

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

Similarly, adding undo to your model with the [redux-undo](https://github.com/omnidan/redux-undo)
is super-easy. With one line of code, you get `undo()` and `redo()`
actions, as well as observables for tracking the size of the undo stack.

The code required to add these features is very simple, but needs some 
explanation, so we'll defer for a bit.
 
### Common object-management utilities

In addition to `copy()`, which does a deep copy of an object, there are several other
utilities for working with objects, including `lookup()`, `assign()` and `copyAndAssign()`.
These are described below.

# Setup

### Internal dependencies

This library uses `deep-assign`, and of course `redux`. It doesn't use any other external code.


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

Just a quick note: I'm not currently using this with React, because I'm a dinosaur,
or because I haven't had the need to use React yet. Therefore this library neither
depends on React or expects you to be using it. You should be able to make good use
of the tools and patters regardless how you manage your views.

And the sample code all uses CommonJS module management, because I'm still using
browserify for most of my projects. It will work fine with JSPM and SystemJS.

I've even used this with a jQuery app. Dinosaur.

# Model structure

Part of the power of this library is not just in the methods it provides, but in
the structure it imposes on your models.

```javascript
var model = {

    //--- required properties
    
    name,       // string
    
    reducer,    // your reducer function
    actions,    // object; lists available action-creators
    accessors,  // object; see below

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

You must provide a list of `accessors`. These are strings, described in the next
section. One accessor is needed for each observable property. You may also choose
to define accessors for properties that are only needed inside the reducer.

You should (but do not need to) provide a list of `actions`. These are the publicly 
available actions for interacting with your model. 

You can optionally pass in some **magic triggers**. At present, there are two:
`waitable` and `undoable`. Setting these flags will install some custom actions
and accessors on your model; details below.

# About accessors

Accessors are strings which define how to find a property in your store.
They are simply the representation of the path to the property, in dot notation.

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
You would define an accessor to the `colorScheme` property as a string: `"preferences.colorScheme"`:

```javascript
let accessors = {
    userID:      'userID',
    colorScheme: 'preferences.colorScheme',
    fontSize:    'preferences.fontSize'
    
    // the following accessor is possible, but not recommended, because clients 
    // would need to know about and micromanage your store structure:
    //    preferences: 'preferences'
};
```

You make your accessors public to minimize the exposure of your model structure. Consumers will
typically need to know nothing about your internal data structures.

Why use a string instead of an accessor function? You could instead use something like this:
```javascript
let colorSchemeSelector = (state) => state.preferences.colorScheme;
```

The main reason to prefer strings is that `Object.assign()` is over-eager when dealing with
nested properties. For example, to set the color scheme with `Object.assign()`, you would normally 
*try* to write it this way:

```javascript
let newState = Object.assign({}, state, {
    preferences: {
        colorScheme: newScheme
    }
});
```
In fact, this will overwrite the *entire* preferences store, clobbering any other keys like `fontSize`.
So you have to take special care when working with nested objects. Too much care.

One solution is to use [deep-assign](https://github.com/sindresorhus/deep-assign).
If you simply replaced the call to `Object.assign()` above with `deep-assign`, then you would 
have the desired behavior. 

However, the other reason to use an accessor string is that reading and writing should look
the same. If you use a state accessor function (see above), you can't write something like
```javascript
colorSchemeSelector(state) = 'light';   // FAIL
```

You could write a more sophisticated accessor function that intelligently handles reads and
writes, but the amount of boilerplate just doubled on a core piece of functionality.

Our solution is to use an accessor string, and let the utilities library manage 
deeply-nested objects. Reads and writes use the same accessor. Simple. See the full example below
to see how this plays out.


# Actions

Here is a map of actions. It is not strictly required by any of the library code, but as a pattern
it is quite useful. Here is a typical way to construct the map inside your model:

```javascript
// putting codes into an object is not mandatory, but it's handy for staying dry
let actionCodes = {
    CTR_INCR: 'CTR_INCR',
    CTR_DECR: 'CTR_DECR'
};
// the action creators are Standard Issue. we just wrap them into a mapping object
let actions = {
    incr: reduxUtils.makeActionCreator(actionCodes.CTR_INCR, 'value'),
    decr: reduxUtils.makeActionCreator(actionCodes.CTR_DECR, 'value')
};
```

When you export the `actions` object, other code can invoke actions easily
by calling `model.actions.incr(4)`, for example.

# OMG JUST SHOW ME

Here's a full example of a model which manages the geolocation of your device.
It's simple but shows off many of the features of this library, as well as some
useful patterns for constructing models. 

This model has one public action (`getLocation()`),
which triggers an async request to the browser for its latitude and longitude.
It has one observable property (`location`), which is an object holding the device's
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
      accessors = {
          location: 'location'
      },
      // these action codes are not exported; they are private to the model
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
          // querying the device location is async. the action itself takes no parameters.
          getLocation: reduxUtils.makeAsyncAction(() => {

              // create some callbacks for the geolocation API
              let err = () => {
                      privateActions.setLocation({});
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
function reducer(state = initialState, action = 0) {

    switch (action.type) {
        case actionCodes.SET_LOCATION:
            // use the provided function "copyAndAssign" to keep the reducer pure.
            // note the use of "accessors.location", which tells the copier what property
            // to overwrite. in other words, here is the impure version of what we're doing:
            //      state.location = action.location
            return reduxUtils.copyAndAssign(state, accessors.location, action.location);
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
    accessors
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
geo.subscribe(geo.accessors.location, loc => {
    // do something with the new data. e.g.:
    output.innerHTML = JSON.stringify(loc);
});

// listen for changes to the "waiting" flag, so we can put up a spinner
geo.subscribe(geo.accessors.waiting, waiting => {
    // do something with the new data. e.g.:
    console.log('waiting for location data:', !!waiting);
});

```

# Magic triggers

Triggers are set by listing them on the `options` property of your model.

### Waitiable

A `waitable` model will be modified to provide two new actions 
(`wait()` and `stopWaiting()`) and an observable property (`waiting`).
Calling these actions doesn't actually do anything other than
modify the value of `waiting`. 

The purpose of this feature is to make it easy to build a spinner
for your async operations.

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
    accessors
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
install this library yourself if you request undoable models.

An undoable model will provide two new actions (`undo()`
and `redo()`) and two observable properties (`undoLength` and `redoLength`,
which track the size of the corresponding stacks).

To install this functionality in your model, you must pass in a reference
to the `redux-undo` plugin, and an optional configuration object. The
configuration object is passed through to the plugin.

When you request undoable functionality, your accessor strings will also be modified
in place. This is because `redux-undo` modifies the structure of your store.
Any code outside your reducer needs to look one level deeper to access
the current state of the model. So if you have an accessor string for `todos`, 
it will be converted to `present.todos` for you.

The following example shows how to set up your model. The use of the 
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
                filter: distinct()
            }
        }
    },
    reducer: reducer,
    actions,
    accessors
});
```

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
    accessors
});
```

##### makeActionCreator(type, ...argNames)

You're probably already doing this. See [the docs](http://rackt.org/redux/docs/basics/Actions.html).
This version is not any different.

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
//
let privateActions = {
    
    // this might invalidate the cache, for example
    startQuery: reduxUtils.makeActionCreator('QU_START'),
    
    // this will store the results in your model
    endQuery:   reduxUtils.makeActionCreator('QU_END', 'results')
},
let actions = {
    // make an async action that takes one argument ('username').
    // it will be invoked like this:
    //      model.query('harry');
    query: reduxUtils.makeAsyncAction(argObj => {

        // run a synchronous action, perhaps to invalidate the cache.
        // you might also call 'actions.wait()' if your model is a waitable
        //
        privateActions.startQuery();

        // start the async operation
        fetch(`http://myapi.com/u/${username}`)
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

##### copy(obj)

Returns a deep copy of `obj`. This is useful when you have an array in your 
model (such as `todos[]`), and need to duplicate the state inside your reducer.

See the full example below, in `copyAndAssign()`.

##### copyAndAssign(obj, accessor, newValue)

This function makes a full copy of `obj`. It then uses the accessor string (in dot
notation, as described above) to push `newValue` into the appropriate place in the 
new object.

```javascript
let store = {
    userID: 0,
    preferences: {
        colorScheme: 'dark',
        fontSize: 'large'
    }
};

let newStore = reduxUtils.copyAndAssign(store, 'preferences.fontSize', 'small')
// => {userID: 0, preferences: {colorScheme: 'dark', fontSize: 'small'}}
```

This function will probably be used in your reducer, for every action that uses
a property that isn't an array. Here is an example that has a string and an array
in the store:

```javascript
var reduxUtils  = require('redux-utils');

const
    initialState = {
        todos: [],
        listName: 'my todo list'
    },
    // dot-notation strings; provides a roadmap inside the state object
    accessors = {
        todos:    'todos',
        listName: 'listName'
    },
    actionCodes = {
        ADD_TODO:      'ADD_TODO',
        RENAME_TODO:   'RENAME_TODO',
        SET_LIST_NAME: 'SET_LIST_NAME'
    },
    actions = {
        addTodo:     reduxUtils.makeActionCreator(actionCodes.ADD_TODO, 'text'),
        renameTodo:  reduxUtils.makeActionCreator(actionCodes.RENAME_TODO, 'index', 'text'),
        setListName: reduxUtils.makeActionCreator(actionCodes.SET_LIST_NAME, 'text')
    };

function reducer(state = initialState, action = 0) {

    switch (action.type) {

        // for arrays, we use 'copy()' directly on the state object to duplicate it first.
        // accessor strings aren't useful here; we directly manipulate the new state object
        case actionCodes.ADD_TODO:
            state = reduxUtils.copy(state);
            state.todos.push(action.text);
            return state;

        case actionCodes.RENAME_TODO:
            state = reduxUtils.copy(state);
            state.todos[action.index] = action.text;    // error checking omitted
            return state;

        // for string properties, we use 'copyAndAssign()' with an accessor
        case actionCodes.SET_LIST_NAME:
            return reduxUtils.copyAndAssign(state, accessors.listName, action.text);
    }
    return state;
}

module.exports = reduxUtils.modelBuilder({
    name: 'todos',
    reducer,
    actions,
    accessors
});
```

##### assign(obj, accessor, newValue)

This function performs the same operation as `copyAndAssign()`, except ... wait for it ...
without copying the object first. It is destructive, impure, and all sorts of other 
mean, nasty things. Use with caution.

##### lookup(obj, accessor)

Provides a read operation inside your object, using the dot-notation accessor.
This complements the write operation provided by `assign()` and `copyAndAssign()`.
You probably won't need to use this.


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

You shouldn't need to use this, but it's available.


### View-related tools

There is only one additional tool that you'll use in your view code.

##### subscribe(accessor, cb, opts)

Where `accessor` is a dot-notation string provided by the model,
`cb` is your handler for responding to changes in the model, and
`opts` allow you to configure the subscription.

The signature of the callback is `(newValue, previousValue) => {}`. In most
situations, you won't even need the previous value, since the callback is only
called when the portion of the model referenced by `accessor` changes. So you'll
typically use a simpler signature: `newValue => {}`.

The options object currently accepts only one attribute: `noInit`. If you set 
this to `true`, your callback will not be invoked at initalization time. In most
cases, you should omit this option, as you'll want your callback to get initialized
with a starting value.

The `subscribe` function passes back the same `unsubscribe` hook that you get from
calling it directly on a redux store.

Here's some code from a view. It's not complete, but shows the typical subscription
pattern.

```javascript
var todos = require('./models/todos');

todos.subscribe(todos.accessors.todos, todoList => {
    // do something with the new data
    console.log('todos changed', todoList);
});
```
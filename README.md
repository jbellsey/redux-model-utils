
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
    console.log('Some deep nested property changed from', previousUserList, 'to', users);
});
```

### Handy action-creation

The `makeActionCreator()` code is standard-issue; we're all using it. But it's included
here as well:

```
let addTodo = reduxUtils.makeActionCreator('ADD_TODO', 'text');
addTodo('Sell car');
```

We've also included a friendly way to manage your async actions.

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

### Add a "waiting" flag

Adding a spinner to your async operations just got trivial. In one
line of code, you can add two actions to your model (`wait()` and 
`stopWaiting()`) and a boolean flag to the store (`waiting`).

The code for this one is super-simple, but needs some explanation, so we'll defer for a bit.
 
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

* If you use our async action creator, you must install and set up `redux-thunk`
* You must use `combineReducers()` to build your map of reducers, even if you only have one.
  The library expects the stores to be managed separately, one per model, which `combineReducers()`
  does for you. We provide a utility method `buildReducerMap()` to make this easy.
* Immediately after creating your store, call `reduxUtils.setStore`

# Context

Just a quick note: I'm not currently using this with React, because I'm a dinosaur,
or because I haven't had the need to use React yet. Therefore this library neither
depends on React or expects you to be using it. You should be able to make good use
of the tools and patters regardless how you manage your views.

I've even used this with a jQuery app. Dinosaur.

# Model structure

Part of the power of this library is not just in the methods it provides, but in
the structure it uses for building models.

```javascript
var model = {

    //--- required properties
    
    name,       // string
    
    reducer,    // your reducer function
    actions,    // object; lists available action-creators
    accessors,  // object; see below

    //--- optional properties
    
    waitable    // boolean; installs a flag and some actions
}

// before exporting your model, run it through this munger. see below.
module.exports = reduxUtils.modelBuilder(model);
```

# About accessors

Accessors are strings which define how to find a property in your store.
They are simply the representation of the path to the property, in dot notation.

So for an object like this:
```
var store = {
    userID: 0,
    preferences: {
        colorScheme: 'dark',
        fontSize: 'large'
    }
};
```
You would define an accessor to the `colorScheme` property as a string: `"preferences.colorScheme"`.

You make your accessors public to minimize the exposure of your model structure. Consumers will
typically need to know nothing about your internal data structures.

# Actions

Here is a map of actions. It is not strictly required by any of the library code, but as a pattern
it is quite useful. Here is a typical way to construct the map inside your model:

```
// putting codes into an object is not mandatory, but it's handy for staying dry
let actionCodes = {
    CTR_INCR: 'CTR_INCR',
    CTR_DECR: 'CTR_DECR'
};
// the action creators are Standard Issue. we just wrap them into a mapping object
let actions = {
    incr:  reduxUtils.makeActionCreator(actionCodes.CTR_INCR, 'value'),
    decr:  reduxUtils.makeActionCreator(actionCodes.CTR_DECR, 'value')
};
```

When you export the `actions` object, other code can invoke actions easily
by calling `model.actions.incr(4)`, for example.

# OMG JUST SHOW ME

Here's a full example of a model which manages the geolocation of your device.
It's simple but shows off many of the features of this library, as well as some
useful patterns for constructing models.

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
          SET_LOCATION: 'LOC_SET'
      },
      // these private actions are also not exported. the "setLocation" action is synchronous
      privateActions = {
          setLocation: reduxUtils.makeActionCreator(actionCodes.SET_LOCATION, 'location')
      },
      // this list of actions (only one in this case) is exported and public. there are
      // two additional public actions (wait and stopWaiting) that are installed because
      // we request them with the "waiting" property on our export statement below.
      actions = {
          // querying the device location is async
          getLocation: reduxUtils.makeAsyncAction(() => {

              // make some callbacks for the geolocation API
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

              // do the actual work
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
            // we use the provided method "copyAndAssign" to keep the reducer pure.
            // note the use of "accessors.location", which tells the copier what property
            // to overwrite. in other words, here is the impure version of what we're doing:
            //      state.location = action.location
            return reduxUtils.copyAndAssign(state, accessors.location, action.location);
    }
    return state;
}

// we run the model object through a custom tool which massages it into shape
module.exports = reduxUtils.modelBuilder({

    name: 'geo',

    // this causes two new actions to be installed (wait and stopWaiting), and a new
    // property on the model called "waiting"
    waitable: true,

    // export the core attributes of the model
    reducer,
    actions,
    accessors
});
```

The view which uses the model is utterly trivial. Note that it doesn't need to 
import either Redux or Redux-Utils; just the relevant model.

```javascript
var geo     = require('./models/geo'),
    btn     = document.getElementById('geoTrigger'),
    output  = document.getElementById('geoOutput');

// trigger a model action when the button is clicked
btn.addEventListener('click', () => geo.actions.getLocation());

// listen for changes to the location
geo.subscribe(geo.accessors.location, loc => {

    // do something with the new data
    output.innerHTML = JSON.stringify(loc);
});

// listen for changes to the "waiting" flag, so we can put up a spinner
geo.subscribe(geo.accessors.waiting, waiting => {
    console.log('waiting for location data:', !!waiting);
});

```

# API


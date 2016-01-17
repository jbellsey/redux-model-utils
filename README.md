
You have in your hands a set of model-building utilities for redux apps. Like redux itself, this library
works very well whether or not you use React for rendering.
 
To use this library, you'll need to build your models using the patterns described below. These
patterns, in effect, ARE the library.

Before showing you the full documentation, let's take a look at what your code will look like when
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
which is straight from the redux docs.

```javascript
let addTodo = reduxModelUtils.makeActionCreator('TODO_ADD', 'text');
addTodo('Sell car');    // dispatch is called for you
```

There are also tools for async actions, described below.

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
    // are  roadmaps that allow a consumer to retrieve (or set)
    // a property in the state. they are converted into
    // read-only properties on the model's "data" object, as shown
    // a few lines down
    selectors = {
        token:     state => state.token,
        pollTimer: state => state.pollTimer
    };

// ... then later, in your view ...
let token = uiModel.data.token;
```

This means you don't need to `connect` every model to every component.
Peek into any model you like.

*Caveat*: This is convenient, but not often a best practice. In React apps,
you'll typically use `mergeReactSelectors` to ensure your views are responsive
to changes across multiple models. And in non-React apps, you'll typically use
`subscribe` to track changes. So use with caution.

### Change-notification (subscriptions)

Built on top of redux's subscription tool, this allows you to get notified only when
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

In addition to `clone()`, which does a deep copy of an object, there are several other
utilities for working with objects, including `lookup()`, `assign()` and `cloneAndAssign()`.
These are described below.

# Setup

### Internal dependencies

This library uses `node-clone`, `deep-assign`, and of course `redux`. 


### Installation & project setup

To install:

```
npm install --save jbellsey/redux-model-utils
```

In addition, you must make the following changes or additions to your code:

* If you use async actions, you must install and set up `redux-thunk`
* If you use the undoable feature, you must install `redux-undo`
* You must use `combineReducers()` to build a nested map of reducers, even if you only have one.
  The library expects the stores to be managed separately, one per model, which `combineReducers()`
  does for you. There is a utility method `buildReducerMap()` to make this easy. Example below.
* Immediately after creating your store, you must call `setStore()`

# Model structure

Part of the power of this library is not just in the functions it provides, but in
the structure it imposes on your models. Here's an outline of how every model will look.
Details immediately below.

```javascript
let model = {

    //--- required properties
    
    name,       // string
    selectors,  // object; see below
    
    // either:
    actionMap,  // a bundle that unpacks to your action creators and atomic reducers
    initialState,

    // or:
    reducer,    // your master reducer function (for all actions)
    actions,    // list of action-creators

    //--- optional properties
    
    options     // object; options for model creation
}

// before exporting your model, run it through this munger. see below.
module.exports = reduxModelUtils.modelBuilder(model);
```

You must provide a `name` for your model, which must be globally unique, but
not necessarily sluggish. (I.e., it can have mixed case and/or punctuation. It's
used as a key in a POJO.)

You must provide a list of `selectors`. These are strings or functions that are used
to expose specific properties in your model's store, and are described in the next
section. One selector is needed for each observable property. You may also choose
to define selectors for properties that are not externally observable, but are only 
needed inside the reducer. That's up to you.

For your reducer and actions, you have two choices.

**Implicit**: You can provide an action map, which is a bundle
that describes your action creators. Each action creator is packaged with an
atomic reducer function for handling that one action.

**Explicit**: Alternatively, you can provide a list of actions (using `makeActionCreator`).
If you do, you must also have a `reducer` property for your master reducer function.
There is nothing special about its signature; just build a normal reducer. See the
full example below.

You can optionally pass in some **magic triggers**. At present, there are two:
`waitable` and `undoable`. Setting these flags will install some custom actions
and selectors on your model; details below.

# About selectors

Selectors are roadmaps; they hold the algorithm to finding a specific property in
your store. They are used outside your model (for observable properties), and
inside your model (for your own convenience when building reducers).

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
// ...or...
let functionSelectors = {
    userID:      state => state.userID,
    colorScheme: state => state.preferences.colorScheme,
    fontSize:    state => state.preferences.fontSize
};
```

### Strings vs. functions

You can use either. However, string selectors have the added advantage
that they can be used for *writing* to your model, as well as *reading* from it.
With function selectors, you can only read. Have a look at the object-related
utility functions below (e.g., `cloneAndAssign`).

Here's an example using selector strings:

```javascript
// a string selector is usable in the reducer. keeps things dry.
let locationSelectorString = 'preferences.location';

function reducer(state = initialState, action = {}) {

    switch (action.type) {

        case actionCodes.SET_LOCATION:
            // so nice: with one line, we clone the state and modify one
            // property (which may be deeply nested). as a bonus, even
            // the reducer doesn't expressly know about the model structure
            return reduxModelUtils.cloneAndAssign(state, locationSelectorString, action.location);
    }
    return state;
}
```
In one line of code, you duplicate the state and change one deeply-nested property. But this
only works with a string selector.

To do the same with a function selector, well, you can't.
You have to do it manually (which is fine, of course). Here's the
same example, rewritten with a selector function:

```javascript
// a function selector is not usable inside the reducer
let locationSelectorFunc = state => state.preferences.location;

function reducer(state = initialState, action = {}) {

    switch (action.type) {
    
        case actionCodes.SET_LOCATION:
            // more verbose. and less dry.
            return reduxModelUtils.cloneAndMerge(state, {
                preferences: {
                    location: action.location;
                }
            });
    }
    return state;
}
```
Here we've used our `cloneAndMerge()` function to duplicate the state and merge
in the new location value. This is a smarter version of `Object.assign`,
detailed below.

### Data accessors

As a convenience, you also get an accessor for each selector, so you can retrieve 
data from the store at any time. An object called `data` is created for you and
attached to your model; its keys match those in your selectors. To get the full 
store, use the object called `allData`.

```javascript
// this data object and its accessors are created for you.
// here's how you might use them in your component
let userID = prefsModel.data.userID,
    color  = prefsModel.data.colorScheme,
    all    = prefsModel.allData;
```


# OMG JUST SHOW ME

Here's a full example of a model which manages the geolocation of your device.
It's simple but shows off many of the features of this library, as well as some
useful patterns for constructing models. 

This model has one public action (`getLocation()`),
which triggers an async request to the browser for its latitude and longitude.
It has one private action (`_setLocation()`), which is called after we get the
coordinates back from the API. There is
one observable property (`location`), which is an object with the device's
coordinates.

In this example, we'll use an action map. The view code will be shown next.

```javascript
let   reduxModelUtils  = require('redux-model-utils'),
      model;    // set below

const // prepare an empty store. you're doing this already.
    initialState = {
        location: {}
    },
    // dot-notation strings to look at properties of our model, as described above.
    // in our case, the model is only one level deep, so there are no dots :)
    selectors = {
        location: 'location'    // could also have been a function: state => state.location
    },
    // the action map is internally converted into an "actions" object, as described above.
    // two additional public actions (wait and stopWaiting) are installed because
    // we set the "waitable" option on the export statement below.
    actionMap = {

        // this action is semi-private. to create a truly private action you cannot use
        // an action map. instead, use makeActionCreator
        _setLocation: {
            code:    'set',      // code doesn't need to be globally unique; just unique within this module
            params:  'location', // only one param for the action creator

            // the reducer is atomic, only used for this one action, which makes it trivial.
            // the use of "cloneAndAssign" (and its use of the selector string) is a common pattern
            reducer: (state, action) => reduxModelUtils.cloneAndAssign(state, selectors.location, action.location)
        },

        // this is the only action that should be called by views. it takes no params,
        // and is asynchronous
        getLocation: {
            async() {

                // create some callbacks for the geolocation API
                let err = () => {
                        // call the private action to clear out the state
                        model.actions._setLocation({});

                        // this (synchronous) action is magically installed because
                        // we flag the model as "waitable"
                        model.actions.stopWaiting();
                    },
                    success = position => {
                        // we call the private action here. the variable "model" is set below
                        model.actions._setLocation({
                            latitude:  position.coords.latitude,
                            longitude: position.coords.longitude
                        });
                        model.actions.stopWaiting();
                    };

                // this (synchronous) action is installed by our use of "waitable" below
                model.actions.wait();

                // do the actual work: ask the browser where it is
                if (navigator && "geolocation" in navigator)
                    navigator.geolocation.getCurrentPosition(success, err, {maximumAge: 60000});
                else
                    err();
            }
        }
    };

// run the model object through a custom tool ("modelBuilder"), which whips it into shape.
// we cache a reference to the finished model, so we can call actions from inside this module
module.exports = model = reduxModelUtils.modelBuilder({

    name: 'geo',
    selectors,

    // these properties are used to build an actions object
    actionMap,
    initialState,

    // this causes two new actions to be installed (wait and stopWaiting), and a new
    // property on the model's state called "waiting"
    options: {
        waitable: true
    }
});
```

The view which uses the model is utterly trivial. Note that it doesn't need to 
import `redux-model-utils`; just the relevant model.

Here's a React component that uses the model. A vanilla version is shown next.

```javascript
const React     = require('react'),
      {connect} = require('react-redux'),
      geoModel  = require('./models/geo');

let MyGeoComponent = React.createClass({

    componentWillMount() {
        // start the async query here. could also be attached
        // to a button handler, as in the vanilla example above
        geoModel.actions.getLocation();
    },

    render() {

        let spinner = this.props.waiting ? <Spinner /> : null,
            output  = JSON.stringify(this.props.location);      // ugly

        return (
            <div>
                {spinner}
                {output}
            </div>
        );
    }
});

// "reactSelectors" is created for you, and ensures that your selectors are
// all available as props. in this case, that means "location" and "waiting"
export default connect(geoModel.reactSelectors)(MyGeoComponent);
```

A similar view in vanilla. In this case, we don't even have to import redux.

```javascript
let geoModel = require('./models/geo'),
    btn      = document.getElementById('geoTrigger'),
    output   = document.getElementById('geoOutput');

// trigger a model action when the button is clicked
btn.addEventListener('click', () => geoModel.actions.getLocation());

// listen for changes to the location
geoModel.subscribe(geoModel.selectors.location, loc => {
    // do something with the new data. e.g.:
    output.innerHTML = JSON.stringify(loc);
});

// listen for changes to the "waiting" flag, so we can put up a spinner
geoModel.subscribe(geoModel.selectors.waiting, waiting => {
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
module.exports = reduxModelUtils.modelBuilder({

    name: 'geo',
    options: {
        waitable: true  // <= that's it
    },
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

module.exports = reduxModelUtils.modelBuilder({
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
library. Your model will get a new selector map called `reactSelectors`. You pass this map 
to the `connect()` function provided by `react-redux`.

Here's a fuller example:

```javascript
// YOUR MODEL.js
//
export let todoModel = reduxModelUtils.modelBuilder({
    name,
    reducer,
    actions,
    selectors
});
```
```javascript
// YOUR COMPONENT.js
//
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {todoModel} from './models/todo.js';

// do not export your component
class TodoList extends Component {

    // ~ snip ~

    // you can call your model's actions inside event handlers 
    addNote() {
        todoModel.actions.add('Build an app');
    }
    
    // your component will get props that match your model's selectors
    render() {
        let {todos} = this.props;
        // ... etc
    }
}

// export the result of the connect function, provided by react-redux
export default connect(
    todoModel.reactSelectors    // <= this selector map is created for you
)(TodoList);

// you can use the decorator form instead if you prefer:
// @connect(todoModel.reactSelectors) ...
```

That's it. To recap:

* Build your selector map to include anything you need as a prop 
* Use your model's `reactSelectors` object (which is created for you) in the `connect()` function of react-redux

### One component, many models

If you have props that you need from more than one model, you can combine them with `mergeReactSelectors`:

```javascript
import React, {Component}    from 'react';
import {connect}             from 'react-redux';
import {mergeReactSelectors} from 'redux-model-utils';

// here we import any models whose props we need
import {todoModel}           from './models/todo.js';
import {uiModel}             from './models/ui.js';

class TodoList extends Component { /* ... */ }

export default connect(
    mergeReactSelectors(todoModel, uiModel)     // pass in all the models you need
)(TodoList);
```

# Using an actionMap

A useful pattern that this library enables is bundling each action with a single
reducer which is only designed to respond to that action. Here again is the example
from earlier:

```javascript
let actionMap = {
    addTodo: {
        code:   'add',
        params: ['text'],           // parameters for the action creator
        reducer(state, action) {    // each reducer handles only a single action
            state.todos = [...state.todos, action.text];
            return state;
        }
    },
    removeTodo: {
        code:   'remove',
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

Each key in your action map is converted into an action. In this example, the parser will unpack
your action map and create two keys in the `actions` object: `addTodo` and `removeTodo`.

Each key must provide a `code` with a module-unique value.
It must also provide a reducer function for responding to that action. You can optionally
provide `params`, which is an array of parameter names passed to the action creator.
If no params are needed, you can omit this property.
If only a single param is needed, you can use a string rather than an array of strings.

When you use an action map, you should _not_ attach an `actions` object or a `reducer`
function to your model. These will be created for you. Therefore, you can't mix an
action map with any other actions on the same model.

Because you do not provide a master reducer, you also don't have the opportunity to
provide a default initial state. So you must instead provide a fully-specified
`initialState` object on the model.

```javascript
module.exports = reduxModelUtils.modelBuilder({

    name: 'todos',
    selectors,      // not shown in this example
    
    actionMap,
    initalState: {todos:[]}
});
```

Notice how you do not explicitly specify the `actions` object, as in the other examples.
This is created for you.

```javascript
model.actions.removeTodo(4);
```

To build an asynchronous action using an action map, include a function key `async`. Params are handled
the same way (i.e., an optional string or array of strings). However, asynchronous actions
should not be given a `code` or `reducer`. Your `async` function can return a promise for chaining.

```javascript
let actionMap = {
    save: {
        params: 'recordID',
        async(params) {
            // do asynchronous things
            model.actions.wait();
            return api.save(params.recordID)
                .then(() => model.stopWaiting());
        }
    },
    // example of an async action with no params: a one-second timer-promise
    timer1000: {
        async: () => new Promise(resolve => setTimeout(resolve, 1000))
    }
};
// keep a reference to the constructed model, so we can call its actions above
let model = module.exports = reduxModelUtils.modelBuilder( /* ... */ );

// ... then later ...
model.actions.save(44).then(closeForm);
model.actions.timer1000().then(smile);
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
module.exports = reduxModelUtils.modelBuilder({
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
    incr:  reduxModelUtils.makeActionCreator('CTR_INCR', 'value'),
    decr:  reduxModelUtils.makeActionCreator('CTR_DECR', 'value'),
};
```

##### makeAsyncAction(cb, ...argNames)

This utility enables easy async actions. **Note**: if you use this tool, you must
also install and configure [redux-thunk](https://github.com/gaearon/redux-thunk).

The callback's signature is `args => {}`, where `args` is an object map of the 
arguments you indicate in `argNames`. The callback's return value is passed back
to the caller.

Here's a common pattern for running an AJAX query:

```javascript
// these private actions are used inside async actions. they are not exposed.
// also, this example doesn't include the reducer code for them.
//
let privateActions = {
    
    // this action might invalidate the cache
    startQuery: reduxModelUtils.makeActionCreator('QU_START'),
    
    // this will store the results in your model when the query is finished
    endQuery:   reduxModelUtils.makeActionCreator('QU_END', 'results')
},
let actions = {
    // make an async action that takes one argument ('username').
    query: reduxModelUtils.makeAsyncAction(args => {

        // run a synchronous action, perhaps to invalidate the cache.
        // you might also call 'actions.wait()' if your model is a waitable
        //
        privateActions.startQuery();

        // start the async operation. we return a promise, so the user can chain
        return fetch(`http://myapi.com/u/${args.username}`)
              .then(response => {
              
                  // query is done. run another synchronous action to store the data.
                  // you might also call 'actions.stopWaiting()'
                  privateActions.endQuery(response);
              });
    }, 'username')
};
// ... later ...
model.actions.query('harry').then(showProfilePage);
```

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

let newStore = reduxModelUtils.cloneAndAssign(store, 'preferences.fontSize', 'small')
// => {userID: 0, preferences: {colorScheme: 'dark', fontSize: 'small'}}
```

You will probably use these two functions (`cloneAndAssign` and `cloneAndMerge`)
in your reducer for almost every action. Here is a more complete example that has a string 
and an array of objects in the store:

```javascript
let reduxModelUtils = require('redux-model-utils');

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
        addTodo:     reduxModelUtils.makeActionCreator(actionCodes.ADD_TODO, 'text'),
        setListName: reduxModelUtils.makeActionCreator(actionCodes.SET_LIST_NAME, 'text')
    };

function reducer(state = initialState, action = {}) {

    switch (action.type) {

        // for arrays, we use 'clone()' on the state object to duplicate it first. 
        // this also duplicates the internal array. selectors (strings or functions)
        // aren't useful here; we have to directly manipulate the state object.
        //
        case actionCodes.ADD_TODO:
            state = reduxModelUtils.clone(state);
            state.todos.push({
                text: action.text,
                completed: false
            });
            return state;

        // for scalar properties, we use 'cloneAndAssign()' with a selector string.
        // we like one-liners.
        case actionCodes.SET_LIST_NAME:
            return reduxModelUtils.cloneAndAssign(state, selectors.listName, action.text);
    }
    return state;
}

module.exports = reduxModelUtils.modelBuilder({
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
let redux           = require('redux'),
    thunk           = require('redux-thunk'),
    reduxModelUtils = require('redux-model-utils'),

    models = [
        require('./models/appdata'),
        require('./models/todos')
        // ... etc
    ],

    createStoreWithMiddleware = redux.applyMiddleware(thunk)(redux.createStore),

    // prepare an object for combineReducers
    allReducers = reduxModelUtils.buildReducerMap(models),

    // unify all models into a single reducer
    masterReducer = redux.combineReducers(allReducers),

    masterStore = createStoreWithMiddleware(masterReducer);

reduxModelUtils.setStore(masterStore);
module.exports = masterStore;
```

The one exception: if your app does not use async actions, you can omit the
installation and setup of `redux-thunk`.


##### buildReducerMap(modelArray)

See the example above. This takes an array of models, and prepares them for 
passing to `combineReducers()`. The result is a nested object whose keys are the
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
let todos = require('./models/todos');

todos.subscribe(todos.selectors.todos, todoList => {
    // do something with the new data
    console.log('todos changed', todoList);
});
```
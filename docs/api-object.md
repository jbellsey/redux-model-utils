# API: Object-management utilities

These utilities are for working with POJOs, typically inside
your reducers. They are for convenience only; you don't have to use them.

##### clone(obj)

Makes a full deep clone of the object. Uses the excellent [clone](https://github.com/pvorb/node-clone)
library.

##### cloneAndMerge(sourceObject, ...mergeOjects)

This is similar to `Object.assign`, except that it does full deep clones,
making it more useful in your reducers.

First, it makes a full copy of `sourceObject`. It then uses
[deep-assign](https://github.com/sindresorhus/deep-assign) to
overwrite (or merge) properties from the provided `mergeObjects`.

```javascript
let store = {
    userID: 0,
    preferences: {
        colorScheme: 'dark',
        fontSize: 'large'
    }
};

// create a full copy of store, overwriting a single property.
// there are easier ways to do this; see below
//
let newStore = cloneAndMerge(store, {
    preferences: {
        // does not overwrite any other properties. fontSize remains intact
        colorScheme: 'light'
    }
});
// => {userID: 0, preferences: {colorScheme: 'light', fontSize: 'large'}}
```

##### cloneAndAssign(obj, selectorString, newValue)

This is a special-purpose version of `cloneAndMerge`. It does
a single property replacement inside a deep object. (Sounds like something
you might do in a reducer, perhaps?)

This function first makes a full clone of `obj`. It then uses the
[selector string](selectors.md) to push `newValue` into the
appropriate place in the new object. (Because this is a *write* operation,
the selector must be a string; functions can't be used for writing.)

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
        // (you can use ES6 notation here instead; this is just for illustration)
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
it doesn't clone the object first. It is destructive, impure, and all sorts of other
mean, nasty things. Use with caution.

This function also accepts selectors in string form only.

##### lookup(obj, selector)

Provides a read operation inside your object, using the provided selector.
This complements the write operation provided by `assign()` and `cloneAndAssign()`.
You probably won't need to use this.

Because this is a read operation, the selector can be either a string or a lookup function.

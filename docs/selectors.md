
# Selectors

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

# Data accessors

As a convenience, you also get an accessor for each selector, so you can retrieve
data from the store at any time. An object called `data` is created for you and
attached to your model; its keys match those in your selectors.

To get the full store, use the object called `allData`. This object
returns a full read-only copy of the entire store, exactly as you
structured it.

```javascript
// this data object and its accessors are created for you.
// here's how you might use them in your component
let userID = prefsModel.data.userID,
    color  = prefsModel.data.colorScheme,
    all    = prefsModel.allData;    // all.preferences.colorScheme
```

This allows you to peek into the current state of any model, not just
whatever mode you connected to your view.

While this may be convenient at times, it may not be the most robust
solution for working with multiple models. In general, a React app
should use `mergeReactSelectors` to have a component receive props
from multiple models. In non-React apps, you'll typically use
`subscribe` to track changes. So use with caution.
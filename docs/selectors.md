
# Selectors

Selectors are roadmaps; they hold the algorithm to finding a specific property in
your store. They are used outside your model for observable properties, and sometimes
inside your model (for your own convenience when building reducers).

They come in two forms. Each has its advantages and disadvantages.

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

# React

The selectors are used when connecting your model to a component.
See [react.md](our React docs).

# Data accessors

As a convenience, you also get an accessor for each selector, so you can retrieve
data from the store at any time. An object called `data` is created for you and
attached to your model; its keys match those in your selectors.

To get the full store, use the object called `allData`. This object
returns a full copy of the entire store, exactly as you
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
# New features

## Nested actions

# Breaking changes

## Accessors
Direct accessors have been removed. In earlier versions,
`model.data` was a set of `get()` methods that mapped
from your selectors. Now it returns the full state object:

```js
const state = {
  prefs: {
    size: 'large',
    color: 'red'
  }
};
const selectors = {
  size: 'prefs.size'
}

// OLD: each selector became a direct accessor on "data"
let oldSize = model.data.size;

// NEW: data now returns the full state tree for this model
let newSize = model.data.prefs.size;
``` 

This functionality was previously provided by the
`allData` accessor, which is now deprecated.

## Automatic model features

Two "magic" model features have been removed: `waitable`
and `undoable`. They are easy enough to build manually.



# API: Config & setup tools

These APIs will typically be used once in your app.
See the [full example](example.md) for a usable
boilerplate showing how to configure this library.
It's minimal.

#### buildReducerMap(modelArray)

This takes an array of models, and prepares them for
passing to `combineReducers()`. The result is a nested object whose keys are the
model names (which you provide as `model.name`), and whose
values are the reducers for each model.

The result is an object like this, which is ready to be passed
to the Redux call `combineReducers`:

```javascript
// build a reducer map from all models in your application
const reducerMap = buildReducerMap(geo, reddit);

// manual alternative:
const manualReducerMap = {
  'geo':    geo.reducer,
  'reddit': reddit.reducer
}
```

#### setStore(store)

You must call this immediately after creating your store. That is all.

#### getStore()

You probably won't need to use this, but it's available.

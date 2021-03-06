# Installation & project setup

To install:

```
npm install --save redux-model-utils
```

It has no dependencies. The package is about 2k (min/gzip).

In addition, you must make the following changes or additions to your code:

* If you use async actions, you must install and set up `redux-thunk`
* You must use `combineReducers()` to build a nested map of reducers, even if you 
only have one model. The library expects the stores to be managed separately, one
per model, which `combineReducers()` does for you. There is a utility method
`buildReducerMap()` to make this easy.
* Immediately after creating your store, you must call `setStore()`

See the [complete example](example.md) for setup and configuration code.

# 1.0

## New features

* Nested actions
* Custom action types
* Props namespaces
* Async handlers now have access to state

## Breaking changes

* The "magic" model feature `waitable` has been removed. It is easy enough to build manually.

## Deprecations & name changes

* `model.reactSelectors` is now `model.mapStateToProps`
* `mergeReactSelectors` is now `mergePropsMaps`

Likely future deprecations:

* `model.data` and `model.allData`

## Internal details

* We now use Rollup for building, instead of gulp+browserify.

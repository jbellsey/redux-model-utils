
# API: Model-building tools

There are a few API functions documented below. However, much of
this library is in the form of *patterns*. So before looking at
the API calls and their parameters, we need to describe the
patterns you'll need to use to build models.

Here's an outline of how every model will look.
Details immediately below.

```javascript
let rawModel = {

    //--- required properties

    name,       // string
    selectors,  // object map; see below

    actionMap,  // a bundle that unpacks to your action creators and atomic reducers
    initialState,

    //--- optional properties

    options     // object; options for model creation
};

// before exporting your model, run it through this transformer. see below.
let model = reduxModelUtils.modelBuilder(rawModel);

export default model;
```

You must provide a string `name` for your model, which must be unique across other models.

You must provide a list of [selectors](selectors.md). These are strings or functions that are used
to expose specific properties in your model's store.
One selector is needed for each observable property. You may also choose
to define selectors for properties that are not externally observable, but are only
needed inside the reducer. That's up to you.

You must provide an action map, which is a bundle
that describes your action creators. Each action creator is packaged with an
atomic reducer function for handling that one action.

Read the full documentation on how to build actions and action maps
[here](actions.md).


#### modelBuilder(model)

You must run your model through this utility before exporting it. It has no
options.

```javascript
export default reduxModelUtils.modelBuilder({
    name: "reddit",
    reducer,
    actions,
    selectors
});
```

#### makeActionCreator(type, ...argNames)

You've probably already done this if you've used Redux before.
See [the docs](http://rackt.org/redux/docs/basics/Actions.html).
This version is not any different. Note that actions invoked this way are dispatched for you.
If you need a different way to dispatch, or if you need action objects without a built-in
dispatch, just don't use this tool.

And if you're using an action map, you won't need this tool (or the next one).

```javascript
let actions = {
    incr:  reduxModelUtils.makeActionCreator('CTR_INCR', 'value'),
    decr:  reduxModelUtils.makeActionCreator('CTR_DECR', 'value'),
};
```

#### makeAsyncAction(cb, ...argNames)

This utility enables easy async actions..

The callback's signature is `function(args) {}`, where `args` is an object map of the
arguments you indicate in `argNames`. The callback's return value is passed back
to the caller. so you can chain promises.

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
};
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

#### severPrivateActions()

If you use an action map, you can make some actions
private, as described and documented on the
[actions page](actions.md). Call this method to
remove the private actions from your model's public
interface.

```javascript
let actionMap = {

        secretAction: {
            private: true,
            params: 'data',
            reducer: (state, action) => ({...state, {data: action.data}})
        },

        publicAction: {
            thunk() {
                // private actions are available only inside this module
                privateActions.secretAction({a:1});
            }
        }
    },

    model = reduxModelUtils.modelBuilder( /* ... */ ),

    // call "sever"; this can only be done once
    privateActions = model.severPrivateActions();

export default model;


// ... then later, in your view ...
model.actions.publicAction();

// this will throw an error, since the private actions were severed
model.actions.secretAction({a:2});
```

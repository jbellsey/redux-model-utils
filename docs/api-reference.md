# API reference

## Config & setup tools

These APIs will typically be used only once in your app.
See the [full example](example.md) for a usable
boilerplate showing how to configure this library, as
well as how to patch in a model that's been lazy-loaded.


### buildReducerMap(modelArray)

This takes an array of models, and prepares them for
passing to `combineReducers()`. The result is a nested object whose keys are the
model names (which you provide as `model.name`), and whose
values are the reducers for each model.

The result is an object like this, which is ready to be passed
to the Redux call `combineReducers`:

```javascript
// build a reducer map from all models in your application
const reducerMap = buildReducerMap(geo, reddit); 

// manual alternative. here we're using the model's monolithic
// reducer, which is created automatically for us
const manualReducerMap = {
  geo:    geo.reducer,
  reddit: reddit.reducer
}
```

### setStore(store)

You must call this immediately after creating your store. That is all.

### getStore()

You probably won't need to use this, but it's available.


## Model-building tools

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
let model = modelBuilder(rawModel);

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


### modelBuilder(model)

You must run your model through this utility before exporting it. It has no
options.

```javascript
export default modelBuilder({
  name: 'reddit',
  actionMap,
  selectors,
  initialState
});
```

### makeActionCreator(type, ...argNames)

You've probably already done this if you've used Redux before.
See [the docs](https://redux.js.org/docs/basics/Actions.html).
This version is not any different. Note that actions invoked this way are dispatched for you.
If you need a different way to dispatch, or if you need action objects without a built-in
dispatch, just don't use this tool.

And if you're using an action map, you won't need this tool (or the next one).

```javascript
let actions = {
  incr: makeActionCreator('CTR_INCR', 'value'),
  decr: makeActionCreator('CTR_DECR', 'value'),
};
```

### makeAsyncAction(cb, ...argNames)

This utility enables easy async actions. It is used internally by the action map
parser, so you probably won't need it.

The callback's signature is `function(args) {}`, where `args` is an object map of the
arguments you indicate in `argNames`. The callback's return value is passed back
to the caller. so you can chain promises.

Here's a common pattern for running an AJAX query in a vanilla (non-React) app:

```javascript
// these private actions are used inside async actions. they are not exposed.
// also, this example doesn't include the reducer code for them.
//
let privateActions = {

  // this action might invalidate the cache
  startQuery: makeActionCreator('QU_START'),

  // this will store the results in your model when the query is finished
  endQuery:   makeActionCreator('QU_END', 'results')
};
let actions = {
  // make an async action that takes one argument ('username').
  query: makeAsyncAction(args => {

    // run a synchronous action, perhaps to set a "loading" flag
    privateActions.startQuery();

    // start the async operation. we return a promise, so the user can chain
    return fetch(`http://myapi.com/u/${args.username}`)
      .then(response => {

        // query is done. run another synchronous action to store the data
        privateActions.endQuery(response);
      });
    }, 'username')
};
// ... later ...
model.actions.query('harry').then(showProfilePage);
```

### model.severPrivateActions()

If you use an action map, you can make some actions
private, as described and documented on the
[actions page](actions.md). Call this method to
remove the private actions from your model's public
interface.

Note that this method is added to your model by the `modelBuilder`
tool. It is not a global function exported by the library. Also,
if your action map does not have any private actions, this method
will not exist.

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

    model = modelBuilder( /* ... */ ),

    // call "sever"; this can only be done once. it removes the private
    // action from the main "model.actions" object, and returns a new
    // object map with all of the private actions in the model
    privateActions = model.severPrivateActions();

export default model;


// ... then later, in your view ...
model.actions.publicAction();

// this will throw an error, since the private actions were severed
model.actions.secretAction({a:2});
```


## View-related tools

### mergeReactSelectors(...models)

If your component needs props from more than one model, you can combine them with
`mergeReactSelectors`.

```javascript
import todoModel from './models/todo.js';
import uiModel   from './models/ui.js';

class TodoList extends Component { /* ... */ }

export default connect(
    // pass in as many models as you need
    mergeReactSelectors(todoModel, uiModel)
)(TodoList);
```

The props from each model will be included in your component.
Each model's list of selectors will be converted
into props.

If there are conflicts (i.e., props with the same name from
more than one model) they are resolved with last-in priority,
as you would expect. So in the example above, `uiModel` would
win any conflicts with `todoModel`.

There are several other techniques for working with React and props:

* You can namespace props. This is another way to avoid collisions, and
to have the props sourced more explicitly. (So you can get 
`this.props.todoProps.todos` instead of `this.props.todos`.)
* You can also create multiple props-maps. Think of this as having multiple
`mapStateToProps` functions, which allows you to set up a different set of
props for each view.

More details on using this library with React can be found [here](react.md).

### model.subscribe(selector, cb, opts)

This is a method added to your model by `modelBuilder`. It is not a global
function exported by the library.

It is also not typically used by React applications.

Here `selector` is typically provided by the model, and may be either a string or a function.
`cb` is your handler for responding to changes in the model, and
`opts` allow you to configure the subscription.

The signature of the callback is `function(newValue, previousValue) {}`. In most
situations, you won't even need the previous value, since the callback is only
invoked when the portion of the model referenced by `selector` changes.

The options object currently accepts only the following attributes:

* `noInit`: If you set
this to `true`, your callback will not be invoked at initalization time.
This option is not often used, as you'll want your callback to get initialized
with a starting value.
* `equals`: The normal subscription invokes your callback only when the
value in question changes. It checks for equality
by comparing primitives (i.e., `a === b`). If you are subscribing
to changes in something other than a primitive, you can provide
a custom function to test for equality. See below for an example.

The `subscribe` function passes back the same `unsubscribe` function that you get from
the Redux store.

Here's some code from a vanilla JavaScript view. It's not complete,
but shows the typical subscription pattern.

```javascript
import todoModel from './models/todos';

let unsub = todoModel.subscribe(todoModel.selectors.todos, todoList => {
    // do something with the new data
    console.log('todos changed', todoList);
});
// and later...
unsub();
```

If your selector points to something other than a primitive --
another object, for example -- then you need to provide a custom
test for equality. The signature is `(a, b) => bool`. You must
take care to guard against one or more of the input parameters
being undefined.

In this example, we're subscribing to changes on an object.
The callback function gets the full `userData` object. The
default test for equality won't work when comparing objects;
we need to look into the object to compare the `userID`
properties.

```javascript
let initialState = {
      userData: {
        userID: 0,
        email:  '',
        avatar: ''
      }
    },
    // this selector exposes an object, not a primitive
    selectors = {
      userData: state => state.userData
    },
    // ...
    model = modelBuilder({ /* ... */ });

// then, in your view...
let unsub = model.subscribe(
      model.selectors.userData, // selector for this subscription
      newUserData => {
        // the user data object changed
      },
      {
        // test for equality: compare the userID property of each userData object
        equals: (a, b) => (a && a.userID) === (b && b.userID)
      }
    );
```
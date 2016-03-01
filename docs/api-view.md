
# View-related tools

#### mergeReactSelectors(...models)

If your component needs props from more than one model, you can combine them with
`mergeReactSelectors`.

```javascript
import {todoModel} from './models/todo.js';
import {uiModel}   from './models/ui.js';

class TodoList extends Component { /* ... */ }

export default connect(
    // pass in as many models as you need
    mergeReactSelectors(todoModel, uiModel)
)(TodoList);
```

The props from each model will be included in your component.
Recall that each model's list of selectors will be converted
into props.

If there are conflicts (i.e., props with the same name from
more than one model) they are resolved with last-in priority,
as you would expect. So in the example above, `uiModel` would
win any conflicts with `todoModel`.

More details on using this library with React can be found [here](react.md).

#### subscribe(selector, cb, opts)

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
* `equals`: The normal subscription routine checks for equality
by comparing primitives (i.e., `a === b`). If you are subscribing
to changes in something other than a primitive, you can provide
a custom function to test for equality. See below for an example.

The `subscribe` function passes back the same `unsubscribe` hook that you get from
the Redux store.

Here's some code from a vanilla JavaScript view. It's not complete,
but shows the typical subscription pattern.

```javascript
let todoModel = require('./models/todos');

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
        userData: 'userData'
    },
    // ...
    model = reduxModelUtils.modelBuilder({ /* ... */ });

// then, in your view...
let unsub = model.subscribe(
        model.selectors.userData, // selector for this subscription
        newUserData => {
            // the user data object changed
        },
        {
            equals: (a, b) => (a && a.userID) === (b && b.userID)
        }
    )


```

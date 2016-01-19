
# Magic triggers

Triggers are set by listing them on the `options` property of your model.

### Waitiable

The purpose of this feature is to make it easy to build a spinner
for your async operations.

A "waitable" model will be modified to provide two new actions
(`wait()` and `stopWaiting()`) and an observable property (`waiting`).
You will also get a selector (`model.selector.waiting`) to assist
in subscribing to changes.

Calling the new actions doesn't actually do anything other than
modify the value of `waiting`. You have to manage the spinner yourself
in the view. Keep in mind that these new actions have a built-in call
to `dispatch()`.

The actions do not nest; the `waiting` property is currently a boolean,
not a stack size.

To request this functionality on your model, add it to an `options` object:

```javascript
module.exports = reduxModelUtils.modelBuilder({

    name: 'geo',
    options: {
        waitable: true  // <= that's it
    },
    reducer,
    actions,
    selectors
});
```

See the [full example](example.md) for a waitable in action, complete with
actions and a subscriber.

### Undoable

There is also a magic trigger to convert a model into an undoable.
This operates similarly to a waitable, in that this trigger installs
some new actions and new observables.

Note that the actual undo functionality is provided by the
[redux-undo](https://github.com/omnidan/redux-undo) library. You must
install this library yourself if you request undoable models. Also,
this "magic undo" feature is optional. You can instead install and
configure `redux-undo` in any way you like.

Setting the undoable trigger will provide your model with two new actions (`undo()`
and `redo()`), each of which has a built-in call to `dispatch()`.
You also get two observable properties `undoLength` and `redoLength`,
which track the size of the corresponding stacks. Selectors of the same names are
also created and installed into your model's `selectors` object.

To use this functionality in your model, you must pass in a reference
to the `redux-undo` plugin. You can also (optionally) pass a configuration
object, which is passed through to the plugin.

When you request undoable functionality, your list of selectors will be modified.
This is because `redux-undo` modifies the structure of your store; the current
state of your model is now embedded inside a `present:{}` object.
Any code outside your reducer needs to look one level deeper to access
the current state of the model.

So if you have a selector string for `todos`, it will be converted to
`present.todos` for you. (Or, if you're using a selector
function, it will be composed with `state => state.present`.) This is all handled
for you behind the scenes.

Inside your reducer, the `state` object you are given to work with is already
scoped inside the `present` object, so your selectors do not need to dereference it.
The easiest way to manage this duality is to keep a reference to your original
`selectors` object, and use that inside your reducer. Views will see the dereferenced
selectors, and your reducer will see the originals.

The following example shows how to set up your model. The use of the undoable
actions and observables is left as an exercise for the reader.

```javascript
// load the plugin. you might use 'import', if you're into that kind of thing
let reduxUndo = require('redux-undo');

module.exports = reduxModelUtils.modelBuilder({
    name: 'todos',
    options: {
        undoable: {
            // pass in the entire plugin
            plugin: reduxUndo,

            // this config object is passed to the plugin
            config: {
                filter: reduxUndo.distinctState()
            }
        }
    },
    reducer,
    actions,
    selectors
});
```

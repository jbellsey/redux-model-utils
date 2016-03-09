
# Magic triggers

Triggers are set by listing them on the `options` property of your model.
There is currently only one magic trigger.

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

The actions do not nest; the `waiting` property is a boolean,
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


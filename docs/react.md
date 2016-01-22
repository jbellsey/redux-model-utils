
# Usage with React

This library was designed to make Redux more usable in all your apps, whether or
not they use React. If you do use React, here's what you need to do.

First, you must import and set up the [react-redux](https://github.com/rackt/react-redux/)
library. To use its `connect` function, you'll use the `reactSelectors` map that is
built for you by `modelBuilder`.

There is no other use for `reactSelectorMap`. It simply converts your selectors
into props for your component.

Here's a fuller example:

```javascript
// YOUR MODEL.js
//
let selectors = {
    // each selector will become a prop passed to your component
    todos:    state => state.todos,
    listName: state => state.listName
};
export let todoModel = reduxModelUtils.modelBuilder({
    name,
    reducer,
    actions,
    selectors   // <= a new map "reactSelectors" will be created for you
});
```
```javascript
// YOUR COMPONENT.js
//
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {todoModel} from './models/todo.js';

// do not export your component
class TodoList extends Component {

    // ~ snip ~

    // you can call your model's actions inside event handlers
    addNote() {
        todoModel.actions.add('Build an app');
    }

    render() {
        // your component will get props that match your model's selectors
        let {todos, listName} = this.props;
        // ... etc
    }
}

// export the result of the connect function, provided by react-redux
export default connect(
    todoModel.reactSelectors    // <= this selector map is created for you
)(TodoList);

// you can use the decorator form instead if you prefer:
// @connect(todoModel.reactSelectors) ...
```

That's it. To recap:

* Build your selector map to include anything you need as a prop
* Use your model's `reactSelectors` object (which is created for you) in the `connect()` function of react-redux

### Custom selectors

There's no reason you can't do fancy footwork in your selector functions.
As long as it runs synchronously, a selector function can process state
however you like.

```javascript
let selectors = {
    allTodos:     state => state.todos,
    visibleTodos: state => state.todos.filter(todo => !!todo.visible)
}
```

This will pass two array props to your component.

### One component, many models

If your component needs props from more than one model, you can combine them with
`mergeReactSelectors`:

```javascript
import React, {Component}    from 'react';
import {connect}             from 'react-redux';
import {mergeReactSelectors} from 'redux-model-utils';

// here we import any models whose props we need
import {todoModel}           from './models/todo.js';
import {uiModel}             from './models/ui.js';

class TodoList extends Component { /* ... */ }

export default connect(
    // pass in as many models as you need
    mergeReactSelectors(todoModel, uiModel)
)(TodoList);
```
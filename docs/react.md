
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
let initialState = {
    todos: [],
    listName: ''
};
let actionMap = {
    add: {
        params: 'text',
        reducer: (state, action) => {
           state.todos = [...state.todos, action.text];
           return state;
        }
    },
    setListName: {
        params: 'name',
        reducer: (state, action) => reduxModelUtils.cloneAndAssign(state, selectors.listName, params.name)
    }
}
export let todoModel = reduxModelUtils.modelBuilder({
    name: 'todos',
    actionMap,
    initialState,
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
* There should be no need to write your own `mapStateToProps` or `mapDispatchToProps` functions for `connect`

### Custom selectors

You can do as much fancy footwork in your selector functions as you like.
As long as it runs synchronously, a selector function can process state
into the sausage of your dreams.

```javascript
let selectors = {
    allTodos:     state => state.todos,
    visibleTodos: state => state.todos.filter(todo => !!todo.visible)
};
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

### One model, many components

If you need to use a model's values as props in multiple components,
you can reuse the main `reactSelectors` that is created automatically
for you.

However, this may be inefficient, as each prop needs to be calculated
from its corresponding selector, each time your component is rendered.
You can instead create multiple custom selector maps for use
in different components.

Consider our Todo example. You might have a sidebar component which
only needs the count of open todos. Building a custom selector map
will make your renders more efficient.

To do this, attach one or more selector maps to the `propsMaps`
property of your model.


```javascript
// the main selector map will be converted into model.reactSelectors,
// as shown in the previous example
//
let selectors = {
    allTodos:     state => state.todos,
    visibleTodos: state => state.todos.filter(todo => !!todo.visible)
};

// prep a simplified selector map with an independent list of props
let countOnlySelectors = {
    todoCount:    state => state.todos.length
};

// to attach the custom selectors, embed them into propsMaps
export let todoModel = reduxModelUtils.modelBuilder({
    name: 'todos',
    actionMap,
    initialState,

    // this creates the default "reactSelectors" map for you
    selectors,

    // and this creates as many custom props maps as you need
    propsMaps: {
        countOnly: countOnlySelectors
    }
});

// ... then, in your main view ...
export default connect(
    todoModel.reactSelectors    // the default selector map
)(TodoList);

// ... and in your simplified view ...
export default connect(
    // this component will only receive one prop, "todoCount"
    todoModel.propsMaps.countOnly
)(TodoSidebarWidget);
```

Add as many entries to `propsMaps` as you need. Each entry will
create a separate map of props for use in a connected component.
# Usage with React

This library was designed to make Redux more usable in all your apps, whether or
not they use React. If you do use React, here's what you need to do.

Redux Model Utils was built to work with [react-redux](https://github.com/rackt/react-redux/). 
To use its `connect` function, you'll use the `model.mapStateToProps` function that is
created for you by `modelBuilder`.

The `model.mapStateToProps` function is an adaptation of your model's `selectors`.
Selectors are individual functions that each convert state into a single prop; 
the mapping function is a single function that converts state into multiple props.

There should be no need to write a `mapDispatchToProps` function,
especially if you expose `model.actions` as a prop (see below).

Here's a fuller example:

##### todo-model.js
```javascript
let selectors = {
      // each selector will become a prop in your connected component
      todos:    state => state.todos,
      listName: state => state.listName,

      // expose the model's actions as a prop, so views don't have to
      // import the model code just to invoke an action. more info in selectors.md
      todoActions: () => model.actions
    },
    initialState = {
      todos:    [],
      listName: ''
    },
    actionMap = {
      add: { /* ... */ },
      setListName: { /* ... */ }
    },
    model = modelBuilder({
      name: 'todos',
      initialState,
      actionMap,
      selectors   // <= internally converted into a "mapStateToProps" function
    });

export default model;    
```
##### todo-list-view.js
```javascript
import {connect} from 'react-redux';
import todoModel from './models/todo.js';

class TodoList extends Component {

  render() {
    // your component will get props that match your model's selectors
    const {todos, listName, todoActions} = this.props,
          {add, setListName} = todoActions;
    // ... etc
  }
}

// export the unconnected component for testing. you can easily pass in model data
// as props, and stub model actions (since they're also just props). see testing.md
export {TodoList};

// here we use the "mapStateToProps" function that's attached to the model,
// and pass that to react-redux to create a connected component
//
export default connect(todoModel.mapStateToProps)(TodoList);

// you can use the decorator form instead if you prefer:
// @connect(todoModel.mapStateToProps) ...
```

That's it. To recap:

* Build your selector map to include anything you need as a prop
* Ensure your model's actions are also exported as a selector
* Use your model's `mapStateToProps` object (which is created for you) in the `connect()` function of react-redux
* There should be no need to write your own `mapDispatchToProps` function for `connect`

### Custom selectors

You can do as much fancy footwork in your selector functions as you like.
As long as it runs synchronously, a selector function can maniuplate state
in whatever fashion you need.

```javascript
let selectors = {
  allTodos:     state => state.todos,
  visibleTodos: state => state.todos.filter(todo => !!todo.visible)
};
```

## One component, many models

If your component needs props from more than one model, you can combine them with
`mergePropsMaps`:

```javascript
import {mergePropsMaps} from 'redux-model-utils';

// here we import any models whose props we need
import uiModel   './models/ui.js';
import todoModel './models/todo.js';

class TodoList extends Component { /* ... */ }

export default connect(
    // pass in as many models as you need. all selectors
    // will be merged into the component's props
    mergePropsMaps(uiModel, todoModel)
)(TodoList);
```

You can also merge a props map, as described in the section
immediately below. You can mix and match models and props
maps, as needed.

```javascript
export default connect(
    mergePropsMaps(
        // pass in a model to get its reactSelectors...
        uiModel,

        // ...or a props map, for a filtered list (see below)
        todoModel.propsMaps.countOnly
    )
)(TodoList);
```

## One model, many components

If you need to use a model's values as props in multiple components,
you can reuse the main `mapStateToProps` function that is created 
automatically for you.

However, this may be inefficient, as each prop needs to be calculated
from its corresponding selector, each time your component is rendered.
You can instead create multiple custom selector maps for use
in different components.

(You can also use the excellent [Reselect](https://github.com/reactjs/reselect)
library, which memoizes your selectors.)

Consider our Todo example. You might have a sidebar component which
only needs the count of open todos. Building a custom props map
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
      todoCount: state => state.todos.length
    };

// to attach the custom selectors, embed them into "propsMaps"
//
export let todoModel = reduxModelUtils.modelBuilder({
    name: 'todos',
    actionMap,
    initialState,

    // this creates the default "mapStateToProps" function for you
    selectors,

    // and this creates as many custom props maps as you need
    propsMaps: {
      countOnly: countOnlySelectors
    }
});

// ... then, in your main view ...
export default connect(
    todoModel.mapStateToProps    // the default selector map
)(TodoList);

// ... and in your simplified view ...
export default connect(
    // this component will only receive one prop, "todoCount"
    todoModel.propsMaps.countOnly
)(TodoSidebarWidget);
```

Add as many entries to `propsMaps` as you need. Each entry will
create a separate map of props for use in a connected component.


## Preventing collisions with custom namespaces

Each selector is mapped to a prop with the corresponding name. This is normally fine, as long
as you name selectors well. However, naming things is hard, and you may well run into a prop-name collision at some point. What if you have two models with a `loading` flag? Or
a higher-order component that also creates a `loading` prop?

In order to prevent this, you can namespace your props.
The namespace is set in the model's `options` object, using the `propsNamespace` key:

##### todo-model.js
```js
export let todoModel = reduxModelUtils.modelBuilder({
    name: 'todos',
    // ...
    options: {
      // this will put all props from this model into an object {todoProps}
      propsNamespace: 'todoProps'
    }
});
```

##### todo-view.js
```javascript
class TodoList extends Component {
    render() {
        // all todo-related props are now inside "props.todoProps"
        const {todos, listName, todoActions} = this.props.todoProps;
        // ...
    }
}
```


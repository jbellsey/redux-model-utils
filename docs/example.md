# A complete example

Here's a full example of a model which manages the geolocation of your device.
It's simple but shows off many of the features of this library, as well as some
useful patterns for constructing models. 

This model has one public action (`getLocation()`),
which triggers an async request to the browser for its latitude and longitude.
It has one private action (`_setLocation()`), which is called after we get the
coordinates back from the API. There is
one observable property (`location`), which is an object with the device's
coordinates.

## Model code

##### geo-model.js

```javascript
import {modelBuilder} from 'redux-model-utils';

const
    // prepare an empty store
    initialState = {
      waiting:  false,
      location: {}
    },

    // selectors expose properties of our model.
    selectors = {
      waiting:  state => state.waiting,
      location: state => state.location,

      // we also expose actions here
      geoActions: () => model.actions
    },

    // the action map is internally converted into an "actions" object.
    actionMap = {

        // this action is private, usable only within this module.
        // see the use of "severPrivateActions" below
        _setLocation: {
          private: true,
          params:  'location',

          // the reducer is atomic, only used for this one action, which makes it trivial
          reducer: (state, action) => ({...state, location: action.location})
        },

        waiting: {
          private: true,
          params:  'status',   // turns the waiting flag on or off
          reducer: (state, {status}) => ({...state, waiting: !!status})
        },

        // this is the only action that can be called by views. it takes no params, and
        // is asynchronous. it could easily be rewritten to return a promise for chaining
        getLocation: {
          async() {

            // create some callbacks for the geolocation API
            let err = () => {
                  // call the private action to clear out the state
                  privateActions._setLocation({});
                  privateActions.waiting(false);
                },
                success = position => {
                  // we call the private action here
                  privateActions._setLocation({
                    latitude:  position.coords.latitude,
                    longitude: position.coords.longitude
                  });
                  privateActions.waiting(false);
                };

                privateActions.waiting(true);

                // do the actual work: ask the browser where it is
                if (navigator && "geolocation" in navigator)
                    navigator.geolocation.getCurrentPosition(success, err, {maximumAge: 60000});
                else
                    err();
            }
        }
    };

// run the model object through a custom tool ("modelBuilder"), which whips it into shape.
// we cache a reference to the finished model, so we can call actions from inside this module
let model = modelBuilder({
      name: 'geo',
      selectors,
      actionMap,
      initialState
    }),

    // separate out the private actions, so they can only be used
    // inside this module
    privateActions = model.severPrivateActions();

export default model;
```

## View code

The view which uses the model is trivial. Note that it doesn't need to
import `redux-model-utils`; just the relevant model.

Here's a React component that uses the model. A vanilla version is shown next.

##### geo-component.js

```javascript
import React     from 'react';
import {connect} from 'react-redux';
import geoModel  from './models/geo';

class MyGeoComponent extends React.Component{

    componentWillMount() {
        // start the async query here. it could also be invoked
        // by a button handler, as in the vanilla example below.
        // we don't need to chain this here, but we could
        //
        let {geoActions} = this.props;
        geoActions.getLocation();
    }

    render() {
        // the props are created by the connect() call below.
        // they are mapped from the selectors above. 
        let {waiting, location} = this.props,
            spinner = waiting ? <Spinner /> : null,
            output  = <LocationDisplay location={location} />;

        return (
            <div>
              {spinner}
              {output}
            </div>
        );
    }
};

// "mapStateToProps" is created for you, and ensures that your selectors are all
// available as props. in this case, that means "location", "waiting", and "geoActions"
export default connect(geoModel.mapStateToProps)(MyGeoComponent);
```

A similar view in vanilla JavaScript. In this case, we don't even have to import
any Redux code.

##### geo-view.js

```javascript
let geoModel = require('./models/geo'),
    btn      = document.getElementById('geoTrigger'),
    output   = document.getElementById('geoOutput');

// trigger a model action when the button is clicked
btn.addEventListener('click', () => geoModel.actions.getLocation());

// listen for changes to the location
geoModel.subscribe(geoModel.selectors.location, loc => {
  // do something with the new data. e.g.:
  output.innerHTML = JSON.stringify(loc);
});

// listen for changes to the "waiting" flag, so we can put up a spinner
geoModel.subscribe(geoModel.selectors.waiting, waiting => {
  // do something with the new data. e.g.:
  if (!!waiting)
    console.log('waiting for location data');
  else
    console.log('finished waiting for location data');
});
```

## Config

The following code illustrates how you need to create your store.
This is done once per application, and it is largely boilerplate
with little room to stray.


##### store-setup.js
```javascript
import {compose, createStore, applyMiddleware, combineReducers} from 'redux';
import {buildReducerMap, setStore} from 'redux-model-utils';
import thunkMiddleware from 'redux-thunk';

import appModel from './models/appdata';
import todoModel from './models/todos';

export default function configureStore(initialState = {}) {

  let allModels     = [appModel, todoModel],
      allReducers   = buildReducerMap(allModels),
      masterReducer = combineReducers(allReducers),

      middleware = [applyMiddleware(thunkMiddleware)],
      store      = compose(middleware)(createStore)(masterReducer, initialState);

  setStore(store);
  return store;
}
```

# Deferred model loading

If you have a model that's lazy-loaded, you can easily install it and its reducer:

```js
// add the following code to "store-setup.js" above
//
export function injectModel(model) {
  allModels.push(model);

  let allReducers   = buildReducerMap(allModels),
      masterReducer = combineReducers(allReducers);
  getStore().replaceReducer(masterReducer);
}
```

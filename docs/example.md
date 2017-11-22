
Here's a full example of a model which manages the geolocation of your device.
It's simple but shows off many of the features of this library, as well as some
useful patterns for constructing models.

This model has one public action (`getLocation()`),
which triggers an async request to the browser for its latitude and longitude.
It has one private action (`_setLocation()`), which is called after we get the
coordinates back from the API. There is
one observable property (`location`), which is an object with the device's
coordinates.

The view code will be shown next.

# Model code

##### geo-model.js

```javascript
let   reduxModelUtils  = require('redux-model-utils'),
      model, privateActions;    // set below

const
    // prepare an empty store. you're doing this already.
    initialState = {
        location: {}
    },
    // dot-notation strings to look at properties of our model.
    // in our case, the model is only one level deep, so there are no dots :)
    selectors = {
        location: 'location'    // could also have been a function: state => state.location
    },
    // the action map is internally converted into an "actions" object.
    // two additional public actions (wait and stopWaiting) are installed because
    // we set the "waitable" option below.
    actionMap = {

        // this action is private, usable only within this module.
        // see the use of "severPrivateActions" below
        _setLocation: {
            private: true,
            params:  'location', // only one param for the action creator

            // the reducer is atomic, only used for this one action, which makes it trivial
            reducer: (state, action) => Object.assign(state, {location: action.location})
        },

        // this is the only action that can be called by views. it takes no params,
        // and is asynchronous
        getLocation: {
            async() {

                // create some callbacks for the geolocation API
                let err = () => {
                        // call the private action to clear out the state
                        privateActions._setLocation({});

                        // this (synchronous) action is magically installed because
                        // we flag the model as "waitable"
                        model.actions.stopWaiting();
                    },
                    success = position => {
                        // we call the private action here
                        privateActions._setLocation({
                            latitude:  position.coords.latitude,
                            longitude: position.coords.longitude
                        });
                        model.actions.stopWaiting();
                    };

                // this (synchronous) action is installed by our use of "waitable" below
                model.actions.wait();

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
model = reduxModelUtils.modelBuilder({

    name: 'geo',
    selectors,

    // these properties are used to build an actions object
    actionMap,
    initialState,

    // this causes two new actions to be installed (wait and stopWaiting), and a new
    // property on the model's state called "waiting"
    options: {
        waitable: true
    }
});

// separate out the private actions, so they can only be used
// inside this module
privateActions = model.severPrivateActions();

export default model;
```

# View code

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
        // by a button handler, as in the vanilla example below
        geoModel.actions.getLocation();
    }

    render() {
        // the props are created by the connect() call below.
        // they are mapped from the selectors above. (remember that "waiting"
        // is installed by our magic trigger)
        let spinner = this.props.waiting ? <Spinner /> : null,
            output  = <LocationDisplay location={this.props.location} />;

        return (
            <div>
                {spinner}
                {output}
            </div>
        );
    }
};

// "reactSelectors" is created for you, and ensures that your selectors are
// all available as props. in this case, that means "location" and "waiting"
export default connect(geoModel.reactSelectors)(MyGeoComponent);
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

# Config

The following code illustrates how you need to create your store.
This is done once per application, and it is largely boilerplate
with little room to stray.

Every line of code in the following example is required. You may use a different
syntax (e.g., `import` instead of `require`), and you may have additional middleware
to install, but you may not omit anything in the setup example here.

The one exception: if your app does not use async actions, you can omit the
installation and setup of `redux-thunk`.

##### store-setup.js
```javascript
import {combineReducers, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import {buildReducerMap, setStore, getStore} from 'redux-model-utils';

    // THIS IS NEW: build an array with all of your models
let models = [
        require('./models/appdata'),
        require('./models/todos')
        // ... etc ...
    ],

    // standard. add other middlewares here
    createStoreWithMiddleware = applyMiddleware(thunk)(redux.createStore),

    // THIS IS NEW: prepare an object for combineReducers
    allReducers = buildReducerMap(models),

    // THIS IS REQUIRED (but you might already be doing it):
    // unify all models into a single reducer
    masterReducer = combineReducers(allReducers),

    masterStore = createStoreWithMiddleware(masterReducer);

// THIS IS NEW:
setStore(masterStore);
export default masterStore;
```

# Deferred model loading

If you have a model that's lazy-loaded, you can easily install it and its reducer:

```js
// add the following code to "store-setup.js" above
//
export function injectModel(model) {
  models.push(model);

  let allReducers   = buildReducerMap(models),
      masterReducer = combineReducers(allReducers);
  getStore().replaceReducer(masterReducer);
}
```

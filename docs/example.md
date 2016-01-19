
Here's a full example of a model which manages the geolocation of your device.
It's simple but shows off many of the features of this library, as well as some
useful patterns for constructing models.

This model has one public action (`getLocation()`),
which triggers an async request to the browser for its latitude and longitude.
It has one private action (`_setLocation()`), which is called after we get the
coordinates back from the API. There is
one observable property (`location`), which is an object with the device's
coordinates.

In this example, we'll use an action map. The view code will be shown next.

# Model code

```javascript
let   reduxModelUtils  = require('redux-model-utils'),
      model;    // set below

const // prepare an empty store. you're doing this already.
    initialState = {
        location: {}
    },
    // dot-notation strings to look at properties of our model, as described above.
    // in our case, the model is only one level deep, so there are no dots :)
    selectors = {
        location: 'location'    // could also have been a function: state => state.location
    },
    // the action map is internally converted into an "actions" object, as described above.
    // two additional public actions (wait and stopWaiting) are installed because
    // we set the "waitable" option on the export statement below.
    actionMap = {

        // this action is semi-private. to create a truly private action you cannot use
        // an action map. instead, use makeActionCreator
        _setLocation: {
            code:    'set',      // code doesn't need to be globally unique; just unique within this module
            params:  'location', // only one param for the action creator

            // the reducer is atomic, only used for this one action, which makes it trivial.
            // the use of "cloneAndAssign" (and its use of the selector string) is a common pattern
            reducer: (state, action) => reduxModelUtils.cloneAndAssign(state, selectors.location, action.location)
        },

        // this is the only action that should be called by views. it takes no params,
        // and is asynchronous
        getLocation: {
            async() {

                // create some callbacks for the geolocation API
                let err = () => {
                        // call the private action to clear out the state
                        model.actions._setLocation({});

                        // this (synchronous) action is magically installed because
                        // we flag the model as "waitable"
                        model.actions.stopWaiting();
                    },
                    success = position => {
                        // we call the private action here. the variable "model" is set below
                        model.actions._setLocation({
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
module.exports = model = reduxModelUtils.modelBuilder({

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
```

# View code

The view which uses the model is trivial. Note that it doesn't need to
import `redux-model-utils`; just the relevant model.

Here's a React component that uses the model. A vanilla version is shown next.

```javascript
const React     = require('react'),
      {connect} = require('react-redux'),
      geoModel  = require('./models/geo');

// you can use ES6 classes if you prefer
let MyGeoComponent = React.createClass({

    componentWillMount() {
        // start the async query here. it could also be invoked
        // by a button handler, as in the vanilla example below
        geoModel.actions.getLocation();
    },

    render() {
        let spinner = this.props.waiting ? <Spinner /> : null,
            output  = <LocationDisplay location={this.props.location} />;

        return (
            <div>
                {spinner}
                {output}
            </div>
        );
    }
});

// "reactSelectors" is created for you, and ensures that your selectors are
// all available as props. in this case, that means "location" and "waiting"
export default connect(geoModel.reactSelectors)(MyGeoComponent);
```

A similar view in vanilla. In this case, we don't even have to import Redux.

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

```javascript
let redux           = require('redux'),
    thunk           = require('redux-thunk'),
    reduxModelUtils = require('redux-model-utils'),

    // build an array with all of your models
    models = [
        require('./models/appdata'),
        require('./models/todos')
        // ... etc ...
    ],

    // standard. add other middlewares here
    createStoreWithMiddleware = redux.applyMiddleware(thunk)(redux.createStore),

    // prepare an object for combineReducers
    allReducers = reduxModelUtils.buildReducerMap(models),

    // unify all models into a single reducer
    masterReducer = redux.combineReducers(allReducers),

    masterStore = createStoreWithMiddleware(masterReducer);

reduxModelUtils.setStore(masterStore);
module.exports = masterStore;
```
# Testing your models

There's a store mock in the spec directory
[here](../spec/_store.js). You're encouraged to use it
in your application. It's not exposed in this repo, so
you'll have to copy the source into your application.

You can see some of our testing patterns in the
spec directory of this repo. Or have a look below.

### Useful testing patterns

```javascript
var RMU   = require('redux-model-utils'),
    store = require('./_store'),
    model = require('../models/my-model'),
    api   = require('../utils/my-api')

describe('my model', () => {

    var mockStore;

    beforeEach(() => mockStore = store.resetStore(model));

    // a basic test that our action does what it should
    //
    it('should call the api when the action is run', () => {

        spyOn(api, 'getUser').and.returnValue(0);
        model.actions.getUser();
        expect(api.getUser).toHaveBeenCalled();
    })

    // look directly at the store to see if it was changed correctly.
    // notice that with the mock store, when you call getState you
    // need to tell it which model's state (i.e., which slice) you
    // want to look at
    //
    it('should set the store correctly', () => {

        // runs with no params
        model.actions.makeBlue();
        expect(mockStore.getState(model).prefs.color).toEqual('blue');
    });

    // test an async action
    //
    it('should set the store correctly', done => {

        var userObj = {email:'test@test.com', provider:'twitter'};
        spyOn(api, 'getUser').and.returnValue(Promise.resolve(userObj));
        model.actions.getUser().then(data => {
            expect(data.provider).toEqual('twitter');
            done();
        });

    });
});


```

var redux       = require('redux'),
    thunk       = require('redux-thunk'),
    RU          = require('../src/index'),
    middlewares = [thunk];

/*
    reducer => can be null, or a reducer function
    state   => can be an {object} or a function that returns an object
    expectedActions
            => can be an array of {action objects}, or an integer indicating
                the expected number of actions. use the integer when you don't
                know the action types exactly. note that this will make it
                impossible to know if not enough actions were called.
                but you will get an error if you call too many!
    onLastAction
            => if provided, this function is called when the expectedActions
                have all been called. for integer expectedActions, the function
                is invoked as soon as the indicated action count is reached.
*/
function mockStore(reducer, state, expectedActions, onLastAction) {

    var expectedActionsIsArray = Array.isArray(expectedActions);
    if (!expectedActionsIsArray && typeof expectedActions !== 'number') {
        throw new Error('expectedActions should be an ARRAY or COUNT of expected actions.');
    }
    if (typeof onLastAction !== 'undefined' && typeof onLastAction !== 'function') {
        throw new Error('onLastAction should either be undefined or function.');
    }

    function mockStoreWithoutMiddleware() {
        var listeners = [];

        function _getState() {
            return typeof state === 'function' ?
                state() :
                state;
        }
        function _setState(s) {
            if (typeof state !== 'function')
                state = s;
        }
        function _isLastAction() {
            if (expectedActionsIsArray)
                return expectedActions.length === 0;
            return expectedActions === 0;
        }

        return {
            getState: _getState,

            dispatch(action) {
                var expectedAction;

                if (expectedActionsIsArray) {
                    expectedAction = expectedActions.shift();
                    expect(action).toEqual(expectedAction);
                }
                else {
                    if (--expectedActions < 0)
                        fail('expectedActions integer value too low. you called dispatch too many times');
                }

                // simple single-reducer mock
                if (typeof reducer === 'function')
                    _setState(reducer(_getState(), action));

                if (onLastAction && _isLastAction()) {
                    onLastAction();
                }
                // tell subscribers
                listeners.slice().forEach(listener => listener());

                return action;
            },

            subscribe: listener => {
                listeners.push(listener);

                return function unsubscribe() {
                    var index = listeners.indexOf(listener);
                    listeners.splice(index, 1);
                }
            }
        }
    }

    const mockStoreWithMiddleware = redux.applyMiddleware(
        ...middlewares
    )(mockStoreWithoutMiddleware);

    return mockStoreWithMiddleware();
}

function resetStore(...args) {

    var store = mockStore(...args);

    // allow tests like this:
    //  expect(mockStore.dispatch).toHaveBeenCalled();
    //  expect(mockStore.dispatch.calls.count()).toEqual(2);
    //
    spyOn(store, 'dispatch').and.callThrough();

    RU.setStore(store);
    return store;
}

module.exports = {
    resetStore
};
var redux       = require('redux'),
    thunk       = require('redux-thunk'),
    RU          = require('../src/index'),
    middlewares = [thunk];

function mockStore(reducer, state, expectedActions, onLastAction) {

    if (!Array.isArray(expectedActions)) {
        throw new Error('expectedActions should be an array of expected actions.');
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

        return {
            getState: _getState,

            dispatch(action) {
                const expectedAction = expectedActions.shift();
                expect(action).toEqual(expectedAction);

                // simple single-reducer mock
                if (typeof reducer === 'function')
                    _setState(reducer(_getState(), action));

                if (onLastAction && !expectedActions.length) {
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
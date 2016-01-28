var redux       = require('redux'),
    thunk       = require('redux-thunk'),
    RU          = require('../src/index'),
    middlewares = [thunk];

/*
    model   => can be null, or a packaged model, or an array of packaged models
    state   => can be an {object} or null (to pull initial state from the models)
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
function mockStore(models, state, expectedActions, onLastAction) {

    var currentScope = null,    // or a string (model name)
        expectedActionsIsArray = Array.isArray(expectedActions),

        _setScope = newScope => {
            let oldScope = currentScope;
            currentScope = newScope;
            return oldScope;
        };

    if (!expectedActionsIsArray && typeof expectedActions !== 'number') {
        throw new Error('expectedActions should be an ARRAY or COUNT of expected actions.');
    }
    if (typeof onLastAction !== 'undefined' && typeof onLastAction !== 'function') {
        throw new Error('onLastAction should either be undefined or function.');
    }

    // ensure we have an array of models to work with, even if only one is provided
    if (!models)
        models = [];
    else if (!Array.isArray(models))
        models = [models];

    // should we get a default state from the models?
    let addDefaultState = !state;
    if (!state)
        state = {};

    // patch every action to ensure that when it's called we get scoped correctly
    models.forEach(model => {
        let newActions = {};
        Object.keys(model.actions).forEach(oneActionKey => {
            if (typeof model.actions[oneActionKey] === 'function') {
                let oldAction = model.actions[oneActionKey];
                newActions[oneActionKey] = (...args) => {
                    let oldScope = _setScope(model.name),
                        retVal   = oldAction(...args);
                    _setScope(oldScope);
                    return retVal;
                }
            }
        });
        model.actions = newActions;

        if (addDefaultState)
            state[model.name] = RU.clone(model.reducer(undefined, {}));
    });
    //console.log('! initial state !!', state);

    // if no state was provided, build it from the models' initial states
    //if (!state) {
    //    state = models.reduce((fullState, model) => {
    //        fullState[model.name] = RU.clone(model.reducer());
    //        return fullState;
    //    }, {});
    //}

    function mockStoreWithoutMiddleware() {
        var listeners = [];

        function _getState(scope) {

            if (!scope)
                scope = currentScope;

            // scope the state to the model name
            if (scope)
                return state[scope];
            return state;
        }
        function _setState(s, scope) {

            if (!scope)
                scope = currentScope;

            s = RU.clone(s);
            if (scope)
                state[scope] = s;
            else
                state = s;
        }
        function _isLastAction() {
            if (expectedActionsIsArray)
                return expectedActions.length === 0;
            return expectedActions === 0;
        }

        return {
            // external consumers can't customize scope directly;
            // must use setScope (below)
            //
            // pass UNDEFINED to get the first model's scope
            // pass NULL to get the FULL model
            // pass a SPECIFIC model to get its scope
            //
            getState: model => {

                var oldScope;

                if (model === undefined)
                    model = models[0];
                else if (model === null)
                    oldScope = _setScope(null);

                //console.log('getting state for', model ? model.name : null, _getState(model ? model.name : null));
                let retVal = _getState(model ? model.name : null);

                if (model === null)
                    _setScope(oldScope);
                return retVal;
            },

            // use this only during testing accessors.
            //      lastScope = store.forceFullScope(true);
            //      expect(model.data.color).toBe('red');
            //      store.forceFullScope(lastScope);
            //
            forceFullScope: val => {
                if (val === true) {
                    let oldModel = models[0];
                    models[0] = null;
                    return oldModel;
                }
                else
                    models[0] = val;
            },

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
                models.forEach(oneModel => {
                    let newState = oneModel.reducer(_getState(oneModel), action);
                    _setState(newState, oneModel.name);
                });
                //if (model && model.reducer)
                //    _setState(model.reducer(_getState(), action));

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

    var createStoreWithMiddleware = redux.applyMiddleware(...middlewares)(mockStoreWithoutMiddleware);

    // prepare an object for combineReducers. this is of the form {modelName: modelReducer, ...},
    // because that's what we need for combineReducers()
    //
    var allReducers = RU.buildReducerMap(models);

    // unify all models into a single reducer
    var masterReducer = redux.combineReducers(allReducers);

    return createStoreWithMiddleware(masterReducer);
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
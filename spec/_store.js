var clone       = require('clone'),
    redux       = require('redux'),
    thunk       = require('redux-thunk').default,
    RU          = require('../src/index'),
    middlewares = [thunk];

// TODO: this store has gotten out of hand. it should be
// rebuilt using https://github.com/arnaudbenard/redux-mock-store
// (tests will need reconfiguration as well)

/*
 model   => can be null, or a packaged model, or an array of packaged models
 state   => can be an {object} or null (to pull initial state from the models)
 expectedActions
         => can be an array of {action objects}, or an integer indicating
            the expected number of actions, or null-ish if you don't care.
            use the integer when you don't know the action types exactly. note that this
            will make it impossible to know if not enough actions were called.
            but you will get an error if you call too many!
 onLastAction
         => if provided, this function is called when the expectedActions
            have all been called. for integer expectedActions, the function
            is invoked as soon as the indicated action count is reached.
 */
function mockStore(models, state, expectedActions, onLastAction) {

    var currentScope           = null,    // or a string (model name)
        expectedActionsIsArray = Array.isArray(expectedActions),

        local_setScope         = newScope => {
            let oldScope = currentScope;
            currentScope = newScope;
            return oldScope;
        };

    if (!expectedActionsIsArray && typeof expectedActions === 'number') {
        if (expectedActions < 0)
            expectedActions = null;
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
                    let oldScope = local_setScope(model.name),
                        retVal   = oldAction(...args);
                    local_setScope(oldScope);
                    return retVal;
                }
            }
        });
        model.actions = newActions;

        if (addDefaultState)
            state[model.name] = clone(model.reducer(undefined, {}));
    });

    function mockStoreWithoutMiddleware() {
        var listeners = [];

        function local_getState(scope) {

            if (!scope)
                scope = currentScope;

            // scope the state to the model name
            if (scope)
                return state[scope];
            return state;
        }

        function local_setState(s, scope) {

            if (!scope)
                scope = currentScope;

            s = clone(s);
            if (scope)
                state[scope] = s;
            else
                state = s;
        }

        function local_isLastAction() {
            if (expectedActionsIsArray)
                return expectedActions.length === 0;
            else if (expectedActions != null)
                return expectedActions === 0;
            return false;
        }

        return {
            // external consumers can't customize scope directly;
            // must use setScope (below)
            //
            // pass UNDEFINED to get the FULL store, unscoped
            // pass a SPECIFIC model to get its scope
            //
            getState: model => {

                var useFullScope = (model === undefined),
                    oldScope;

                if (useFullScope)
                    oldScope = local_setScope(null);

                let retVal = local_getState(model ? model.name : null);

                if (useFullScope)
                    local_setScope(oldScope);
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
                else if (expectedAction != null) {
                    if (--expectedActions < 0)
                        fail('expectedActions integer value too low. you called dispatch too many times');
                }

                // let all models reduce our action
                models.forEach(oneModel => {
                    let newState = oneModel.reducer(local_getState(oneModel.name), action);
                    local_setState(newState, oneModel.name);
                });

                if (onLastAction && local_isLastAction()) {
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
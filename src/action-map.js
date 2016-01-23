var actions    = require('./actions');

/*
     if provided, the action map must be in this format:
        actionMap = {
            key: {
                params: [array, of, strings, for, action, creator]
                reducer(state, action) => {}
            }
        }

     and if you provide it, you must also attach an "initialState" object to the model.
 */

function find(arr, predicate) {

    var value, i;
    for (i = 0; i < arr.length; ++i) {
        if (predicate(value = arr[i]))
            return value;
    }
    return undefined;
}

function parseActionMap(model) {

    var listOfActions  = {},
        listOfReducers = [];

    Object.keys(model.actionMap).forEach(key => {

        let actionDetails = model.actionMap[key],
            code          = `${model.name}_${key}`,
            params        = actionDetails.params;

        if (typeof params === 'string')
            params = [params];
        else if (!params)
            params = [];

        // add an action-creator. async is handled differently
        if (actionDetails.async) {
            listOfActions[key] = actions.makeAsyncAction(actionDetails.async, ...params);
        }
        else {
            listOfActions[key] = actions.makeActionCreator(code, ...params);

            // install the reducer
            listOfReducers.push({
                      code,
                fnc:  actionDetails.reducer
            });
        }
    });

    // the output of the actionMap: actions & reducer
    model.actions = listOfActions;
    model.reducer = (state = model.initialState, action = {}) => {

        let reducer = find(listOfReducers, reducer => reducer.code === action.type);
        if (reducer)
            state = reducer.fnc(state, action);
        return state;
    };
}

module.exports = {
    parseActionMap,
    publicAPI: {}   // no public exports
};

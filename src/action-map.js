var actions = require('./actions');

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
        listOfPrivateActions = {},
        listOfReducers = [];

    Object.keys(model.actionMap).forEach(key => {

        let actionDetails = model.actionMap[key],
            code          = `${model.name}_${key}`,
            params        = actionDetails.params,
            putHere       = actionDetails.private ? listOfPrivateActions : listOfActions;

        if (typeof params === 'string')
            params = [params];
        else if (!params)
            params = [];

        // add an action-creator. async is handled differently
        if (actionDetails.async) {
            putHere[key] = actions.makeAsyncAction(actionDetails.async, ...params);
        }
        else {
            putHere[key] = actions.makeActionCreator(code, ...params);

            // install the reducer
            listOfReducers.push({
                code,
                fnc:  actionDetails.reducer
            });
        }
    });

    // the output of the actionMap: public actions, private actions, and reducer
    model.actions = listOfActions;
    model.privateActions = listOfPrivateActions;
    model.reducer = (state = model.initialState, action = {}) => {

        let matcher     = reducer => reducer.code === action.type,
            reducerInfo = find(listOfReducers, matcher);

        if (!reducerInfo)
            reducerInfo = find(listOfPrivateActions, matcher);

        if (reducerInfo)
            state = reducerInfo.fnc(state, action);
        return state;
    };

    // this can be used one time only.
    // it retrieves the list of private actions, and severs
    // that list from the public model.
    //
    if (Object.keys(listOfPrivateActions).length > 0) {
        model.severPrivateActions = () => {
            var trulyPrivateActions = model.privateActions;
            model.privateActions = null;
            return trulyPrivateActions;
        }
    }
}

module.exports = {
    parseActionMap,
    publicAPI: {}   // no public exports
};

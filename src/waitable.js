let assignDeep = require('assign-deep'),
    actions    = require('./actions'),
    counter    = 1;

let waitingSelector = state => state.waiting;

function makeWaitable(model) {

    //------ ACTION CODES (private)
    // make some custom action codes
    let thisWaitableID        = counter++,
        actionCodeWait        = `WAITABLE[${thisWaitableID}]_WAIT_${model.name}`,
        actionCodeStopWaiting = `WAITABLE[${thisWaitableID}]_STOP_${model.name}`;

    //----- INITIAL STORE STRUCTURE
    let initialState = {waiting: false};

    //----- SELECTORS
    // the waitable flag is merged into the model's store. it's public,
    // which means clients can subscribe to changes
    if (typeof model.selectors !== 'object')
        model.selectors = {};
    model.selectors.waiting = waitingSelector;

    //----- ACTIONS
    // add some new actions to the model's public api
    if (typeof model.actions !== 'object')
        model.actions = {};
    model.actions.wait        = actions.makeActionCreator(actionCodeWait);
    model.actions.stopWaiting = actions.makeActionCreator(actionCodeStopWaiting);

    //----- REDUCER
    // add our handlers to the reducer
    let originalReducer = model.reducer;
    model.reducer = (state, action) => {

        // merge our initial state into the parent reducer's
        if (typeof state === 'undefined')
            state = assignDeep({}, originalReducer(state, action), initialState);

        if (action.type === actionCodeWait)
            return assignDeep({}, state, {waiting: true});

        if (action.type === actionCodeStopWaiting)
            return assignDeep({}, state, {waiting: false});

        return originalReducer(state, action);
    };
}

module.exports = {

    // this is only available inside the library
    makeWaitable,

    // no public exports to end-users
    publicAPI: {}
};
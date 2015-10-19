var deepAssign = require('deep-assign'),
    object = require('./object');

let waitableCounter = 1;
function makeWaitable(model) {

    //------ ACTION CODES (private)
    // make some custom action codes
    let thisWaitableID        = waitableCounter++,
        actionCodeWait        = 'WAITABLE_WAIT_' + thisWaitableID,
        actionCodeStopWaiting = 'WAITABLE_STOP_' + thisWaitableID;

    //----- INITIAL STORE STRUCTURE
    let initialState = {waiting: false};

    //----- ACCESSORS
    // we put all waitable properties into a custom object in the store.
    // these are public, to allow clients to subscribe to changes
    let waitingAccessor = 'waiting';
    if (typeof model.accessors !== 'object')
        model.accessors = {};
    model.accessors.waiting = waitingAccessor;

    //----- ACTIONS
    // add some new actions to the model's public api
    if (typeof model.actions !== 'object')
        model.actions = {};
    model.actions.wait = makeActionCreator(actionCodeWait);
    model.actions.stopWaiting = makeActionCreator(actionCodeStopWaiting);

    //----- REDUCER
    // add our handlers to the reducer
    let originalReducer = model.reducer;
    model.reducer = (state, action) => {

        // merge our initial state into the parent reducer's
        if (typeof state === 'undefined')
            state = deepAssign({}, originalReducer(), initialState);

        if (action.type === actionCodeWait)
            return object.copyAndAssign(state, waitingAccessor, true);
        if (action.type === actionCodeStopWaiting)
            return object.copyAndAssign(state, waitingAccessor, false);
        return originalReducer(state, action);
    };
}

module.exports = {
    makeWaitable
};
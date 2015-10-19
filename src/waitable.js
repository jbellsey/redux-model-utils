var deepAssign = require('deep-assign'),
    object     = require('./object'),
    actions    = require('./actions'),
    counter    = 1;

function makeWaitable(model) {

    //------ ACTION CODES (private)
    // make some custom action codes
    let thisWaitableID        = counter++,
        actionCodeWait        = `WAITABLE_WAIT_${model.name}_${thisWaitableID}`,
        actionCodeStopWaiting = `WAITABLE_STOP_${model.name}_${thisWaitableID}`;

    //----- INITIAL STORE STRUCTURE
    let initialState = {waiting: false};

    //----- ACCESSORS
    // the waitable flag is merged into the model's store. it's public,
    // which means clients can subscribe to changes
    let waitingAccessor = 'waiting';
    if (typeof model.accessors !== 'object')
        model.accessors = {};
    model.accessors.waiting = waitingAccessor;

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
            state = deepAssign({}, originalReducer(), initialState);

        if (action.type === actionCodeWait)
            return object.copyAndAssign(state, waitingAccessor, true);
        if (action.type === actionCodeStopWaiting)
            return object.copyAndAssign(state, waitingAccessor, false);
        return originalReducer(state, action);
    };
}

module.exports = {

    // this is only available inside the library
    makeWaitable,

    // no public exports to end-users
    publicAPI: {}
};
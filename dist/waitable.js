'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var deepAssign = require('deep-assign'),
    object = require('./object'),
    actions = require('./actions'),
    counter = 1;

var waitingSelector = function waitingSelector(state) {
    return state.waiting;
};

function makeWaitable(model) {

    //------ ACTION CODES (private)
    // make some custom action codes
    var thisWaitableID = counter++,
        actionCodeWait = 'WAITABLE_WAIT_' + model.name + '_' + thisWaitableID,
        actionCodeStopWaiting = 'WAITABLE_STOP_' + model.name + '_' + thisWaitableID;

    //----- INITIAL STORE STRUCTURE
    var initialState = { waiting: false };

    //----- SELECTORS
    // the waitable flag is merged into the model's store. it's public,
    // which means clients can subscribe to changes
    if (_typeof(model.selectors) !== 'object') model.selectors = {};
    model.selectors.waiting = waitingSelector;

    //----- ACTIONS
    // add some new actions to the model's public api
    if (_typeof(model.actions) !== 'object') model.actions = {};
    model.actions.wait = actions.makeActionCreator(actionCodeWait);
    model.actions.stopWaiting = actions.makeActionCreator(actionCodeStopWaiting);

    //----- REDUCER
    // add our handlers to the reducer
    var originalReducer = model.reducer;
    model.reducer = function (state, action) {

        // merge our initial state into the parent reducer's
        if (typeof state === 'undefined') state = deepAssign({}, originalReducer(), initialState);

        if (action.type === actionCodeWait) {
            state = object.clone(state);
            state.waiting = true;
            return state;
        }
        if (action.type === actionCodeStopWaiting) {
            state = object.clone(state);
            state.waiting = false;
            return state;
        }
        return originalReducer(state, action);
    };
}

module.exports = {

    // this is only available inside the library
    makeWaitable: makeWaitable,

    // no public exports to end-users
    publicAPI: {}
};
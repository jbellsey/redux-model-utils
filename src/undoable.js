var store = require('./store');

function makeUndoable(model) {

    let undoOptions  = model.options.undoable,
        plugin       = undoOptions.plugin,
        pluginConfig = undoOptions.config,
        undoable     = plugin.default,
        undoActions  = plugin.ActionCreators;

    // sanity check
    if (typeof undoable !== 'function' || typeof undoActions !== 'object') {
        throw new Error('redux-utils: You must load the "redux-undo" library if you request an undoable');
    }

    //----- SELECTORS
    // allow clients to look at the size of the undo & redo stacks.
    // note: these will break inside your reducer, which only sees "present"
    //
    if (typeof model.selectors !== 'object')
        model.selectors = {};
    model.selectors.undoLength = 'past.length';     // these selectors must be strings; see model.js for comments
    model.selectors.redoLength = 'future.length';

    //----- ACTIONS
    // add some new actions to the model's public api
    //
    if (typeof model.actions !== 'object')
        model.actions = {};
    model.actions.undo = () => store.getStore().dispatch(undoActions.undo());
    model.actions.redo = () => store.getStore().dispatch(undoActions.redo());

    //----- REDUCER
    // wrap it
    //
    model.reducer = undoable(model.reducer, pluginConfig);
}

module.exports = {

    // this is only available inside the library
    makeUndoable,

    // no public exports to end-users
    publicAPI: {}
};
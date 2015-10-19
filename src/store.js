//---- store management
//
// several modules need access to the main store.
// so users must call setStore() before running any actions;
// ideally, immediately after creating the store.
//

var store;

module.exports = {

    setStore: (s) => store = s,
    getStore: ()  => store
};

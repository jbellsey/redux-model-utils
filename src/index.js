var deepAssign = require('deep-assign'),
    actions    = require('./actions'),
    store      = require('./store'),
    object     = require('./object'),
    model      = require('./model'),
    subscribe  = require('./subscribe'),
    waitable   = require('./waitable');

module.exports = deepAssign({}, actions, store, object, model, subscribe, waitable);

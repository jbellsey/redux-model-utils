var components = [
        require('./actions'),
        require('./store'),
        require('./object'),
        require('./model'),
        require('./subscribe'),
        require('./waitable'),
        require('./undoable')
    ],
    output = {};

// shallow merge
components.forEach(module => {

    // if a module has a "publicAPI" key, use that object for public access.
    // that just means that a module offers different functionality within
    // this library than it does to consumers.
    //
    if (module.publicAPI)
        module = module.publicAPI;

    Object.keys(module).forEach(key => {
        output[key] = module[key];
    })
});

module.exports = output;

var components = [
        require('./actions'),
        require('./store'),
        require('./model'),
        require('./react'),
        require('./subscribe'),
        require('./waitable')
    ],
    output = {};

// shallow merge. all APIs are exposed at the top level
//
components.forEach(oneModule => {

    // if a module has a "publicAPI" key, use that object for public access.
    // that just means that a module offers different functionality within
    // this library than it does to consumers.
    //
    if (oneModule.publicAPI)
        oneModule = oneModule.publicAPI;

    Object.keys(oneModule).forEach(key => {
        output[key] = oneModule[key];
    })
});

module.exports = output;

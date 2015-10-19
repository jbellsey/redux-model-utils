var components = [
        require('./actions'),
        require('./store'),
        require('./object'),
        require('./model'),
        require('./subscribe'),
        require('./waitable')
    ],
    output = {};

// shallow merge
components.forEach(module => {
    Object.keys(module).forEach(key => {
        output[key] = module[key];
    })
});

module.exports = output;

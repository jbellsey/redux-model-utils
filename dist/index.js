"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

(function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw (f.code = "MODULE_NOT_FOUND", f);
            }var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
                var n = t[o][1][e];return s(n ? n : e);
            }, l, l.exports, e, t, n, r);
        }return n[o].exports;
    }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) s(r[o]);return s;
})({ 1: [function (require, module, exports) {
        var clone = (function () {
            'use strict';

            /**
             * Clones (copies) an Object using deep copying.
             *
             * This function supports circular references by default, but if you are certain
             * there are no circular references in your object, you can save some CPU time
             * by calling clone(obj, false).
             *
             * Caution: if `circular` is false and `parent` contains circular references,
             * your program may enter an infinite loop and crash.
             *
             * @param `parent` - the object to be cloned
             * @param `circular` - set to true if the object to be cloned may contain
             *    circular references. (optional - true by default)
             * @param `depth` - set to a number if the object is only to be cloned to
             *    a particular depth. (optional - defaults to Infinity)
             * @param `prototype` - sets the prototype to be used when cloning an object.
             *    (optional - defaults to parent prototype).
            */
            function clone(parent, circular, depth, prototype) {
                var filter;
                if (typeof circular === 'object') {
                    depth = circular.depth;
                    prototype = circular.prototype;
                    filter = circular.filter;
                    circular = circular.circular;
                }
                // maintain two arrays for circular references, where corresponding parents
                // and children have the same index
                var allParents = [];
                var allChildren = [];

                var useBuffer = typeof Buffer != 'undefined';

                if (typeof circular == 'undefined') circular = true;

                if (typeof depth == 'undefined') depth = Infinity;

                // recurse this function so we don't reset allParents and allChildren
                function _clone(parent, depth) {
                    // cloning null always returns null
                    if (parent === null) return null;

                    if (depth == 0) return parent;

                    var child;
                    var proto;
                    if (typeof parent != 'object') {
                        return parent;
                    }

                    if (clone.__isArray(parent)) {
                        child = [];
                    } else if (clone.__isRegExp(parent)) {
                        child = new RegExp(parent.source, __getRegExpFlags(parent));
                        if (parent.lastIndex) child.lastIndex = parent.lastIndex;
                    } else if (clone.__isDate(parent)) {
                        child = new Date(parent.getTime());
                    } else if (useBuffer && Buffer.isBuffer(parent)) {
                        child = new Buffer(parent.length);
                        parent.copy(child);
                        return child;
                    } else {
                        if (typeof prototype == 'undefined') {
                            proto = Object.getPrototypeOf(parent);
                            child = Object.create(proto);
                        } else {
                            child = Object.create(prototype);
                            proto = prototype;
                        }
                    }

                    if (circular) {
                        var index = allParents.indexOf(parent);

                        if (index != -1) {
                            return allChildren[index];
                        }
                        allParents.push(parent);
                        allChildren.push(child);
                    }

                    for (var i in parent) {
                        var attrs;
                        if (proto) {
                            attrs = Object.getOwnPropertyDescriptor(proto, i);
                        }

                        if (attrs && attrs.set == null) {
                            continue;
                        }
                        child[i] = _clone(parent[i], depth - 1);
                    }

                    return child;
                }

                return _clone(parent, depth);
            }

            /**
             * Simple flat clone using prototype, accepts only objects, usefull for property
             * override on FLAT configuration object (no nested props).
             *
             * USE WITH CAUTION! This may not behave as you wish if you do not know how this
             * works.
             */
            clone.clonePrototype = function clonePrototype(parent) {
                if (parent === null) return null;

                var c = function c() {};
                c.prototype = parent;
                return new c();
            };

            // private utility functions

            function __objToStr(o) {
                return Object.prototype.toString.call(o);
            };
            clone.__objToStr = __objToStr;

            function __isDate(o) {
                return typeof o === 'object' && __objToStr(o) === '[object Date]';
            };
            clone.__isDate = __isDate;

            function __isArray(o) {
                return typeof o === 'object' && __objToStr(o) === '[object Array]';
            };
            clone.__isArray = __isArray;

            function __isRegExp(o) {
                return typeof o === 'object' && __objToStr(o) === '[object RegExp]';
            };
            clone.__isRegExp = __isRegExp;

            function __getRegExpFlags(re) {
                var flags = '';
                if (re.global) flags += 'g';
                if (re.ignoreCase) flags += 'i';
                if (re.multiline) flags += 'm';
                return flags;
            };
            clone.__getRegExpFlags = __getRegExpFlags;

            return clone;
        })();

        if (typeof module === 'object' && module.exports) {
            module.exports = clone;
        }
    }, {}], 2: [function (require, module, exports) {
        'use strict';
        var isObj = require('is-obj');
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        var propIsEnumerable = Object.prototype.propertyIsEnumerable;

        function toObject(val) {
            if (val === null || val === undefined) {
                throw new TypeError('Sources cannot be null or undefined');
            }

            return Object(val);
        }

        function assignKey(to, from, key) {
            var val = from[key];

            if (val === undefined || val === null) {
                return;
            }

            if (hasOwnProperty.call(to, key)) {
                if (to[key] === undefined || to[key] === null) {
                    throw new TypeError('Cannot convert undefined or null to object (' + key + ')');
                }
            }

            if (!hasOwnProperty.call(to, key) || !isObj(val)) {
                to[key] = val;
            } else {
                to[key] = assign(Object(to[key]), from[key]);
            }
        }

        function assign(to, from) {
            if (to === from) {
                return to;
            }

            from = Object(from);

            for (var key in from) {
                if (hasOwnProperty.call(from, key)) {
                    assignKey(to, from, key);
                }
            }

            if (Object.getOwnPropertySymbols) {
                var symbols = Object.getOwnPropertySymbols(from);

                for (var i = 0; i < symbols.length; i++) {
                    if (propIsEnumerable.call(from, symbols[i])) {
                        assignKey(to, from, symbols[i]);
                    }
                }
            }

            return to;
        }

        module.exports = function deepAssign(target) {
            target = toObject(target);

            for (var s = 1; s < arguments.length; s++) {
                assign(target, arguments[s]);
            }

            return target;
        };
    }, { "is-obj": 3 }], 3: [function (require, module, exports) {
        'use strict';
        module.exports = function (x) {
            var type = typeof x;
            return x !== null && (type === 'object' || type === 'function');
        };
    }, {}], 4: [function (require, module, exports) {
        var store = require('./store').getStore;

        // returns a redux-standard action object. it always has a {type} key,
        // plus whatever values you request in the [valueNames] and [values] arrays.
        // this should not typically be needed by client applications; use the other
        // tools provided below.
        //
        function makeAction(type, valueNames, values) {
            var action = { type: type };
            valueNames.forEach(function (arg, index) {
                action[valueNames[index]] = values[index];
            });
            return action;
        }

        // builds a partially-applied function for creating actions dynamically.
        // this is the most common way to build and dispatch actions.
        //
        // example:
        //      let add = makeActionCreator('adder', 'number');
        //      add(5);
        //
        function makeActionCreator(type) {
            for (var _len = arguments.length, argNames = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                argNames[_key - 1] = arguments[_key];
            }

            return function () {
                for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                    args[_key2] = arguments[_key2];
                }

                var action = makeAction(type, argNames, args);
                store().dispatch(action);
            };
        }

        // this lets you patch into the process, instead of dispatching an action directly.
        // inside your callback, you can call other (synchronous) actions within your async code.
        //
        //      let asyncAdd = makeAsyncAction(args => {
        //            add(args.number);
        //      }, 'number');
        //
        function makeAsyncAction(cb) {
            for (var _len3 = arguments.length, argNames = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
                argNames[_key3 - 1] = arguments[_key3];
            }

            return function () {
                for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
                    args[_key4] = arguments[_key4];
                }

                // make a placeholder action object, just to collect the given args. its type will be null,
                // but its other keys will match the requested argument names, just as with normal action creators.
                //
                var argObject = makeAction(null, argNames, args),

                // this thunk is sent to the dispatcher. it will only work properly if the user
                // has installed and configured the [redux-thunk] library
                //
                thunk = function thunk(dispatch, getState) {
                    return cb(argObject, dispatch, getState);
                };

                // we pass back the result of the user's callback. e.g., return a promise for chaining
                return store().dispatch(thunk);
            };
        }

        module.exports = {
            makeActionCreator: makeActionCreator,
            makeAsyncAction: makeAsyncAction
        };
    }, { "./store": 9 }], 5: [function (require, module, exports) {
        var components = [require('./actions'), require('./store'), require('./object'), require('./model'), require('./react'), require('./subscribe'), require('./waitable'), require('./undoable')],
            output = {};

        // shallow merge. all APIs are exposed at the top level
        //
        components.forEach(function (module) {

            // if a module has a "publicAPI" key, use that object for public access.
            // that just means that a module offers different functionality within
            // this library than it does to consumers.
            //
            if (module.publicAPI) module = module.publicAPI;

            Object.keys(module).forEach(function (key) {
                output[key] = module[key];
            });
        });

        module.exports = output;
    }, { "./actions": 4, "./model": 6, "./object": 7, "./react": 8, "./store": 9, "./subscribe": 10, "./undoable": 11, "./waitable": 12 }], 6: [function (require, module, exports) {
        var object = require('./object'),
            actions = require('./actions'),
            waitable = require('./waitable'),
            undoable = require('./undoable'),
            react = require('./react'),
            store = require('./store'),
            subscribe = require('./subscribe');

        var startsWith = function startsWith(haystack, needle) {
            return haystack.indexOf(needle) === 0;
        };

        // create direct getters for accessing the underlying model: "model.data.property"
        // one accessor is created for each selector in your list (and with the same name)
        // we also create a top-level accessor "model.allData" to retrieve the full state.
        //
        function buildAccessors(model) {

            var data = {};

            Object.keys(model.selectors).forEach(function (key) {
                Object.defineProperty(data, key, {
                    get: function get() {
                        return object.lookup(store.getStore().getState(), model.selectors[key]);
                    }
                });
            });
            model.data = data;

            Object.defineProperty(model, 'allData', {
                get: function get() {
                    return object.clone(store.getStore().getState()[model.name]);
                }
            });
        }

        /*
         adjust the model's selectors to include the model name, and possibly "present" to
         account for the use of the redux-undo library.
        
         our use of combineReducers() (see store.js) causes each model's store to be scoped
         inside an object whose key is the model name.
        
         so inside the model you may have a store that looks like this: {userID}. but
         outside the model, that store looks like this: {model: {userID}}.
        
         so for consumers wanting to subscribe to changes on the model, they need to have
         a selector prefixed with the model name: "model.userID". but inside the model,
         you probably still need the unscoped version for use inside your reducer.
        
         ORIGINAL:  selector.location = "location"
         MODIFIED:  selector.location = modelName + ".location"
        
         if the model is undoable, the selectors are then scoped to "present":
        
         UNDOABLE:  selector.location = modelName + ".present.location";
        
         NOTE: this actually SEVERS the connection to [model.selectors], and inserts an
         entirely new object map.
         */

        function mapSelectors(model) {

            // make a full copy of the selectors
            var newSelectors = object.clone(model.selectors || {}),
                isUndoable = model.options && model.options.undoable,
                presentPrefix = 'present.',
                pastPrefix = 'past.',
                futurePrefix = 'future.',
                modelNamePrefix = model.name + '.',
                fixOneSelector = function fixOneSelector(selectorKey) {

                var orig = newSelectors[selectorKey];

                if (typeof orig === 'string') {

                    if (isUndoable) {

                        // undoables must start with modelname, then "present"
                        // we omit "present" if we find "past" or "future", which means
                        // the user is being deliberate about which undo stack they want
                        //
                        if (!(startsWith(orig, presentPrefix) || startsWith(orig, pastPrefix) || startsWith(orig, futurePrefix))) orig = modelNamePrefix + presentPrefix + orig;else if (!startsWith(orig, modelNamePrefix)) orig = modelNamePrefix + orig;
                        newSelectors[selectorKey] = orig;
                    } else {
                        // not undoable: selector must start with the model name
                        if (!startsWith(orig, modelNamePrefix)) newSelectors[selectorKey] = modelNamePrefix + orig;
                    }
                } else if (typeof orig === 'function') {

                    if (isUndoable) {
                        // for function selectors, we can't tell if the function is looking into
                        // the past or future zones. we have to assume present. for past/future
                        // selectors, you must use a string.
                        //
                        newSelectors[selectorKey] = function (state) {
                            return orig(state[model.name].present);
                        };
                    } else {
                        newSelectors[selectorKey] = function (state) {
                            return orig(state[model.name]);
                        };
                    }
                }
            };

            Object.keys(newSelectors).forEach(fixOneSelector);

            // look! we're overwriting your selector map!
            model.rawSelectors = model.selectors;
            model.selectors = newSelectors;
        }

        /*
            if provided, the action map must be in this format:
                actionMap = {
                    key: {
                        code:   UNIQUE_STRING,
                        params: [array, of, strings, for, action, creator]
                        reducer(state, action) => {}
                    }
                }
        
            and if you provide it, you must also attach an "initialState" object to the model.
         */

        function find(arr, predicate) {

            var value = undefined,
                i = undefined;
            for (i = 0; i < arr.length; ++i) {
                if (predicate(value = arr[i])) return value;
            }
            return undefined;
        }

        function parseActionMap(model) {

            var listOfActions = {},
                listOfReducers = [];

            Object.keys(model.actionMap).forEach(function (key) {

                var actionDetails = model.actionMap[key],
                    code = model.name + "_" + actionDetails.code,
                    params = actionDetails.params;

                if (typeof params === 'string') params = [params];else if (!params) params = [];

                // add an action-creator. async is handled differently
                if (actionDetails.async) {
                    listOfActions[key] = actions.makeAsyncAction.apply(actions, [actionDetails.async].concat(_toConsumableArray(params)));
                } else {
                    listOfActions[key] = actions.makeActionCreator.apply(actions, [code].concat(_toConsumableArray(params)));

                    // install the reducer
                    listOfReducers.push({
                        code: code,
                        fnc: actionDetails.reducer
                    });
                }
            });

            // the output of the actionMap: actions & reducer
            model.actions = listOfActions;
            model.reducer = function () {
                var state = arguments.length <= 0 || arguments[0] === undefined ? model.initialState : arguments[0];
                var action = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

                var reducer = find(listOfReducers, function (reducer) {
                    return reducer.code === action.type;
                });
                if (reducer) state = reducer.fnc(state, action);
                return state;
            };
        }

        // modify the public API for each model.
        //
        function modelBuilder(model) {

            //----------
            // merge in common functionality for all models
            //

            // pass through the subscribe method, so views don't have to import this library
            //
            model.subscribe = subscribe.subscribe;

            //----------
            // the user can specify actions & reducer in the form of an actionMap; see above
            if (model.actionMap && model.initialState) parseActionMap(model);

            // TODO: make ez-selectors
            // i.e., if no selectors are provided, map the top level of the initialState object.
            // so this will work for action maps only

            //----------
            // MAGIC code
            //

            if (typeof model.options === 'object') {

                // let a model easily request "waitable" functionality. this will be installed for you:
                //
                //  • actions for  "wait()" and "stopWaiting()". these are public, so they
                //      can be called by the view, or from inside your own async code
                //  • a boolean in the store. subscribe to changes at model.selectors.waiting
                //
                if (model.options.waitable) waitable.makeWaitable(model);

                // similar for undoable functionality. adds actions (undo, redo) and subscribable
                // properties (undoLength, redoLength)
                //
                if (typeof model.options.undoable === 'object') undoable.makeUndoable(model);
            }

            //----------
            // for usage of this library with react, prepare a selector map for use with
            // the connect() function provided by react-redux. does not affect non-react apps.
            //
            react.reactify(model);

            //----------
            // nasty, overwritey, we-know-better-than-you stuff. dragons, and all that.

            // make some changes to the selectors object
            mapSelectors(model);

            // build a list of accessors for getting the underlying data
            buildAccessors(model);

            //----------
            // close it up!
            //

            return Object.freeze(model);
        }

        module.exports = {
            modelBuilder: modelBuilder
        };
    }, { "./actions": 4, "./object": 7, "./react": 8, "./store": 9, "./subscribe": 10, "./undoable": 11, "./waitable": 12 }], 7: [function (require, module, exports) {
        var clone = require('clone'),
            deepAssign = require('deep-assign');

        /*
            two ways to use:
            READ ("peek"):  deepPeekAndPoke(obj, "dot.notation.string")
            WRITE ("poke"): deepPeekAndPoke(obj, "dot.notation.string", newValue)
        
            note: the WRITE signature is NOT PURE. it modifies {obj} in place.
            you should use the ASSIGN tool for writing, or even better, cloneAndAssign
            for purity.
        */

        function deepPeekAndPoke(obj, selectorString, val) {

            var props = selectorString.split('.'),
                final = props.pop(),
                p = undefined;

            while (p = props.shift()) {
                if (typeof obj[p] === 'undefined') return undefined;
                obj = obj[p];
            }

            // peek:
            if (typeof val === 'undefined') return obj[final];

            // poke:
            obj[final] = val; // no return value when used as a setter
        }

        function lookup(obj, selector) {
            if (typeof selector === 'string') return deepPeekAndPoke(obj, selector);else if (typeof selector === 'function') return selector(obj);
        }

        // use this signature when writing.
        // it's destructive though; see below
        //
        function assign(obj, selectorString, val) {
            deepPeekAndPoke(obj, selectorString, val);
            return obj;
        }

        // non-destructive (pure) version of assign
        //
        function cloneAndAssign(obj, selectorString, val) {
            var result = clone(obj); // makes with a full, deep copy of the source object
            if (typeof selectorString === 'function') throw new Error('redux-model-utils: cloneAndAssign does not accept a function selector; strings only');
            assign(result, selectorString, val);
            return result;
        }

        module.exports = {

            // one input object only
            clone: clone,

            // first input is for duping; other inputs get assigned
            cloneAndMerge: function cloneAndMerge(source) {
                for (var _len5 = arguments.length, merges = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
                    merges[_key5 - 1] = arguments[_key5];
                }

                return deepAssign.apply(undefined, [clone(source)].concat(merges));
            },

            // accepts an selector string or function
            lookup: lookup, // (obj, selector) => value

            // signature of these two methods is the same:
            //      assign(obj, selectorString, newValue)
            //
            cloneAndAssign: cloneAndAssign, // pure, non-destructive
            assign: assign // destructive. DRAGONS!
        };
    }, { "clone": 1, "deep-assign": 2 }], 8: [function (require, module, exports) {
        var deepAssign = require('deep-assign'),
            lookup = require('./object').lookup;

        // builds a function that returns a new map of selectors.
        // the new map is scoped to the model name. used for setting
        // up react-redux
        //
        function externalizeSelectors(selectors, modelName) {

            return function (state) {

                return Object.keys(selectors).reduce(function (map, sel) {

                    var thisSelector = selectors[sel];

                    if (typeof thisSelector === 'function') map[sel] = thisSelector(state[modelName]);else if (typeof thisSelector === 'string') map[sel] = lookup(state, modelName + "." + thisSelector);

                    return map;
                }, {});
            };
        }

        function reactify(model) {
            model.reactSelectors = externalizeSelectors(model.selectors || {}, model.name);
        }

        // merge the reactSelectors from multiple models for use in a single connected component.
        // duplicate keys will be last-in priority
        //
        function mergeReactSelectors() {
            for (var _len6 = arguments.length, models = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
                models[_key6] = arguments[_key6];
            }

            return function (state) {

                var props = {};
                (models || []).forEach(function (model) {
                    return deepAssign(props, model.reactSelectors(state));
                });
                return props;
            };
        }

        module.exports = {

            // these exports are only available inside this library
            reactify: reactify,

            // and these are visible to consumers
            publicAPI: {
                mergeReactSelectors: mergeReactSelectors
            }
        };
    }, { "./object": 7, "deep-assign": 2 }], 9: [function (require, module, exports) {
        //---- store management
        //
        // several of our modules need access to the main store.
        // users must call setStore() immediately after creating the store.
        //

        var store;

        /*
            takes an array of models, and builds a map of reducers for passing
            to combineReducers(). for example:
        
                var models        = [require('./models/geo'), require('./models/reddit')],
                    reducerMap    = buildReducerMap(models),
                    masterReducer = redux.combineReducers(reducerMap),
                    masterStore   = createStoreWithMiddleware(masterReducer);
        
            the result is an object like this:
        
                reducerMap = {
                    'geo':    geo.reducer,
                    'reddit': reddit.reducer
                }
        
            see [model.js] as well, where we modify the model's selectors to account
            for how stores are now one level deeper.
        */
        function buildReducerMap(modelArray) {
            return (modelArray || []).reduce(function (map, model) {
                map[model.name] = model.reducer;
                return map;
            }, {});
        }

        module.exports = {

            buildReducerMap: buildReducerMap,

            setStore: function setStore(s) {
                return store = s;
            },
            getStore: function getStore() {
                return store;
            }
        };
    }, {}], 10: [function (require, module, exports) {
        var store = require('./store').getStore,
            object = require('./object');

        /**
         * Custom wrapper around store.subscribe. This is patched into every model (see model.js)
         *
         * Usage:
         *      myModel.subscribe(myModel.selectors.userID, (newUserID) => {log(newUserID)});
         *
         * @param selector {(string|function)}
         * A string in dot notation, or a selector function with signature (state) => value. This
         * is used to find the property of interest in your store (e.g., "user.id")
         *
         * @param cb {function}
         * This function will be called only when the observed value changes. Its signature is simple:
         *      (newValue, previousValue) => {}
         *
         * @param opts{object}
         * Subscription options. Currently only one option is available:
         *      {noInit:true} to suppress invoking the callback once at initialization time
         *
         * @returns {function}
         * Passes back the return from store.subscribe() -- i.e., the unsubscribe function
         *
         */
        function subscribe(selector, cb, opts) {

            var previousValue,
                val = function val() {
                return object.lookup(store().getState(), selector);
            },
                handler = function handler() {
                var currentValue = val();
                if (previousValue !== currentValue) {
                    var temp = previousValue;
                    previousValue = currentValue;
                    cb(currentValue, temp);
                }
            };

            // normally, we invoke the callback on startup, so that it gets
            // an initial value. you can suppress this with opts.noInit
            //
            if (!(opts && opts.noInit)) cb(previousValue = val());

            // return the unsubscribe function to the caller
            return store().subscribe(handler);
        }

        module.exports = {
            subscribe: subscribe
        };
    }, { "./object": 7, "./store": 9 }], 11: [function (require, module, exports) {
        var store = require('./store');

        function makeUndoable(model) {

            var undoOptions = model.options.undoable,
                plugin = undoOptions.plugin,
                pluginConfig = undoOptions.config,
                undoable = plugin["default"],
                undoActions = plugin.ActionCreators;

            // sanity check
            if (typeof undoable !== 'function' || typeof undoActions !== 'object') {
                throw new Error('redux-utils: You must load the "redux-undo" library if you request an undoable');
            }

            //----- SELECTORS
            // allow clients to look at the size of the undo & redo stacks.
            // note: these will break inside your reducer, which only sees "present"
            //
            if (typeof model.selectors !== 'object') model.selectors = {};
            model.selectors.undoLength = 'past.length'; // these selectors must be strings; see model.js for comments
            model.selectors.redoLength = 'future.length';

            //----- ACTIONS
            // add some new actions to the model's public api
            //
            if (typeof model.actions !== 'object') model.actions = {};
            model.actions.undo = function () {
                return store.getStore().dispatch(undoActions.undo());
            };
            model.actions.redo = function () {
                return store.getStore().dispatch(undoActions.redo());
            };

            //----- REDUCER
            // wrap it
            //
            model.reducer = undoable(model.reducer, pluginConfig);
        }

        module.exports = {

            // this is only available inside the library
            makeUndoable: makeUndoable,

            // no public exports to end-users
            publicAPI: {}
        };
    }, { "./store": 9 }], 12: [function (require, module, exports) {
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
                actionCodeWait = "WAITABLE_WAIT_" + model.name + "_" + thisWaitableID,
                actionCodeStopWaiting = "WAITABLE_STOP_" + model.name + "_" + thisWaitableID;

            //----- INITIAL STORE STRUCTURE
            var initialState = { waiting: false };

            //----- SELECTORS
            // the waitable flag is merged into the model's store. it's public,
            // which means clients can subscribe to changes
            if (typeof model.selectors !== 'object') model.selectors = {};
            model.selectors.waiting = waitingSelector;

            //----- ACTIONS
            // add some new actions to the model's public api
            if (typeof model.actions !== 'object') model.actions = {};
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
    }, { "./actions": 4, "./object": 7, "deep-assign": 2 }] }, {}, [5]);

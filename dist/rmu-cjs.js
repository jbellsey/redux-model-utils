'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

//---- store management
//
// several of our modules need access to the main store.
// users must call setStore() immediately after creating the store.
//

var store = void 0;

/*
    takes an array of models, and builds a map of reducers for passing
    to combineReducers(). for example:

        let models        = [require('./models/geo'), require('./models/reddit')],
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

function getStore() {
    return store;
}

function setStore(s) {
    store = s;
}

// returns a redux-standard action object. it always has a {type} key,
// plus whatever values you request in the [valueNames] and [values] arrays.
// this is not needed by client applications; use the other tools provided below.
//
function makeAction(type, valueNames, values) {
  var action = { type: type };
  valueNames.forEach(function (arg, index) {
    action[valueNames[index]] = values[index];
  });
  return action;
}

// builds a partially-applied function for creating actions dynamically.
// this is the most common way to build and dispatch actions in redux.
//
// example:
//      let add = makeActionCreator('adder', 'number');
//      add(4);
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
    getStore().dispatch(action);
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
    return getStore().dispatch(thunk);
  };
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};





var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();













var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};













var objectWithoutProperties = function (obj, keys) {
  var target = {};

  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }

  return target;
};





















var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

function peek(obj, selectorString) {

  var props = selectorString.split('.'),
      final = props.pop(),
      p = void 0;

  while (p = props.shift()) {
    if (typeof obj[p] === 'undefined') return undefined;
    obj = obj[p];
  }

  return obj[final];
}

function lookup(obj, selector, modelName) {
  if (typeof selector === 'string') {
    if (modelName) selector = modelName + '.' + selector;
    return peek(obj, selector);
  } else if (typeof selector === 'function') {
    if (modelName) obj = obj[modelName];

    try {
      return selector(obj);
    } catch (e) {
      return undefined;
    }
  }
}

function find(arr, predicate) {
  var value = void 0;
  for (var i = 0; i < arr.length; ++i) {
    if (predicate(value = arr[i])) return value;
  }
  return undefined;
}

function isFunction(x) {
  return x instanceof Function;
}

function isObject(x) {
  return x !== null && (typeof x === 'undefined' ? 'undefined' : _typeof(x)) === 'object';
}

// builds a function that returns a new map of selectors.
// the new map is scoped to the model name. used for setting
// up react-redux
//
function externalizeSelectors(selectors, model) {

  var modelName = model.name,
      namespace = model.options.propsNamespace;

  if (namespace !== undefined && typeof namespace !== 'string') {
    console.warn('redux-model-utils: propsNamespace must be a string');
    namespace = null;
  }

  return function (state) {

    var props = Object.keys(selectors).reduce(function (map, sel) {

      // note: older versions of this code had fallbacks for when state[modelName]
      // didn't resolve correctly. this should never happen.
      //
      map[sel] = lookup(state, selectors[sel], modelName);
      return map;
    }, {});

    return namespace ? defineProperty({}, namespace, props) : props;
  };
}

function reactify(model) {

  // the default map of selectors to props
  model.reactSelectors = externalizeSelectors(model.selectors || {}, model);

  // the user can request additional maps be created. each key in the "propsMap"
  // field on the model is converted into a new set of reactSelectors:
  //
  //  model.propsMaps = {key1: selectors, key2: moreSelectors}
  //
  model.propsMaps = Object.keys(model.propsMaps || {}).reduce(function (newPropsMaps, oneMapName) {
    newPropsMaps[oneMapName] = externalizeSelectors(model.propsMaps[oneMapName], model);
    return newPropsMaps;
  }, {});
}

// merge the reactSelectors from multiple models for use in a single connected component.
// duplicate keys will be last-in priority. accepts a list of either models or reactified maps.
//
function mergeReactSelectors() {
  for (var _len = arguments.length, objects = Array(_len), _key = 0; _key < _len; _key++) {
    objects[_key] = arguments[_key];
  }

  return function (state) {

    var props = {};
    (objects || []).forEach(function (oneObject) {

      // is it a model? then pull its already-prepared reactSelectors.
      // otherwise, it's a propsMap that has already been reactified
      if (oneObject._magic_rmu) oneObject = oneObject.reactSelectors;

      Object.assign(props, oneObject(state));
    });
    return props;
  };
}

// create a direct getter for accessing the underlying model: "model.data.property".
// "model.data" will return the entire state tree for a given model. use cautiosly,
// as it's the actual state, not a copy.
//
function buildAccessors(model) {

  Object.defineProperty(model, 'data', {
    get: function get$$1() {
      var state = getStore().getState(),
          subState = state[model.name];

      // this test should always be true
      return (typeof subState === 'undefined' ? 'undefined' : _typeof(subState)) === 'object' ? subState : state;
    }
  });

  // earlier versions of this library exposed "allData", which did the same thing.
  Object.defineProperty(model, 'allData', {
    get: function get$$1() {
      console.warn('Warning: the "allData" accessor is deprecated. Use model.data instead.');
      return model.data;
    }
  });
}

function isAction(obj) {
  return isObject(obj) && (isFunction(obj.reducer) || isFunction(obj.async) || isFunction(obj.thunk));
}

function mapActions(actionMap, namespace, mapInfo) {
  var actionTree = mapInfo.actionTree,
      privateTree = mapInfo.privateTree,
      listOfReducers = mapInfo.listOfReducers;


  Object.keys(actionMap).forEach(function (key) {
    var actionDetails = actionMap[key],
        code = namespace + '~' + key,
        params = actionDetails.params,
        async = actionDetails.async,
        thunk = actionDetails.thunk,
        reducer = actionDetails.reducer,
        isPrivateAction = actionDetails.private,
        subActions = objectWithoutProperties(actionDetails, ['params', 'async', 'thunk', 'reducer', 'private']),
        putHere = void 0,
        actionMethod = void 0;

    // first deal with the action at the top level of this object. it may or may not exist.
    if (isAction(actionDetails)) {
      if (isPrivateAction) {
        putHere = privateTree;
        mapInfo.anyPrivate = true;
      } else putHere = actionTree;

      if (typeof params === 'string') params = [params];else if (!params) params = [];

      // add an action-creator. async is handled differently. (thunk is a synonym)
      var asyncHandler = async || thunk;
      if (asyncHandler) actionMethod = makeAsyncAction.apply(undefined, [asyncHandler].concat(toConsumableArray(params)));else {
        actionMethod = makeActionCreator.apply(undefined, [code].concat(toConsumableArray(params)));

        // install the reducer. private reducers go here as well
        listOfReducers.push({
          code: code,
          fnc: reducer
        });
      }
      putHere[key] = actionMethod;
    }

    // next, deal with nested actions. the root level (handled above) may or
    // may not exist. so sub-actions may be nested inside a new object, or they may
    // be nested as new properties attached directly to the function at the root.
    //
    if (Object.keys(subActions).length > 0) {
      // set up mapInfo at the new nest level
      mapInfo.actionTree = actionTree[key] = actionMethod || {};
      mapInfo.privateTree = privateTree[key] = actionMethod || {};

      // scan all of the sub-actions
      mapActions(actionDetails, key, mapInfo);

      // put mapInfo back the way it was
      mapInfo.actionTree = actionTree;
      mapInfo.privateTree = privateTree;
    }
  });
}

function parseActionMap(model) {

  // this blob will be used by mapActions to track status. consider it
  // a giant return value
  //
  var mapInfo = {
    actionTree: {},
    privateTree: {},
    listOfReducers: [],
    anyPrivate: false
  };

  mapActions(model.actionMap, model.name, mapInfo);

  // the output of the actionMap: public actions, private actions, and a single master reducer
  model.actions = mapInfo.actionTree;
  model.privateActions = mapInfo.privateTree;
  model.reducer = function () {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : model.initialState;
    var action = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


    var matcher = function matcher(reducer) {
      return reducer.code === action.type;
    },
        reducerInfo = find(mapInfo.listOfReducers, matcher);

    if (reducerInfo) state = reducerInfo.fnc(state, action);
    return state;
  };

  // this can be used one time only.
  // it retrieves the list of private actions, and severs
  // that list from the public model.
  //
  if (mapInfo.anyPrivate) {
    model.severPrivateActions = function () {
      var trulyPrivateActions = model.privateActions;
      model.privateActions = null;
      return trulyPrivateActions;
    };
  }
}

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
 * Subscription options. The following options are available:
 *      {noInit:bool} to suppress invoking the callback once at initialization time
 *      {equals:function} to provide a custom test for equality. The default comparator
 *              looks at primitive values only (i.e., a === b).
 *
 * @returns {function}
 * Passes back the return from store.subscribe() -- i.e., the unsubscribe function
 *
 */
function subscribe(selector, cb) {
  var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};


  var previousValue = void 0,
      modelName = this && this._magic_rmu ? this.name : '',
      equals = opts.equals || function (a, b) {
    return a === b;
  },
      val = function val() {
    return lookup(getStore().getState(), selector, modelName);
  },
      handler = function handler() {
    var currentValue = val();
    if (!equals(previousValue, currentValue)) {
      var temp = previousValue;
      previousValue = currentValue;
      cb(currentValue, temp);
    }
  };

  // normally, we invoke the callback on startup, so that it gets
  // an initial value. you can suppress this with opts.noInit
  //
  if (!opts.noInit) cb(previousValue = val());

  // return the unsubscribe function to the caller
  return getStore().subscribe(handler);
}

var allModelNames = [];

// modify the public API for each model.
//
function modelBuilder(model) {

  if (allModelNames.indexOf(model.name) !== -1) throw new Error('redux-model-utils: Two models have the same name (' + model.name + ')');else allModelNames.push(model.name);

  // pre cleanup
  if (!model.options) model.options = {};

  // juice the model name, for conflict-free living
  model.rawName = model.name;
  model.name = 'model$_' + model.name;

  //----------
  // merge in common functionality for all models
  //

  // pass through the subscribe method, so views don't have to import this library
  //
  model.subscribe = subscribe;

  //----------
  // the user can specify actions & reducer in the form of an actionMap; see above
  if (model.actionMap && model.initialState) parseActionMap(model);

  // TODO: make ez-selectors
  // i.e., if no selectors are provided, map the top level of the initialState object.
  // so this will work for action maps only

  //----------
  // for usage of this library with react, prepare a selector map for use with
  // the connect() function provided by react-redux. does not affect non-react apps.
  //
  reactify(model);

  //----------
  // build a list of accessors for getting the underlying data
  buildAccessors(model);

  //----------
  // close it up!
  //
  model._magic_rmu = true;

  return model;
}

exports.mergeReactSelectors = mergeReactSelectors;
exports.modelBuilder = modelBuilder;
exports.makeAction = makeAction;
exports.makeActionCreator = makeActionCreator;
exports.makeAsyncAction = makeAsyncAction;
exports.buildReducerMap = buildReducerMap;
exports.getStore = getStore;
exports.setStore = setStore;

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DEFAULT_OPTS = undefined;

var _DEFAULT_OPTS;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _DefaultLayout = require("./ui/DefaultLayout");

var _DefaultLayout2 = _interopRequireDefault(_DefaultLayout);

var _scopeNames = require("./scopeNames");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var DEFAULT_OPTS = exports.DEFAULT_OPTS = (_DEFAULT_OPTS = {

    contextPath: "",
    appName: null,
    rootProcess: null,

    csrfToken: null,
    auth: null,

    locale: null,
    translations: {},

    layout: _DefaultLayout2.default,
    inputSchema: null,

    history: null,

    scopeSyncTimeout: 1500,

    subProcessAsDialog: true

}, _defineProperty(_DEFAULT_OPTS, _scopeNames.APP_SCOPE, null), _defineProperty(_DEFAULT_OPTS, _scopeNames.USER_SCOPE, null), _defineProperty(_DEFAULT_OPTS, _scopeNames.SESSION_SCOPE, null), _defineProperty(_DEFAULT_OPTS, _scopeNames.LOCAL_SCOPE, null), _DEFAULT_OPTS);

function ensureValid(property) {
    if (!property instanceof Symbol) {

        if (!DEFAULT_OPTS.hasOwnProperty(property)) {
            throw new Error("Invalid config key: " + property);
        }
    }
}

function applyDefaults(theConfig) {
    for (var name in DEFAULT_OPTS) {
        if (DEFAULT_OPTS.hasOwnProperty(name)) {
            theConfig[name] = DEFAULT_OPTS[name];
        }
    }
}

var VALID_KEYS = Object.keys(DEFAULT_OPTS);

/**
 * Configuration object
 *
 */
var theConfig = new Proxy(function () {}, {
    get: function get(config, property) {
        if (property === "keys") {
            return VALID_KEYS;
        }

        return config[property];
    },
    set: function set(config, property, value) {

        ensureValid(property);

        config[property] = value;

        return true;
    },
    apply: function apply(target, thisArg, argumentsList) {
        //console.log("apply",target, thisArg, argumentsList);
        return VALID_KEYS;
    }
});

applyDefaults(theConfig);
exports.default = theConfig;
//# sourceMappingURL=config.js.map
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DEFAULT_OPTS = undefined;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _DefaultLayout = require("./ui/DefaultLayout");

var _DefaultLayout2 = _interopRequireDefault(_DefaultLayout);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEFAULT_OPTS = exports.DEFAULT_OPTS = {
    contextPath: "",
    scopeSyncTimeout: 3000,
    layout: _DefaultLayout2.default,
    translations: {},

    // standard scopes, might not exist in application
    appScope: null,
    userScope: null,
    sessionScope: null,
    localScope: null,

    auth: null,
    inputSchema: null,

    appName: null,
    rootProcess: null,
    locale: null,
    authentication: null,
    csrfToken: null
};

function ensureValid(property) {
    if (!DEFAULT_OPTS.hasOwnProperty(property)) {
        throw new Error("Invalid config key: " + property);
    }
}

var VALID_KEYS = Object.keys(DEFAULT_OPTS);

/**
 * Configuration object
 *
 * @type {{scopeSyncTimeout: number, layout: React.Component, translations: object, contextPath: String}}
 */
exports.default = new Proxy(function () {}, {
    get: function get(config, property) {
        if (property === "keys") {
            return VALID_KEYS;
        }

        ensureValid(property);

        return config[property];
    },
    set: function set(config, property, value) {
        ensureValid(property);

        config[property] = value;

        return true;
    },
    apply: function apply(target, thisArg, argumentsList) {
        console.log("apply", target, thisArg, argumentsList);
        return VALID_KEYS;
    }
});
//# sourceMappingURL=configuration.js.map
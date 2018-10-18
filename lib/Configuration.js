"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.configuration = configuration;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _DefaultLayout = require("./ui/DefaultLayout");

var _DefaultLayout2 = _interopRequireDefault(_DefaultLayout);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEFAULT_OPTS = {
    layout: _DefaultLayout2.default
};

var config = _DefaultLayout2.default;

function configuration(opts) {
    if (opts === undefined) {
        return config;
    }

    config = _extends({}, DEFAULT_OPTS, opts);
}
//# sourceMappingURL=Configuration.js.map
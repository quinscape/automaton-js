"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = uri;

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

var _config = require("./config");

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function evaluateParams(params, usedInPath) {
    var p = "";
    if (params) {
        var sep = "?";
        for (var name in params) {
            if (params.hasOwnProperty(name) && !usedInPath[name]) {
                var value = params[name];
                if (value !== undefined) {
                    p += sep + encodeURIComponent(name) + "=" + encodeURIComponent(value);
                    sep = "&";
                }
            }
        }
    }
    return p;
}

function replacePathVariables(location, params, usedInPath) {
    return location.replace(/{([0-9a-z_]+)\??}/gi, function (match, name) {
        var value = params && params[name];
        if (value === undefined) {
            throw new Error("Undefined path variable '" + name + "' in '" + location + "'");
        }
        usedInPath[name] = true;
        return value;
    });
}

/**
 * Formats a local URI with path patterns and parameters.
 *
 * @param {String} location                 local location e.g. "/app/process/{name}"
 * @param {Object} [params]                   path variable or HTTP parameter to add to the URI. If a parameter name is not present as a path variable, it is used as HTTP parameter.
 * @param {boolean} [containsContextPath]   if set to true, `location` will be assumed to already contain the context path
 * @return {string}
 */
function uri(location, params, containsContextPath) {
    var usedInPath = {};

    location = replacePathVariables(location, params, usedInPath);

    var hPos = location.indexOf("#");
    if (hPos >= 0) {
        location = location.substring(0, hPos);
    }
    var qPos = location.indexOf("?");
    if (qPos >= 0) {
        var current = _url2.default.parse(location, true);
        params = Object.assign(current.query, params);
        location = location.substring(0, qPos);
    }

    var result = (containsContextPath ? "" : _config2.default.contextPath) + location + evaluateParams(params, usedInPath);

    //console.log("URI:", result);

    return result;
}
//# sourceMappingURL=uri.js.map
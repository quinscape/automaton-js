"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (s) {
    var result = (0, _configuration.configuration)().translations[s];

    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
    }

    if (result !== undefined) {
        return format(result, args);
    }

    var colonPos = s.indexOf(':');
    if (colonPos >= 0) {
        s = s.substr(colonPos + 1);
    }

    if (args.length > 0) {
        return "[" + format(s, args) + "]";
    }
    return "[" + s + "]";
};

var _configuration = require("./configuration");

function format(tag, arg) {
    return tag.replace(/{([0-9]+)}/g, function (m, nr) {
        return arg[+nr];
    });
}

/**
 * Returns a translation of the given translation key with additional optional arguments
 * @param {string} s translation tag/key
 * @param {...string} args optional translation parameters
 * @returns {string}
 */
;
//# sourceMappingURL=i18n.js.map
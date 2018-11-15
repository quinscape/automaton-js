"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (s) {
    var result = _config2.default.translations[s];

    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
    }

    if (typeof result === "function") {
        return result(s, args);
    }

    if (result !== undefined) {
        return format(result, args);
    }

    var colonPos = s.indexOf(":");
    if (colonPos >= 0) {
        s = s.substr(colonPos + 1);
    }

    if (args.length > 0) {
        return "[" + format(s, args) + "]";
    }
    return "[" + s + "]";
};

var _config = require("./config");

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function format(tag, args) {
    return tag.replace(/{([0-9]+)}/g, function (m, nr) {
        return args[+nr];
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
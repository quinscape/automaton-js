"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (key) {
    var result = _config2.default.translations[key];

    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
    }

    if (typeof result === "function") {
        return result(key, args);
    }

    if (result !== undefined) {
        return format(result, args);
    }

    var colonPos = key.indexOf(":");
    if (colonPos >= 0) {
        key = key.substr(colonPos + 1);
    }

    if (args.length > 0) {
        return "[" + format(key, args) + "]";
    }
    return "[" + key + "]";
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
 * @param {string} key translation tag/key
 * @param {...string} args optional translation parameters
 * @returns {string}
 */
;
//# sourceMappingURL=i18n.js.map
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.runProcessURI = runProcessURI;
exports.default = runProcess;

var _Process = require("./Process");

var _config = require("./config");

var _config2 = _interopRequireDefault(_config);

var _render = require("./render");

var _render2 = _interopRequireDefault(_render);

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var NUMBER_RE = /^-?[0-9]{1-15}$/;

function prepare(s) {
    if (NUMBER_RE.test(s)) {
        return +s;
    } else {
        return s;
    }
}

function prepareInput(query) {
    var input = {};
    for (var name in query) {
        if (query.hasOwnProperty(name)) {
            var v = query[name];

            if (Array.isArray(v)) {
                var len = v.length;
                var out = new Array(len);
                for (var i = 0; i < len; i++) {
                    out[i] = prepare(v[i]);
                }

                input[name] = out;
            } else {
                input[name] = prepare(v);
            }
        }
    }

    return input;
}

/**
 * High-level entry point to execute a process based on a local URI.
 */
function runProcessURI(uri) {
    var _url$parse = _url2.default.parse(uri, true),
        pathname = _url$parse.pathname,
        query = _url$parse.query;

    var appName = _config2.default.appName,
        contextPath = _config2.default.contextPath;


    if (contextPath && pathname.indexOf(contextPath) !== 0) {
        // if we have a context path, we only intercept when the link starts with the context path.
        return false;
    }

    var baseSegment = contextPath + "/" + appName + "/";
    if (pathname.indexOf(baseSegment) !== 0) {
        // we don't intercept if the link goes to another end-point
        return false;
    }

    var processName = void 0;
    var baseLen = baseSegment.length;
    var lastHrefPos = pathname.length - 1;
    if (pathname[lastHrefPos] === "/") {
        processName = pathname.substr(baseLen, lastHrefPos - baseLen);
    } else {
        processName = pathname.substr(baseLen);
    }

    return runProcess(processName, prepareInput(query));
}

/**
 * High-level entry point to execute a process. Performs the whole initialization procedure and then triggers
 * a rendering of the first view-state.
 *
 * @param {String} processName      process name
 * @param {object} input            input map (processed format with single strings and numbers)
 *
 * @return {Promise}    promise that resolves after the new process has finished rendering.
 */
function runProcess(processName, input) {

    return (0, _Process.fetchProcessInjections)(_config2.default.appName, processName, input).then(function (_ref) {
        var input = _ref.input,
            injections = _ref.injections;
        return (0, _Process.renderProcess)(processName, input, injections, false);
    }).then(function (elem) {
        return (0, _render2.default)(elem);
    }).catch(function (err) {
        return console.error("ERROR RUNNING PROCESS", err);
    });
}
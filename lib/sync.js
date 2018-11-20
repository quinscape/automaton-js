"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.serverSync = serverSync;
exports.storageSync = storageSync;
exports.syncFromStorage = syncFromStorage;
exports.syncFrom = syncFrom;

var _config = require("./config");

var _config2 = _interopRequireDefault(_config);

var _mobx = require("mobx");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var wasCalled = {};

function serverSync(name, scope, uri) {
    //console.log("serverSync", { scope, uri });
    try {
        var csrfToken = _config2.default.csrfToken;


        var json = JSON.stringify((0, _mobx.toJS)(scope));

        var calledOnce = wasCalled[name];

        //console.log("lastSync", calledOnce, "JSON", json);

        if (!calledOnce) {
            wasCalled[name] = true;

            //console.log("Ignoring first sync");
        } else {
            return fetch(window.location.origin + uri, {
                method: "POST",
                credentials: "same-origin",
                headers: _defineProperty({
                    "Content-Type": "text/plain"

                }, csrfToken.header, csrfToken.value),
                body: json
            }).then(function (response) {
                return response.json();
            }).then(function (_ref) {
                var error = _ref.error;

                if (error) {
                    return Promise.reject(error);
                }
            });
        }
    } catch (e) {
        console.error("Error in serverSync", e);
    }
}

function storageSync(name, scope, storage) {
    var json = JSON.stringify((0, _mobx.toJS)(scope));

    storage.setItem("automaton-" + name, json);
}

function syncFromStorage(name, scope, storage) {
    //console.log("syncFromStorage", {name, scope, storage});

    var json = storage.getItem("automaton-" + name);
    if (json) {
        var obj = JSON.parse(json);
        return syncFrom(name, scope, obj);
    }
    return false;
}

function syncFrom(name, scope, obj) {
    if (obj && (typeof obj === "undefined" ? "undefined" : _typeof(obj)) === "object") {
        (0, _mobx.runInAction)(function () {
            for (var _name in obj) {
                if (obj.hasOwnProperty(_name)) {
                    (0, _mobx.set)(scope, _name, obj[_name]);
                }
            }
        });
        return true;
    }
    return false;
}
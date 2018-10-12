"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Process = exports.ScopeContext = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.renderProcess = renderProcess;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _QueryDeclaration = require("./QueryDeclaration");

var _QueryDeclaration2 = _interopRequireDefault(_QueryDeclaration);

var _lib = require("domainql-form/lib/");

var _lib2 = _interopRequireDefault(_lib);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MODULE_REGEX = /\.\/(.*?)\/(components\/(.*?)|.*?)\.js/;

var processes = [];

var secret = Symbol("ProcessSecret");

var ScopeContext = exports.ScopeContext = _react2.default.createContext({
    scope: {
        scope: null,
        userScope: null,
        applicationScope: null,
        process: null,
        auth: null
    }
});

function inject(scope, injections) {
    for (var name in scope) {
        if (scope.hasOwnProperty(name)) {
            var prop = scope[name];
            if (prop instanceof _QueryDeclaration2.default) {
                var result = injections[prop.query];
                if (result === undefined) {
                    throw new Error("Could not find query for prop '" + name + "'");
                }
                scope[name] = result;
            }
        }
    }
}

function renderProcess(initial, ctx) {
    var injections = initial._injections,
        authentication = initial.authentication,
        contextPath = initial.contextPath,
        csrfToken = initial.csrfToken,
        schema = initial.schema;


    var process = void 0;
    var ScopeClass = void 0,
        initProcess = void 0,
        processAccess = void 0;
    var keys = ctx.keys();
    var components = {};

    for (var i = 0; i < keys.length; i++) {
        var moduleName = keys[i];

        var m = MODULE_REGEX.exec(moduleName);

        //console.log(m);

        if (!m) {
            throw new Error("Module name '" + moduleName + "' does not match " + MODULE_REGEX);
        }

        //console.log("-- Process", m[1]);

        var processName = m[1];
        var componentName = m[3];

        if (i === 0) {
            process = new Process(processName, components);
            processAccess = process[secret];
            processes.push(process);
        }

        var module = ctx(moduleName);
        if (componentName) {
            //console.log("process", process);
            components[componentName] = module.default;
        } else {
            ScopeClass = module.default;
            initProcess = module.initProcess;

            if (!initProcess) {
                throw new Error("No initProcess defined in " + moduleName);
            }
        }
    }

    var scope = new ScopeClass();

    inject(scope, injections);

    var states = initProcess(process, scope);
    processAccess.initialized = true;
    processAccess.startState = states.startState;
    processAccess.states = states;

    var Component = components[states.startState];

    if (!Component) {
        throw new Error("No component '" + states.startState + "' in process '" + process.name);
    }

    var env = {
        scope: scope,
        applicationScope: { "_": "notImplemented" },
        userScope: { "_": "notImplemented" },
        authentication: authentication,
        csrfToken: csrfToken,
        contextPath: contextPath
    };

    return _react2.default.createElement(
        ScopeContext.Provider,
        { value: env },
        _react2.default.createElement(Component, {
            env: env
        })
    );
}

var Process = exports.Process = function () {
    function Process(name, components) {
        _classCallCheck(this, Process);

        this[secret] = {
            name: name,
            components: components,
            initialized: false,
            states: null,
            startState: null,
            current: null
        };
    }

    _createClass(Process, [{
        key: "transitionTo",
        value: function transitionTo(state) {
            var initialized = this[secret].initialized;

            if (!initialized) {
                throw new Error("Cannot transition in locked process");
            }
            // TODO: implement
        }
    }, {
        key: "name",
        get: function get() {
            return this[secret].name;
        }
    }, {
        key: "components",
        get: function get() {
            return this[secret].components;
        }
    }, {
        key: "startState",
        get: function get() {
            return this[secret].startState;
        }
    }, {
        key: "states",
        get: function get() {
            return this[secret].states;
        }
    }]);

    return Process;
}();
//# sourceMappingURL=Process.js.map
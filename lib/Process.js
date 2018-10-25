"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Process = exports.AutomatonEnv = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.renderProcess = renderProcess;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _mobx = require("mobx");

var _QueryDeclaration = require("./QueryDeclaration");

var _QueryDeclaration2 = _interopRequireDefault(_QueryDeclaration);

var _FormConfigProvider = require("domainql-form/lib/FormConfigProvider");

var _FormConfigProvider2 = _interopRequireDefault(_FormConfigProvider);

var _InputSchema = require("domainql-form/lib/InputSchema");

var _InputSchema2 = _interopRequireDefault(_InputSchema);

var _auth = require("./auth");

var _auth2 = _interopRequireDefault(_auth);

var _configuration = require("./configuration");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NO_MATCH = {
    processName: null,
    moduleName: null,
    isComposite: null
};

var MODULE_REGEX = /^\.\/(processes\/(.*?)\/(composites\/)?)?(.*?).js$/;

function matchPath(path) {
    var m = MODULE_REGEX.exec(path);
    if (!m) {
        return NO_MATCH;
    }

    return {
        processName: m[2],
        shortName: m[4],
        isComposite: !!m[3]
    };
}

var NOT_IMPLEMENTED = { "_": "NOT_IMPLEMENTED" };

var secret = Symbol("ProcessSecret");

var AutomatonEnv = exports.AutomatonEnv = _react2.default.createContext({
    "_": "default context"
});

function inject(scope, injections) {
    //console.log("INJECTIONS", injections);

    var scopeKeys = (0, _mobx.keys)(scope);

    for (var i = 0; i < scopeKeys.length; i++) {
        var name = scopeKeys[i];

        var prop = (0, _mobx.get)(scope, name);
        if (prop instanceof _QueryDeclaration2.default) {
            var result = injections[prop.query];
            if (result === undefined) {
                throw new Error("Could not find query for prop '" + name + "'");
            }

            //console.log("set", name, "to", result);

            (0, _mobx.set)(scope, name, result);
        }
    }
}

function ProcessEntry(process) {
    this.process = process;
    this.initProcess = null;
    this.ScopeClass = null;
}

/**
 * Loads the process scope, initProcess and components from the given initial data and webpack require context
 *
 * @param initial   initial data
 * @param ctx       webpack require context
 * 
 * @return {{process: *, initProcess: *, ScopeClass: *}}    infrastructural process objects
 */
function loadProcesses(initial, ctx) {
    var keys = ctx.keys();

    var processes = {};

    for (var i = 0; i < keys.length; i++) {
        var moduleName = keys[i];

        var _matchPath = matchPath(keys[i]),
            processName = _matchPath.processName,
            shortName = _matchPath.shortName,
            isComposite = _matchPath.isComposite;

        if (!processName) {
            continue;
        }

        console.log("loadProcesses", { moduleName: moduleName, processName: processName, shortName: shortName, isComposite: isComposite });

        if (!shortName) {
            throw new Error("Module name '" + keys[i] + "' does not match " + MODULE_REGEX);
        }

        //console.log("-- Process", m[1]);

        var entry = processes[processName];
        if (!entry) {
            entry = new ProcessEntry(new Process(processName));
            processes[processName] = entry;
        }

        var module = ctx(moduleName);
        if (isComposite) {
            //console.log("process", process);
            entry.process[secret].components[shortName] = module.default;
        } else {
            var ScopeClass = module.default,
                initProcess = module.initProcess;


            if (!initProcess) {
                throw new Error("No initProcess defined in " + moduleName);
            }

            entry.ScopeClass = ScopeClass;
            entry.initProcess = initProcess;
        }
    }
    return processes;
}

function getLayout(process, currentState) {
    var layout = process.layout;


    if (layout) {
        if (currentState !== undefined && layout.prototype.isReactComponent) {
            var component = layout[currentState];
            if (component) {
                return component;
            }
        }
        return layout;
    }
    return (0, _configuration.configuration)().layout;
}

function setCurrentState(process, currentState) {
    // directly access secret process data
    var data = process[secret];

    if (!data.states[currentState]) {
        throw new Error("Could not find state '" + currentState + "' in Process '" + process.name + "'");
    }
    data.currentState = currentState;
}

function renderViewState(currentState, process) {
    // directly access secret process data
    var data = process[secret];

    setCurrentState(process, currentState);

    var ViewComponent = data.components[currentState];

    if (!ViewComponent) {
        throw new Error("No component '" + currentState + "' in process '" + process.name);
    }

    var inputSchema = new _InputSchema2.default(initialData.schema);

    var env = {
        process: process,
        contextPath: initialData.contextPath,
        state: currentState,
        scope: data.scope,
        applicationScope: NOT_IMPLEMENTED,
        userScope: NOT_IMPLEMENTED,
        auth: authentication,
        initialData: initialData
    };

    var Layout = getLayout(process, currentState);

    //console.log("LAYOUT", Layout);

    return _react2.default.createElement(
        AutomatonEnv.Provider,
        {
            value: env
        },
        _react2.default.createElement(
            _FormConfigProvider2.default,
            {
                schema: inputSchema
            },
            _react2.default.createElement(
                Layout,
                {
                    env: env
                },
                _react2.default.createElement(ViewComponent, {
                    env: env
                })
            )
        )
    );
}

var initialData = void 0,
    authentication = void 0;

function renderProcess(initial, ctx, Scopes) {
    initialData = initial;

    var processName = initial.processName;
    //console.log("RENDER", processName);

    var injections = initial.injections;


    authentication = new _auth2.default(initialData.authentication);

    var processes = loadProcesses(initial, ctx);

    console.log("PROCESSES", processes);

    var processEntry = processes[processName];

    if (!processEntry) {
        throw new Error("Could not find process '" + processName + "'");
    }

    console.log("PROCESS-ENTRY", processEntry);

    var process = processEntry.process,
        initProcess = processEntry.initProcess,
        ScopeClass = processEntry.ScopeClass;

    // directly access secret process data

    var data = process[secret];

    var scope = void 0;
    if (ScopeClass) {
        scope = new ScopeClass();
        inject(scope, injections);
    } else {
        scope = null;
    }

    var stateData = initProcess(process, scope);

    var currentState = stateData.startState;

    data.startState = currentState;
    data.states = stateData.states;
    data.scope = scope;
    data.initialized = true;

    initialData = initial;

    return renderViewState(currentState, process);
}

function ensureInitialized(process) {
    if (!process[secret].initialized) {
        throw new Error("Process not initialized");
    }
}

/**
 * Process facade exposing a limited set of getters and methods as process API
 */

var Process = exports.Process = function () {
    function Process(name, parent) {
        _classCallCheck(this, Process);

        this[secret] = {
            name: name,
            components: {},

            parent: parent,

            states: null,
            startState: null,

            currentState: null,
            currentObject: null,

            scope: null,

            layout: null,

            initialized: false
        };
    }

    _createClass(Process, [{
        key: "getComponent",
        value: function getComponent(name) {
            var component = this[secret].components[name];
            if (!component) {
                throw new Error("Could not find component '" + name + "'");
            }
            return component;
        }
    }, {
        key: "transition",
        value: function transition(name) {
            ensureInitialized(this);

            var data = this[secret];

            var array = data.states[data.currentState];

            var transition = void 0;

            for (var i = 0; i < array.length; i++) {
                var current = array[i];

                if (current.name === name) {
                    transition = current;
                    break;
                }
            }

            if (!transition) {
                throw new Error("Could not find transition '" + name + "' in Process '" + this.name + "'");
            }

            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            return Promise.resolve(transition.action(args));
        }
    }, {
        key: "back",
        value: function back() {
            // TODO: implement
        }
    }, {
        key: "name",
        get: function get() {
            return this[secret].name;
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
    }, {
        key: "layout",
        get: function get() {
            return this[secret].layout;
        },
        set: function set(layout) {
            if (layout.prototype.isReactComponent || layout && (typeof layout === "undefined" ? "undefined" : _typeof(layout)) === "object") {
                this[secret].layout = layout;
            } else {
                throw new TypeError("Invalid layout: " + layout);
            }
        }
    }]);

    return Process;
}();
//# sourceMappingURL=Process.js.map
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Process = exports.ProcessDefinition = exports.navigationHistory = exports.AutomatonEnv = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.loadProcessDefinitions = loadProcessDefinitions;
exports.fetchProcessInjections = fetchProcessInjections;
exports.onHistoryAction = onHistoryAction;
exports.renderProcess = renderProcess;
exports.renderSubProcess = renderSubProcess;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _mobxUtils = require("mobx-utils");

var _render = require("./render");

var _render2 = _interopRequireDefault(_render);

var _mobx = require("mobx");

var _QueryDeclaration = require("./QueryDeclaration");

var _QueryDeclaration2 = _interopRequireDefault(_QueryDeclaration);

var _FormConfigProvider = require("domainql-form/lib/FormConfigProvider");

var _FormConfigProvider2 = _interopRequireDefault(_FormConfigProvider);

var _config = require("./config");

var _config2 = _interopRequireDefault(_config);

var _Transition = require("./Transition");

var _Transition2 = _interopRequireDefault(_Transition);

var _uri = require("./uri");

var _uri2 = _interopRequireDefault(_uri);

var _i18n = require("./i18n");

var _i18n2 = _interopRequireDefault(_i18n);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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

var secret = Symbol("ProcessSecret");

var AutomatonEnv = exports.AutomatonEnv = _react2.default.createContext({
    "_": "default context"
});

var currentProcess = null;
var unlistenHistory = null;
var processes = [];

var navigationHistory = exports.navigationHistory = [];

function ProcessEntry(definition) {
    this.definition = definition;
    this.initProcess = null;
    this.ScopeClass = null;
}

var processDefinitions = {};

/**
 * Loads the process scope, initProcess and components from the given initial data and webpack require context
 *
 * @param ctx       webpack require context
 *
 * @return {{process: *, initProcess: *, ScopeClass: *}}    infrastructural process objects
 */
function loadProcessDefinitions(ctx) {
    var keys = ctx.keys();

    //console.log("Modules: ", keys);

    for (var i = 0; i < keys.length; i++) {
        var moduleName = keys[i];

        var _matchPath = matchPath(keys[i]),
            processName = _matchPath.processName,
            shortName = _matchPath.shortName,
            isComposite = _matchPath.isComposite;

        if (!processName) {
            continue;
        }

        //console.log("loadProcessDefinitions", { moduleName, processName, shortName, isComposite });

        if (!shortName) {
            throw new Error("Module name '" + keys[i] + "' does not match " + MODULE_REGEX);
        }

        //console.log("-- Process", m[1]);

        var entry = processDefinitions[processName];
        if (!entry) {
            entry = new ProcessEntry(new ProcessDefinition(processName));
            processDefinitions[processName] = entry;
        }

        var module = ctx(moduleName);
        if (isComposite) {
            //console.log("process", process);
            entry.definition.components[shortName] = module.default;
        }
    }

    for (var processName in processDefinitions) {
        if (processDefinitions.hasOwnProperty(processName)) {
            var _entry = processDefinitions[processName];

            var path = "./processes/" + processName + "/" + processName + ".js";
            var processModule = ctx(path);
            if (!processModule) {
                throw new Error("Could not find process exports module " + path);
            }

            var ScopeClass = processModule.default,
                initProcess = processModule.initProcess;


            if (!initProcess) {
                throw new Error("No initProcess defined in " + processName);
            }

            _entry.name = processName;
            _entry.ScopeClass = ScopeClass;
            _entry.initProcess = initProcess;
        }
    }

    return processDefinitions;
}

function getLayout(process, currentState) {
    var layout = process.layout;


    if (layout) {
        // if layout is not a react component
        if ((!layout.prototype || !layout.prototype.isReactComponent) && currentState) {
            // use it as lookup map
            var component = layout[currentState];
            if (component) {
                return component;
            }

            // we can't use the lookup map as react component, so we fall back to either
            // the "default" layout in the lookup or the global default
            return layout.default || _config2.default.layout;
        }
        return layout;
    }
    return _config2.default.layout;
}

function renderViewState() {
    // directly access secret process data
    var _currentProcess$secre = currentProcess[secret],
        definition = _currentProcess$secre.definition,
        currentState = _currentProcess$secre.currentState;

    //console.log({ definition, currentState });

    var ViewComponent = definition.components[currentState];
    if (!ViewComponent) {
        throw new Error("No component '" + currentState + "' in process '" + currentProcess.name);
    }

    //console.log({ ViewComponent });

    var env = {
        config: _config2.default,
        state: currentState,
        scope: currentProcess.scope
    };

    Object.defineProperty(env, "process", {
        get: function get() {
            return currentProcess;
        },
        configurable: false,
        enumerable: true
    });

    var Layout = getLayout(currentProcess, currentState);

    //console.log("LAYOUT", Layout);

    return _react2.default.createElement(
        AutomatonEnv.Provider,
        {
            value: env
        },
        _react2.default.createElement(
            _FormConfigProvider2.default,
            {
                schema: _config2.default.inputSchema
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

function ensureInitialized(process) {
    if (!process[secret].initialized) {
        throw new Error("Process not initialized");
    }
}

var ProcessDefinition = exports.ProcessDefinition = function ProcessDefinition(name) {
    _classCallCheck(this, ProcessDefinition);

    this.name = name;
    this.components = {};
};

/**
 * Access the resolve and reject functions stored for a sub-process or throws an error when the process is not a sub-process
 *
 * @param process
 */


function subProcessPromiseFns(process) {
    var subProcessPromise = process[secret].subProcessPromise;


    if (!subProcessPromise) {
        throw new Error(process[secret].name + " was not invoked as sub-process");
    }
    return subProcessPromise;
}

/**
 * Process facade exposing a limited set of getters and methods as process API
 */

var Process = exports.Process = function () {
    function Process(id, definition, scope, input, parent) {
        _classCallCheck(this, Process);

        var name = definition.name;


        this[secret] = {
            id: id,
            name: name,
            definition: definition,
            input: input,
            parent: parent,
            scope: scope,

            states: null,
            currentState: null,
            layout: null,

            subProcessPromise: null,

            initialized: false
        };
    }

    /**
     * Current process object
     * @type {*}
     */


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
        value: function transition(name, context) {
            //console.log("process.transition" , name, context);

            ensureInitialized(this);

            var access = this[secret];

            var transition = access.states[access.currentState][name];
            if (!transition) {
                throw new Error("Could not find transition '" + name + "' in Process '" + this.name + "'");
            }

            console.log("TRANSITION", transition);

            return Promise.resolve(transition.action ? executeTransition(name, transition.action, transition.to, context) : transition.to).then(function (currentState) {

                if (currentState) {
                    access.currentState = currentState;
                    pushProcessState();
                }

                return (0, _render2.default)(renderViewState(currentState));
            });
        }
    }, {
        key: "back",
        value: function back() {}
        // TODO: implement


        /**
         * Runs the process with the given name as sub-process.
         *
         * @param processName   process name
         * @param input         input object for the sub-process
         *
         * @return {Promise<any>} resolves to the sub-process result or is rejected when the sub-process is aborted.
         */

    }, {
        key: "runSubProcess",
        value: function runSubProcess(processName, input) {
            return new Promise(function (resolve, reject) {

                return fetchProcessInjections(_config2.default.appName, processName, input).then(function (injections) {

                    //console.log("INJECTIONS", injections);

                    return renderSubProcess(processName, input, injections.injections).then(function (elem) {

                        //console.log("RENDER SUB-PROCESS VIEW", elem);

                        // store for subProcessPromiseFns
                        currentProcess[secret].subProcessPromise = {
                            resolve: resolve,
                            reject: reject
                        };

                        (0, _render2.default)(elem);
                    });
                });
            }).then(function (result) {

                pushProcessState();

                (0, _render2.default)(renderViewState());

                return result;
            }).catch(function (err) {
                return console.error("ERROR IN SUB-PROCESS", err);
            });
        }

        /**
         * Ends the sub-process successfully and returns the given output object
         * @param {*} [output]      sub-process output object
         */

    }, {
        key: "endSubProcess",
        value: function endSubProcess(output) {
            var fns = subProcessPromiseFns(this);

            currentProcess = this[secret].parent;

            fns.resolve(output);
        }

        /**
         * Aborts the sub-process with an error object
         *
         * @param {*} [err]     error object
         */

    }, {
        key: "abortSubProcess",
        value: function abortSubProcess(err) {
            subProcessPromiseFns(this).reject(err);
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
        key: "scope",
        get: function get() {
            return this[secret].scope;
        }
    }, {
        key: "layout",
        get: function get() {
            return this[secret].layout;
        },
        set: function set(layout) {
            if (layout.prototype && layout.prototype.isReactComponent || layout && (typeof layout === "undefined" ? "undefined" : _typeof(layout)) === "object") {
                this[secret].layout = layout;
            } else {
                throw new TypeError("Invalid layout: " + layout);
            }
        }
    }, {
        key: "input",
        get: function get() {
            return this[secret].input;
        }
    }]);

    return Process;
}();

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

            //console.log("inject", name, "with", result);

            (0, _mobx.set)(scope, name, result);
        }
    }
}

function fetchProcessInjections(appName, processName, input) {
    //console.log("fetchProcessInjections", { appName, processName, input });

    var csrfToken = _config2.default.csrfToken;


    return fetch(window.location.origin + (0, _uri2.default)("/_auto/process/{appName}/{processName}", {
        appName: appName,
        processName: processName
    }), {
        method: "POST",
        credentials: "same-origin",
        headers: _defineProperty({
            "Content-Type": "text/plain"

        }, csrfToken.header, csrfToken.value),
        body: JSON.stringify(input || {})
    }).then(function (response) {
        return response.json();
    }).then(function (data) {
        if (data.error) {
            return Promise.reject(data.error);
        }

        return data;
    }).catch(function (err) {
        return console.error("ERROR FETCHING PROCESS INJECTIONS", err);
    });
}

/**
 * Executes the given transition action function
 *
 * @param {String} name                     Transition name
 * @param {Function<Transition>} actionFn   Transition action function
 * @param {String} [target]                 transition target
 * @param {object} [context]                domain object context
 * @return {Promise<any | never>}
 */
function executeTransition(name, actionFn, target, context) {
    var viewModel = void 0;
    var transition = new _Transition2.default(currentProcess, currentProcess[secret].currentState, target, context);

    var access = currentProcess[secret];
    var origScope = access.scope;
    if (origScope) {
        viewModel = (0, _mobxUtils.createViewModel)(origScope);
        access.scope = viewModel;
    }

    var mobXActionKey = "mobxAction-" + name;

    var mobxAction = currentProcess[secret][mobXActionKey];
    if (!mobxAction) {
        mobxAction = (0, _mobx.action)(currentProcess.name + "." + name, actionFn);
        currentProcess[secret][mobXActionKey] = mobxAction;
    }

    return new Promise(function (resolve, reject) {
        try {
            resolve(mobxAction(transition));
        } catch (e) {
            reject(e);
        }
    }).then(function () {

        if (!transition.isCanceled) {
            if (origScope) {
                if (viewModel.isDirty) {
                    viewModel.submit();
                }
                access.scope = origScope;
            }

            var _context = transition.context;

            if (_context) {
                currentProcess.currentObject = _context;
            }

            return transition.target;
        }
    }).catch(function (err) {
        if (origScope) {
            access.scope = origScope;
        }
        console.error("ERROR IN TRANSITION", err);
    });
}

function noViewState() {
    return _react2.default.createElement(
        "div",
        { className: "container" },
        _react2.default.createElement(
            "div",
            { className: "row" },
            _react2.default.createElement(
                "div",
                { className: "col" },
                _react2.default.createElement(
                    "div",
                    { className: "alert alert-secondary" },
                    _react2.default.createElement(
                        "h3",
                        null,
                        (0, _i18n2.default)("View State Gone")
                    ),
                    _react2.default.createElement("hr", null),
                    _react2.default.createElement(
                        "p",
                        { className: "text-muted" },
                        (0, _i18n2.default)("View State Gone Desc")
                    )
                )
            )
        )
    );
}

function onHistoryAction(location, action) {
    var state = location.state;

    if (action === "POP") {
        if (state) {
            //console.log("POP", state);

            var navigationId = state.navigationId;

            var entry = navigationHistory[navigationId];

            if (!entry) {
                (0, _render2.default)(noViewState());
            }

            var processId = entry.processId,
                currentState = entry.currentState,
                currentObject = entry.currentObject;


            currentProcess = processes[processId];
            currentProcess.currentObject = currentObject;

            currentProcess[secret].currentState = currentState;

            (0, _render2.default)(renderViewState());
        }
        // else
        // {
        //     console.log("POP no state");
        // }
    }
}

function getObjectInfo(obj) {
    if (!obj) {
        return "";
    }

    return encodeURIComponent(obj.number || obj.name || obj.id);
}

function pushProcessState() {
    var replace = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    var _currentProcess$secre2 = currentProcess[secret],
        id = _currentProcess$secre2.id,
        currentState = _currentProcess$secre2.currentState;
    var _currentProcess = currentProcess,
        currentObject = _currentProcess.currentObject;


    var navigationId = navigationHistory.length;

    navigationHistory.push({
        processId: id,
        currentState: (0, _mobx.toJS)(currentState),
        currentObject: (0, _mobx.toJS)(currentObject)
    });

    var op = replace ? "replace" : "push";

    //console.log("pushProcessState", op);

    _config2.default.history[op]((0, _uri2.default)("/{appName}/{processName}/{stateName}/{info}", {
        appName: _config2.default.appName,
        processName: currentProcess.name,
        stateName: currentState,
        info: getObjectInfo(currentObject)
    }, true), {
        navigationId: navigationId
    });
}

/**
 * Internal process render start function
 *
 * @param {String} processName      process name
 * @param {object} input            input map
 * @param {object} injections       injections maps
 * @param {boolean} asSubProcess    launch process as sub-process
 * @return {{Promise<ReactElement>}}
 */
function renderProcessInternal(processName, input, injections, asSubProcess) {
    var process = void 0;
    var access = void 0;

    var entry = processDefinitions[processName];
    if (!entry) {
        throw new Error("Could not find process '" + processName + "'");
    }
    //console.log("PROCESS-ENTRY", entry);

    var initProcess = entry.initProcess,
        ScopeClass = entry.ScopeClass;


    var scope = void 0;
    if (ScopeClass) {
        scope = new ScopeClass();
        inject(scope, injections);
    } else {
        scope = null;
    }

    var noPriorProcess = !currentProcess;
    if (noPriorProcess) {
        if (asSubProcess) {
            throw new Error("Cannot launch sub-process without root process");
        }
        _config2.default.rootProcess = processName;
    }

    var processesLen = processes.length;
    var newProcessId = 0;
    if (!noPriorProcess) {
        newProcessId = currentProcess[secret].id + 1;
        if (newProcessId < processesLen) {
            // if we are inserting below the maximum available
            processes = processes.slice(0, newProcessId);
        }
    }

    process = new Process(newProcessId, entry.definition, scope, input, asSubProcess ? currentProcess : null);
    processes.push(process);

    access = process[secret];

    return Promise.resolve(initProcess(process, scope)).then(function (_ref) {
        var startState = _ref.startState,
            states = _ref.states;


        access.states = states;

        access.initialized = true;

        currentProcess = process;

        if (typeof startState === "function") {
            var startTransitionName = process.name + ".start";
            return executeTransition(startTransitionName, (0, _mobx.action)(startTransitionName, startState));
        } else {
            return String(startState);
        }
    }).then(function (currentState) {

        if (!currentState) {
            throw new Error("No initial state");
        }
        access.currentState = currentState;

        pushProcessState(noPriorProcess);

        return renderViewState();
    }).catch(function (err) {
        return console.error("ERROR IN START PROCESS", err);
    });
}

/**
 * Starts a new root process and renders the first React element tree.
 * The states of the old root process remain in-memory for the user to navigate back.
 *
 * @param {String} processName      process name
 * @param {object} input            input data
 * @param {object} injections       injections for the process
 *
 * @return {Promise<ReactElement>}   rendered elements of the first view.
 */
function renderProcess(processName, input, injections) {
    return renderProcessInternal(processName, input, injections, false);
}

/**
 * Starts the process with the given name as sub-process and renders the first React element tree.
 * Ending the subprocess will resume the parent process
 *
 * @param {String} processName      name of process to start as sub-process
 * @param {object} input            input data
 * @param {object} injections                injections for the sub-process
 *
 * @return {Promise<ReactElement>}   rendered elements of the first view.
 */
function renderSubProcess(processName, input, injections) {
    return renderProcessInternal(processName, input, injections, true);
}
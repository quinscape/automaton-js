"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.reinitializeSessionScope = reinitializeSessionScope;
exports.reinitializeLocalScope = reinitializeLocalScope;
exports.startup = startup;

var _Process = require("./Process");

var _config = require("./config");

var _config2 = _interopRequireDefault(_config);

var _auth = require("./auth");

var _auth2 = _interopRequireDefault(_auth);

var _InputSchema = require("domainql-form/lib/InputSchema");

var _InputSchema2 = _interopRequireDefault(_InputSchema);

var _mobx = require("mobx");

var _uri = require("./uri");

var _uri2 = _interopRequireDefault(_uri);

var _sync = require("./sync");

var _scopeNames = require("./scopeNames");

var _createBrowserHistory = require("history/createBrowserHistory");

var _createBrowserHistory2 = _interopRequireDefault(_createBrowserHistory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SCOPES_MODULE_NAME = "./scopes.js";

var unlistenHistory = void 0;

/**
 * Default automaton initialization procedure for automaton apps. This is what happens before the user-provided
 * config function in `app-startup.js` is called.
 *
 * @param ctx           webpack require context
 * @param initial       initial data
 * @return {Promise<any[] | never>}
 */
function defaultInit(ctx, initial) {
    var appName = initial.appName,
        locale = initial.locale,
        translations = initial.translations,
        contextPath = initial.contextPath,
        authentication = initial.authentication,
        csrfToken = initial.csrfToken,
        processName = initial.processName,
        schema = initial.schema,
        appScopeFromInitial = initial[_scopeNames.APP_SCOPE],
        userScopeFromInitial = initial[_scopeNames.USER_SCOPE];


    _config2.default.history = (0, _createBrowserHistory2.default)({
        basename: contextPath
    });

    _config2.default.contextPath = contextPath;
    _config2.default.translations = translations;

    _config2.default.auth = new _auth2.default(authentication);
    _config2.default.inputSchema = new _InputSchema2.default(schema);

    _config2.default.appName = appName;
    _config2.default.locale = locale;
    _config2.default.csrfToken = csrfToken;

    _config2.default.rootProcess = processName;

    var promises = [];

    // Initialize scopes if `./scopes.js` module is present
    var keys = ctx.keys();
    if (keys.indexOf(SCOPES_MODULE_NAME) >= 0) {
        var scopesModule = ctx(SCOPES_MODULE_NAME);

        var AppScope = scopesModule.AppScope,
            UserScope = scopesModule.UserScope,
            SessionScope = scopesModule.SessionScope,
            LocalScope = scopesModule.LocalScope;

        //console.log("SCOPES", {AppScope, UserScope, SessionScope, LocalScope});

        if (AppScope) {
            var appScope = new AppScope();
            (0, _sync.syncFrom)(_scopeNames.APP_SCOPE, appScope, appScopeFromInitial);
            _config2.default.appScope = appScope;
        }
        if (UserScope) {
            var userScope = new UserScope();
            (0, _sync.syncFrom)(_scopeNames.USER_SCOPE, userScope, userScopeFromInitial);
            _config2.default.userScope = userScope;
        }

        if (SessionScope) {
            var sessionScope = new SessionScope();
            _config2.default.sessionScope = sessionScope;
            if (!(0, _sync.syncFromStorage)(_scopeNames.SESSION_SCOPE, sessionScope, sessionStorage)) {
                promises.push(reinitializeSessionScope());
            }
        }

        if (LocalScope) {
            var localScope = new LocalScope();
            _config2.default.localScope = localScope;
            if (!(0, _sync.syncFromStorage)(_scopeNames.LOCAL_SCOPE, localScope, localStorage)) {
                promises.push(reinitializeLocalScope());
            }
        }
    }

    return Promise.all(promises);
}

function reinitializeSessionScope() {
    return Promise.resolve(typeof _config2.default[_scopeNames.SESSION_SCOPE].init === "function" && _config2.default[_scopeNames.SESSION_SCOPE].init());
}

function reinitializeLocalScope() {
    return Promise.resolve(typeof _config2.default[_scopeNames.LOCAL_SCOPE].init === "function" && _config2.default[_scopeNames.LOCAL_SCOPE].init());
}

/**
 * Returns an options object for autorun with the delay for the given scope and the name of the autorun-action reflecting
 * the name of the scope
 *
 * @param name      scope name
 * @return {{name: *, delay: *}}    options
 */
function getSyncOpts(name) {
    var configValue = _config2.default.scopeSyncTimeout;

    var delay = void 0;
    if (typeof configValue === "number") {
        delay = configValue;
    } else {
        delay = configValue && configValue[name] || _config.DEFAULT_OPTS.scopeSyncTimeout;
    }

    return {
        name: "sync-" + name,
        delay: delay
    };
}

function setupScopeSynchronization() {
    var appScope = _config2.default.appScope,
        userScope = _config2.default.userScope,
        sessionScope = _config2.default.sessionScope,
        localScope = _config2.default.localScope;


    if (appScope) {
        (0, _mobx.autorun)(function () {
            return (0, _sync.serverSync)(_scopeNames.APP_SCOPE, appScope, (0, _uri2.default)("/_auto/sync/app/{appName}", {
                appName: _config2.default.appName
            }));
        }, getSyncOpts(_scopeNames.APP_SCOPE));
    }

    var login = _config2.default.auth.login;
    if (userScope && login !== "anonymous") {
        (0, _mobx.autorun)(function () {
            return (0, _sync.serverSync)(_scopeNames.USER_SCOPE, userScope, (0, _uri2.default)("/_auto/sync/user/{login}", {
                login: login
            }));
        }, getSyncOpts(_scopeNames.USER_SCOPE));
    }

    if (sessionScope) {
        (0, _mobx.autorun)(function () {
            return (0, _sync.storageSync)(_scopeNames.SESSION_SCOPE, sessionScope, sessionStorage);
        }, getSyncOpts(_scopeNames.SESSION_SCOPE));
    }

    if (localScope) {
        (0, _mobx.autorun)(function () {
            return (0, _sync.storageSync)(_scopeNames.LOCAL_SCOPE, localScope, localStorage);
        }, getSyncOpts(_scopeNames.LOCAL_SCOPE));
    }
}

/**
 * Entry point to the automaton client-side process engine
 *
 * @param ctx                   require.context with all .js files
 * @param {Object}initial       initial data pushed from server
 * @param {Function} initFn     init callback
 *
 * @return {ReactElement} initial component output
 */
function startup(ctx, initial, initFn) {

    return (

        // AUTOMATON INIT PHASE
        defaultInit(ctx, initial).then(
        // call external init function from startup (might return Promise)
        function () {
            return initFn && initFn(_config2.default);
        }).then(function () {

            (0, _Process.loadProcessDefinitions)(ctx);

            // AUTOMATON RUNTIME PHASE
            setupScopeSynchronization();

            unlistenHistory = _config2.default.history.listen(_Process.onHistoryAction);

            return (0, _Process.renderProcess)(_config2.default.rootProcess, initial.input, initial.injections);
        }).catch(function (err) {
            return console.error("STARTUP ERROR", err);
        })
    );
}
//# sourceMappingURL=core.js.map
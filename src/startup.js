import { loadProcessDefinitions, onHistoryAction, renderProcess } from "./Process"
import config, { DEFAULT_OPTS } from "./config"
import Authentication from "./auth"
import InputSchema from "domainql-form/lib/InputSchema"
import { autorun } from "mobx"
import uri from "./uri"
import { serverSync, storageSync, syncFrom, syncFromStorage } from "./sync"

import { APP_SCOPE, LOCAL_SCOPE, SESSION_SCOPE, USER_SCOPE } from "./scopeNames"

import createHistory from "history/createBrowserHistory"
import { loadDomainDefinitions } from "./domain";

const SCOPES_MODULE_NAME = "./scopes.js";

let unlistenHistory;


/**
 * Default automaton initialization procedure for automaton apps. This is what happens before the user-provided
 * config function in `app-startup.js` is called.
 *
 * @param ctx           webpack require context
 * @param initial       initial data
 * @return {Promise<any[] | never>}
 */
function defaultInit(ctx, initial)
{
    const {
        appName,
        locale,
        translations,
        contextPath,
        authentication,
        csrfToken,
        processName,
        schema,
        [APP_SCOPE]: appScopeFromInitial,
        [USER_SCOPE]: userScopeFromInitial
    } = initial;

    config.history = createHistory({
        basename: contextPath
    });

    config.contextPath = contextPath;
    config.translations = translations;

    config.auth = new Authentication(authentication);
    config.inputSchema = new InputSchema(schema);

    config.appName = appName;
    config.locale = locale;
    config.csrfToken = csrfToken;

    config.rootProcess = processName;

    let promises = [];

    // Initialize scopes if `./scopes.js` module is present
    const keys = ctx.keys();
    if (keys.indexOf(SCOPES_MODULE_NAME) >= 0)
    {
        const scopesModule = ctx(SCOPES_MODULE_NAME);

        const {AppScope, UserScope, SessionScope, LocalScope} = scopesModule;

        //console.log("SCOPES", {AppScope, UserScope, SessionScope, LocalScope});

        if (AppScope)
        {
            const appScope = new AppScope();
            syncFrom(APP_SCOPE, appScope, appScopeFromInitial);
            config.appScope = appScope;

        }
        if (UserScope)
        {
            const userScope = new UserScope();
            syncFrom(USER_SCOPE, userScope, userScopeFromInitial);
            config.userScope = userScope;
        }

        if (SessionScope)
        {
            const sessionScope = new SessionScope();
            config.sessionScope = sessionScope;
            if (!syncFromStorage(SESSION_SCOPE, sessionScope, sessionStorage))
            {
                promises.push(
                    reinitializeSessionScope()
                )
            }

        }

        if (LocalScope)
        {
            const localScope = new LocalScope();
            config.localScope = localScope;
            if (!syncFromStorage(LOCAL_SCOPE, localScope, localStorage))
            {
                promises.push(
                    reinitializeLocalScope()
                )
            }
        }
    }

    return Promise.all(promises);
}

export function reinitializeSessionScope()
{
    return Promise.resolve(
        typeof config[SESSION_SCOPE].init === "function" && config[SESSION_SCOPE].init()
    )
}


export function reinitializeLocalScope()
{
    return Promise.resolve(
        typeof config[LOCAL_SCOPE].init === "function" && config[LOCAL_SCOPE].init()
    )
}

/**
 * Returns an options object for autorun with the delay for the given scope and the name of the autorun-action reflecting
 * the name of the scope
 *
 * @param name      scope name
 * @return {{name: *, delay: *}}    options
 */
function getSyncOpts(name)
{
    const configValue = config.scopeSyncTimeout;

    let delay;
    if (typeof configValue === "number")
    {
        delay = configValue;
    }
    else
    {
        delay = (configValue && configValue[name]) || DEFAULT_OPTS.scopeSyncTimeout;
    }

    return {
        name: "sync-" + name,
        delay
    }
}


function setupScopeSynchronization()
{
    const {appScope, userScope, sessionScope, localScope} = config;

    if (appScope)
    {
        autorun(() => serverSync(
            APP_SCOPE,
            appScope,
            uri(
                "/_auto/sync/app/{appName}",
                {
                    appName: config.appName
                }
            )
            ),
            getSyncOpts(APP_SCOPE)
        );
    }

    const login = config.auth.login;
    if (userScope && login !== "anonymous")
    {
        autorun(() => serverSync(
            USER_SCOPE,
            userScope,
            uri(
                "/_auto/sync/user/{login}",
                {
                    login: login
                }
            )
            ),
            getSyncOpts(USER_SCOPE)
        );
    }

    if (sessionScope)
    {
        autorun(() => storageSync(
            SESSION_SCOPE,
            sessionScope,
            sessionStorage
            ),
            getSyncOpts(SESSION_SCOPE)
        );
    }

    if (localScope)
    {
        autorun(() => storageSync(
            LOCAL_SCOPE,
            localScope,
            localStorage
            ),
            getSyncOpts(LOCAL_SCOPE)
        );
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
export function startup(ctx, initial, initFn)
{

    return (

        // AUTOMATON INIT PHASE
        defaultInit(
            ctx,
            initial
        ).then(
            // call external init function from startup (might return Promise)
            () => initFn && initFn(config)

        ).then(
            () => {

                // config now ready
                
                loadDomainDefinitions(ctx);
                loadProcessDefinitions(ctx);

                // AUTOMATON RUNTIME PHASE
                setupScopeSynchronization();

                unlistenHistory = config.history.listen(onHistoryAction);

                return renderProcess(
                    config.rootProcess,
                    initial.input,
                    initial.injections
                )
            }
        )
        .catch(err => console.error("STARTUP ERROR", err))
    );
}

import React from "react"
import ReactDOM from "react-dom"
import { registerProcessImporter, onHistoryAction, renderProcess, getCurrentProcess } from "./process/Process"
import config, { addConfig, DEFAULT_OPTS } from "./config"
import Authentication from "./auth"
import { FormContext, InputSchema, registerDomainObjectFactory } from "domainql-form"
import { autorun } from "mobx"
import uri from "./uri"
import { serverSync, storageSync, syncFrom, syncFromStorage } from "./sync"

import { APP_SCOPE, LOCAL_SCOPE, SESSION_SCOPE, USER_SCOPE } from "./scopeNames"

import {
    getWireFormat,
    INTERACTIVE_QUERY,
    INTERACTIVE_QUERY_DEFINITION,
    loadDomainDefinitions, registerAutomatonConverters,
    registerGenericType, registerType
} from "./domain";
import InteractiveQuery from "./model/InteractiveQuery";

import { createBrowserHistory } from "history"
import createDomainObject from "./createDomainObject";
import { registerGenericGraphQLPostProcessor, registerGraphQLPostProcessor } from "./graphql";
import i18n from "./i18n";
import InteractiveQueryDefinition from "./model/InteractiveQueryDefinition";
import { registerScalarEquals } from "./util/equalsScalar";
import { registerEntityRenderer } from "./util/renderEntity";
import registerBigDecimalConverter from "./registerBigDecimalConverter";
import WorkingSet from "./WorkingSet";
import {registerDateRangeFilter} from "./util/filter/registerDateRangeFilter";
import {registerNumberFilter} from "./util/filter/registerNumberFilter";
import registerStringSetConverter from "./util/converter/registerStringSetConverter";


const SCOPES_MODULE_NAME = "./scopes.js";

const pkgJSON = require("../package.json");

const DO_NOT_NULL_FIELDS = {
    nullFields: false
}

let disposers = [];
/**
 * Deregisters the necessary handlers and shuts down the running automaton app.
 */
export function shutdown()
{
    disposers.forEach( disposer => disposer());
    disposers = [];
    const description = i18n("Application Shutdown Desc");
    ReactDOM.render(
        <div>
            <h1>
                { i18n("Application Shutdown") }
                <br/>
                {
                    description && (
                        <span className="muted">
                            {
                                description
                            }
                        </span>
                    )
                }
            </h1>
        </div>,
        document.getElementById("root")
    );
}

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
        domainQL : rawSchema,
        alternateStyles,
        mergeOptions,
        [APP_SCOPE]: appScopeFromInitial,
        [USER_SCOPE]: userScopeFromInitial
    } = initial;

    config.history = createBrowserHistory({
        basename: contextPath
    });

    config.contextPath = contextPath;
    config.translations = translations;

    config.auth = new Authentication(authentication);

    config.inputSchema = new InputSchema(rawSchema);

    new FormContext(config.inputSchema)
        .useAsDefault()

    config.appName = appName;
    config.locale = locale;
    config.csrfToken = csrfToken;

    config.alternateStyles = alternateStyles;

    config.rootProcess = processName;

    config.mergeOptions = mergeOptions;


    let promises = [];

    // Initialize scopes if `./scopes.js` module is present
    const keys = ctx.keys();
    if (keys.indexOf(SCOPES_MODULE_NAME) >= 0)
    {
        const scopesModule = ctx(SCOPES_MODULE_NAME);

        const { AppScope, UserScope, SessionScope, LocalScope, CommonScope } = scopesModule;

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

        if (CommonScope)
        {
            const commonScope = new CommonScope()
            if (typeof commonScope.init === "function")
            {
                promises.push(
                    commonScope.init()
                )
            }
            config.commonScope = commonScope
        }
    }

    registerDateRangeFilter();
    registerNumberFilter();

    registerStringSetConverter();

    return Promise.all(promises);
}

/**
 * Performs a reinitialization to defaults for the sessionScope / sessionStorage.
 *
 * @category process
 *
 * @return {Promise<boolean>} resolves when done
 */
export function reinitializeSessionScope()
{
    return Promise.resolve(
        typeof config[SESSION_SCOPE].init === "function" && config[SESSION_SCOPE].init()
    )
}


/**
 * Performs a reinitialization to defaults for the localScope / localStorage.
 *
 * @category process
 *
 * @return {Promise<boolean>} resolves when done
 */
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
        disposers.push(
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
            )
        );
    }

    const login = config.auth.login;
    if (userScope && login !== "anonymous")
    {
        disposers.push(
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
            )
        );
    }

    if (sessionScope)
    {
        disposers.push(
            autorun(() => storageSync(
                SESSION_SCOPE,
                sessionScope,
                sessionStorage
                ),
                getSyncOpts(SESSION_SCOPE)
            )
        );
    }

    if (localScope)
    {
        disposers.push(
            autorun(() => storageSync(
                LOCAL_SCOPE,
                localScope,
                localStorage
                ),
                getSyncOpts(LOCAL_SCOPE)
            )
        );
    }
}



function registerSystemTypes()
{
    registerGenericType(INTERACTIVE_QUERY, InteractiveQuery );

    registerGenericGraphQLPostProcessor(INTERACTIVE_QUERY, (iQuery, query, params) => {

        //console.log("REGISTER ", query, "on", iQuery);
        iQuery._query = query;
        return iQuery;
    })

    registerType(INTERACTIVE_QUERY_DEFINITION, InteractiveQueryDefinition);
}


/**
 * Execute late-phase initialization functionality that requires other infrastructure to be already initialized.
 *
 * @param initial   initial data-block
 */
function performFinalInitialization(initial)
{

    config.userInfo = initial.userInfo && getWireFormat().convert(
        {
            kind: "OBJECT",
            name: initial.userInfo.type
        },
        initial.userInfo.info,
        {
            fromWire: true,
            withType: true,
            noWrapping: true
        }
    );

}


/**
 * Standard automaton domain object factory used for wire format conversion.
 *
 * @param type
 * @param id
 * @return {{_type: String, id: *} & IObservableObject}
 */
export function automatonDomainObjectFactory(type, id) {

    // we need to convert without nulling fields
    return createDomainObject(type, id, DO_NOT_NULL_FIELDS)
}


/**
 * Entry point to the automaton client-side process engine
 *
 * @param ctx                           require.context with all domain .js files
 * @param {function} processImporter    dynamic import process loader (name => module )
 * @param {Object} initial              initial data pushed from server
 * @param {Function} initFn             init callback
 *
 * @return {ReactElement} initial component output
 */
export function startup(ctx, processImporter, initial, initFn)
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
                registerSystemTypes();

                registerDomainObjectFactory( automatonDomainObjectFactory );

                loadDomainDefinitions(ctx);

                //loadProcessDefinitions(ctx);
                registerProcessImporter(processImporter)

                performFinalInitialization(initial);

                // AUTOMATON RUNTIME PHASE
                setupScopeSynchronization();

                disposers.push(
                    config.history.listen(onHistoryAction)
                );

                if (__DEV)
                {
                    console.group("Automaton v" + pkgJSON.version + " Startup");

                    console.info("INITIAL", {
                        ... initial,
                        injections: {
                            "...": initial.injections
                        }
                    } );
                    console.info("INJECTED VALUES", Object.values(initial.injections));

                    console.info("JavaScript Domain Implementations: ", getWireFormat().classes);
                    console.groupEnd();

                }

                window.addEventListener("beforeunload", function (e) {

                    const process = getCurrentProcess();

                    if (process.isDirty)
                    {
                        // Cancel the event
                        e.preventDefault(); // If you prevent default behavior in Mozilla Firefox prompt will always be shown
                        // Chrome requires returnValue to be set
                        e.returnValue = '';
                    }
                });

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


/**
 * Contains a number of configuration methods that only makes sense to use once at startup, in the init callback of your
 * startup call.
 *
 * @category config
 *
 */
export const StartupRegistry = {
    /**
     * Adds a new config name and value to the global config object and also adds that name to the list of valid option
     * names.
     *
     * @param name      name of the new config property
     * @param value     value of the new config property
     */
    addConfig: addConfig,

    /**
     * Registers a domain observable implementation for all domain types that where generated for the given generic type.
     *
     * @param {String} genericType      fully qualified java class name of a generic type
     * @param {function} DomainClass    class definition with observables
     */
    registerGenericType,

    /**
     * Registers a domain class implementation containing observables for a given domain type name
     *
     * @param {String} name             GraphQL type name
     * @param {function} DomainClass    domain class containing observables
     */
    registerType,

    /**
     * Registers a new equality function for the given scalar type.
     *
     * @param {String} scalarType   scalar type
     * @param {Function} fn         equality functions
     */
    registerScalarEquals,

    /**
     * Registers a GraphQL post processor for the given type
     *
     * @param {String} type     GraphQL type name
     * @param {Function} fn     post processor 
     */
    registerGraphQLPostProcessor,

    /**
     * Registers a GraphQL post processor for all types degenerified from the given Java type.
     *
     * @param {String} type     Full Java class of the original generic type
     * @param {Function} fn     post processor
     */
    registerGenericGraphQLPostProcessor,


    /**
     * Registers an alterate renderer for the domain entity rendering system. The default is to
     * render an entity according to the name field(s) registered.
     *
     * @param {String} type     GraphQL type name
     * @param {Function<Observable,boolean>} fn     entity renderer receiving the observable object and a `textOnly` flag
     */
    registerEntityRenderer,


    /**
     * Registers a custom converter for the "BigDecimal" type based on the given BigNumber construBigNumber. By default the
     * standard BigNumber constructor is used, so you can either reconfigure the standard constructor or create a
     * newly configured clone
     *
     * @param {Object} [opts]                     options
     * @param {boolean} opts.defaultPrecision   Default numerical precision
     * @param {boolean} opts.defaultScale       Default numerical scale
     */
    registerBigDecimalConverter,

    /**
     * Registers the standard automaton converters
     */
    registerAutomatonConverters,
};

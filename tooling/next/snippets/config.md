# Automaton Config

The `config` object can be imported from @quinscape/automaton-js and encapsulates the static / global context within an 
automaton app.

```js 
import { config } from "@quinscape/automaton-js";
```

It supports a limited set of configuration properties which can be extended by the user for app-specific static / global 
configuration.

## Config properties

### config.alternateStyles

If the application uses alternate styles provided by the de.quinscape.automaton.runtime.provider.AlternateStyleProvider,
the information about these styles will be in `config.alternateStyles`

This is mostly useful to write your own style-switcher as alternative to automaton's &lt;StyleSwitcher/&gt; component

Example:

```json 
{
  "styleSheets": [
    {
      "name": "QS",
      "uri": "/css/bootstrap-automaton.min.css"
    },
    {
      "name": "QS condensed",
      "uri": "/css/bootstrap-automaton-condensed.min.css"
    }
  ],
  "currentStyleSheet": "QS condensed"
}
```  


### config.appName

The name of the app

### config.appScope

The appScope of the current app if the app has an app scope.

### config.auth

The auth object representing the current user.

  * auth.login - current login name
  * auth.id - UUID of the corresponding user row in app_user
  * auth.roles - Array containing the roles of the user
  
  You can use `auth.hasRole("A", "B")` has convenience method to check whether the current user has one of the given roles.
  
### config.contextPath

The current servlet context path under which the application is deployed. Needed to construct correct inner-application 
URIs (if you don't use automaton's uri() helper which handles that automatically)

### config.csrfToken

Information about the current CSRF token from Spring security. This token must be provided on all POST requests to prevent
user session hijacking.

### config.history

Contains the process history

### config.inputSchema

Contains the domainql-form input schema resulting from the app's GraphQL schema.

### config.layout

Contains the default layout component.

### config.locale

Contains the current locale

### config.localScope

The localScope of the current app if the app has a local scope.

### config.mergeOptions

Contains the system merge options.

### config.navigationHistoryLimit

Contains the number of process states that are kept within the process history. Default is 15.

### config.processDialog

Default configuration options for process dialogs. These options can be overriden by providing the third argument to
`process.runSubProcess(name, input, opts)`. 

```js 
    processDialog: {

        /**
         * Function to produce the dialog header title or a constant header title string. If the title is an empty string,
         * the header is not rendered.
         */
        title: name => i18n("Sub-Process {0}", name),

        /** props to apply to the <Modal/> component */
        props: {
            size: "lg",
            fade: false
        },
        /** Additional classes for the <ModalBody/> component */
        bodyClass: ""
    }
```
### config.rootProcess

Contains the current root Process.

### config.scopeSyncTimeout

Contains the scope synchronization timeout. This is the number of milliseconds without change until the scope is againn
synchronized to the server (only applicable to the server-scopes appScope and userScope). Default is 1500ms. 

### config.sessionScope

The sessionScope of the current app if the app has a session scope.

### config.subProcessAsDialog

If `true`, sub processes are launched within modal dialogs. If `false` the replace the previous process output in the 
browser window for the duration of the process. Default is `true`.

### config.translations

Contains the translation map. (Used by automaton's i18n() helper)

### config.userInfo

If the app defines a de.quinscape.automaton.runtime.userinfo.UserInfoService, the current extended user info block
is available as `config.userInfo`.

### config.userScope

The userScope of the current app if the app has a user scope.

## Extending config

To add more keys to your app config, you need to do two steps:

 1. Add a JSViewProvider in your WebApplicationConfiguration.java to add the data you want to have added under a key of 
 your choice
 2. Declare the additional config property in the app-startup.js entry point.
 

```js 
import "whatwg-fetch"
import bootstrap from "jsview-bootstrap"
import { configure, runInAction, toJS, observable } from "mobx"
import { config, getCurrentProcess, StartupRegistry, shutdown, startup, Hub } from "@quinscape/automaton-js"
import Layout from "../../components/Layout";

// noinspection ES6UnusedImports
import AUTOMATON_CSS from "./automatontemplate.css"

// set MobX configuration
configure({
    enforceActions: "observed"
});

bootstrap(
    initial => {
        return startup(
            require.context("./", true, /\.js$/),
            initial,
            config => {

                config.layout = Layout;
                StartupRegistry.addConfig("validationRules", initial.validationRules)

                return Hub.init(initial.connectionId)
            }
        );
    }
)
    .then(
        () => console.log("ready.")
    );

export default {
    config,
    currentProcess: getCurrentProcess,
    runInAction,
    toJS
};
```

Here we assume a "validationRules" object to be provided by a JsViewProvider and we declare that the config shall have 
another legal property "validationRules" with its content. 

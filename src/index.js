import useAutomatonEnv from "./useAutomatonEnv"
import { startup, reinitializeLocalScope, reinitializeSessionScope, shutdown } from "./startup";
import injection from "./injection";
import i18n from "./i18n";
import uri from "./uri";
import config, { addConfig } from "./config";
import render from "./render";
import { Process, getCurrentProcess } from "./Process";
import runProcess, { runProcessURI } from "./runProcess";

import DataGrid from "./ui/DataGrid"
import IQueryGrid from "./ui/IQueryGrid"
import Button from "./ui/Button"
import Icon from "./ui/Icon"
import Link from "./ui/Link"
import ScrollTracker from "./ui/ScrollTracker"
import graphql from "./graphql"
import AutomatonDevTools from "./AutomatonDevTools"
import GraphQLQuery from "./GraphQLQuery"
import { storeDomainObject, deleteDomainObject } from "./standard-queries"

import { backToParent } from "./back-functions"

// noinspection JSUnusedGlobalSymbols
export {
    config,
    render,
    startup,
    shutdown,
    injection,
    useAutomatonEnv,
    i18n,
    uri,
    graphql,

    runProcess,
    runProcessURI,

    Process,
    getCurrentProcess,
    // UI components
    DataGrid,
    IQueryGrid,
    Button,
    Link,
    Icon,
    ScrollTracker,

    GraphQLQuery,
    AutomatonDevTools,
    reinitializeLocalScope,
    reinitializeSessionScope,

    // Standard Queries/Mutations
    storeDomainObject,
    deleteDomainObject,

    backToParent,

    addConfig
}

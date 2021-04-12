import useAutomatonEnv from "./useAutomatonEnv"
import { startup, reinitializeLocalScope, reinitializeSessionScope, shutdown, StartupRegistry } from "./startup";
import injection from "./injection";
import i18n from "./i18n";
import uri from "./uri";
import config, { addConfig } from "./config";
import { Process, getCurrentProcess } from "./Process";
import runProcess, { runProcessURI } from "./runProcess";

import DataGrid from "./ui/DataGrid"
import IQueryGrid from "./ui/datagrid/IQueryGrid"
import Button from "./ui/Button"
import Link from "./ui/Link"
import CalendarField from "./ui/CalendarField"
import ScrollTracker from "./ui/ScrollTracker"
import graphql, { registerGraphQLPostProcessor, registerGenericGraphQLPostProcessor } from "./graphql"
//import AutomatonDevTools from "./AutomatonDevTools"
import GraphQLQuery from "./GraphQLQuery"
import { storeDomainObject, deleteDomainObject, storeDomainObjects, generateDomainObjectId, updateAssociations } from "./standard-queries"

import { backToParent } from "./back-functions"
import { registerGenericType, registerType, getGenericType, getWireFormat, registerAutomatonConverters } from "./domain"
import InteractiveQuery, { getFirstValue } from "./model/InteractiveQuery"
import createDomainObject from "./createDomainObject"
import LogoutForm from "./ui/LogoutForm"
import extractTypeData from "./extractTypeData"
import FKSelector from "./ui/FKSelector"
import Pagination from "./ui/Pagination"
import StyleSwitcher from "./ui/StyleSwitcher"
import query from "./query";
import pickSchemaTypes from "./util/pickSchemaTypes";
import Hub from "./message/Hub";
import AssociationSelector from "./ui/AssociationSelector";
import WorkingSet, { WorkingSetStatus } from "./WorkingSet";
import Tree from "./ui/tree/Tree";
import compareConditions from "./util/compareConditions";
import updateComponentCondition from "./util/updateComponentCondition";
import subscribeToTopic from "./message/subscribeToTopic";
import publish from "./message/publish";
import useDomainMonitor from "./message/monitor/useDomainMonitor";
import useEntity from "./message/monitor/useEntity";
import mapIterator from "./util/mapIterator";
import DomainActivityIndicator from "./ui/DomainActivityIndicator";
import equalsScalar, {registerScalarEquals} from "./util/equalsScalar";
import renderEntity, {registerEntityRenderer} from "./util/renderEntity";
import AttachmentField from "./ui/AttachmentField";
import AttachmentLink from "./ui/AttachmentLink";
import uploadAttachment from "./uploadAttachment";
import deleteAttachment from "./deleteAttachment";
import FieldMetaButton from "./ui/FieldMetaButton";
import registerBigDecimalConverter from "./registerBigDecimalConverter";
import DecimalField from "./ui/DecimalField";
import URLField from "./ui/URLField";
import filterTransformer, { FieldResolver } from "./util/filterTransformer";
import CollapsibleSidebar from "./ui/CollapsibleSidebar";

import  { createMockedQuery, createFilteredMockQuery} from "./util/createMockedQuery"

const AutomatonDevTools = "span";

import Attachments from "./Attachments"

import FilterDSL from "./FilterDSL"

import printSchema from "./util/printSchema"
import InteractiveQueryEditor from "./ui/iqed/InteractiveQueryEditor";
import InteractiveQueryDefinition from "./model/InteractiveQueryDefinition"
import { evaluateMemoryQuery } from "./util/evaluateMemoryQuery";
import { MergeOperation } from "./merge/MergeOperation";
import { openDialog } from "./util/openDialog";

// noinspection JSUnusedGlobalSymbols
export {
    config,
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
    Pagination,
    Button,
    Link,
    ScrollTracker,

    GraphQLQuery,
    AutomatonDevTools,
    reinitializeLocalScope,
    reinitializeSessionScope,

    // Standard Queries/Mutations
    createDomainObject,
    storeDomainObject,
    deleteDomainObject,
    storeDomainObjects,
    generateDomainObjectId,
    updateAssociations,

    backToParent,

    getGenericType,
    InteractiveQuery,
    getFirstValue,


    FilterDSL,
    CalendarField,
    LogoutForm,
    extractTypeData,
    FKSelector,
    query,
    pickSchemaTypes,
    getWireFormat,
    Hub,
    AssociationSelector,
    WorkingSet,
    WorkingSetStatus,
    StyleSwitcher,
    Tree,
    compareConditions,
    publish,
    subscribeToTopic,
    updateComponentCondition,

    useDomainMonitor,
    useEntity,
    mapIterator,
    DomainActivityIndicator,

    equalsScalar,

    openDialog,

    renderEntity,
    MergeOperation,

    AttachmentField,
    AttachmentLink,
    uploadAttachment,
    deleteAttachment,

    Attachments,

    FieldMetaButton,

    DecimalField,

    URLField,

    CollapsibleSidebar,

    printSchema,

    InteractiveQueryEditor,
    InteractiveQueryDefinition,

    filterTransformer,
    FieldResolver,

    createMockedQuery,
    createFilteredMockQuery,
    evaluateMemoryQuery,

    StartupRegistry
}




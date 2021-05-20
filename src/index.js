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
import DropdownMenu from "./ui/DropdownMenu"
const AutomatonDevTools = "span";

import Attachments from "./Attachments"

import {
    Type,
    not,
    or,
    and,
    condition,
    field,
    component,
    value,
    values,
    getConditionArgCount,
    isLogicalCondition,
    findComponentNode
} from "./FilterDSL"

import printSchema from "./util/printSchema"
import InteractiveQueryEditor from "./ui/iqed/InteractiveQueryEditor";
import InteractiveQueryDefinition from "./model/InteractiveQueryDefinition"
import { evaluateMemoryQuery } from "./util/evaluateMemoryQuery";
import { MergeOperation } from "./merge/MergeOperation";
import { openDialog } from "./util/openDialog";

// improves auto-completion for DSL members
const FilterDSL = {
    /**
     * Node type constants.
     *
     * @type {{OPERATION: string, FIELD: string, CONDITION: string, COMPONENT: string, VALUE: string}}
     */
    Type,
    /**
     * Logical not condition.
     *
     * @type {function(...[*]): Condition}
     */
    not,
    /**
     * Logical or condition.
     *
     * @type {function(...[*]): Condition}
     */
    or,
    /**
     * Logical and condition.
     *
     * @type {function(...[*]): Condition}
     */
    and,
    /**
     * General Condition node. Useful for programmatically instantiating conditions. Not needed for fluent style conditions.
     * (e.g. `field("name").containsIgnoreCase(value("abc"))` )
     *
     * @param {String} name     condition name
     * @return {Condition}
     */
    condition,
    /**
     * Field / column reference.
     *
     * @param {String} name     field name (e.g. "name", "owner.name")
     * @return {Field}
     */
    field,
    /**
     * Component condition node. These nodes are just marker for which part of the condition originated from which component
     * Logically they are evaluated as the condition they wrap.
     *
     * @param {String} id               component id
     * @param {Condition} condition     actual condition for component
     * @return {{condition: *, id: *, type: string}}
     */
    component,
    /**
     * Creates a new value node
     *
     * @param {String} type     scalar type name
     * @param {Object} value    scalar value of appropriate type
     * @param {String} [name]   Field name
     *
     * @return {Value} value node
     */
    value,
    /**
     * Creates a new values node that encapsulates a collection of scalar values (for e.g. the IN operator)
     *
     * @param {String} type     scalar type name
     * @param {Object} values   var args of scalar value of appropriate type
     *
     * @return {Values} values node
     */
    values,
    /**
     * Returns the number of expected arguments for the condition with the given name.
     *
     * @param {String} name     condition name
     *
     * @return {number} number of value arguments expected
     */
    getConditionArgCount,
    /**
     * Returns true if the given condition node is either a logical and or a logical or condition.
     *
     * @param {Object} node     node
     * @return {boolean}    true if the node is either an "and" or an "or"
     */
    isLogicalCondition,
    /**
     * Finds a component node with the given id.
     *
     * @param {Object} conditionNode    condition structure root
     * @param {String} id               component id
     *
     * @return {Object|null}    component node or `null`
     */
    findComponentNode
};




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

    addConfig,

    registerGenericType,
    registerType,
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
    registerScalarEquals,

    registerGraphQLPostProcessor,
    registerGenericGraphQLPostProcessor,

    openDialog,

    renderEntity,
    registerEntityRenderer,
    MergeOperation,

    AttachmentField,
    AttachmentLink,
    uploadAttachment,
    deleteAttachment,

    Attachments,

    FieldMetaButton,

    registerBigDecimalConverter,

    DecimalField,

    URLField,

    CollapsibleSidebar,

    registerAutomatonConverters,

    printSchema,

    InteractiveQueryEditor,
    InteractiveQueryDefinition,

    filterTransformer,
    FieldResolver,

    createMockedQuery,
    createFilteredMockQuery,
    evaluateMemoryQuery,

    DropdownMenu
}


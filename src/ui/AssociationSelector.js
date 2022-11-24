import React, { useMemo, useState } from "react"
import PropTypes from "prop-types"
import { ButtonToolbar, ListGroup, ListGroupItem } from "reactstrap"
import { FieldMode, FormGroup, useFormConfig, Icon } from "domainql-form"
import { action } from "mobx";
import { observer as fnObserver, useLocalObservable } from "mobx-react-lite";
import toPath from "lodash.topath"
import get from "lodash.get"
import set from "lodash.set"
import { v4 } from "uuid"

import config from "../config";
import i18n from "../i18n";
import GraphQLQuery from "../GraphQLQuery";
import { getFirstValue } from "../model/InteractiveQuery";
import { getGenericType, INTERACTIVE_QUERY } from "../domain";

import AssociationSelectorModal from "./AssociationSelectorModal";
import autoSubmitHack from "../util/autoSubmitHack";
import { and, Condition, field, value, values } from "../FilterDSL";
import { getGraphQLMethodType, lookupType, unwrapAll, unwrapNonNull } from "../util/type-utils";


function getQueryCondition(defaultQueryCondition, queryCondition) {
    if (defaultQueryCondition && queryCondition) {
        return and(defaultQueryCondition, queryCondition);
    }
    if (defaultQueryCondition) {
        return defaultQueryCondition;
    }
    if (queryCondition) {
        return queryCondition;
    }
    return null;
}

export const NO_SEARCH_FILTER = "NO_SEARCH_FILTER";
/**
 * Filter Mode: Do not offer a column filter by default.
 */
export const NO_FILTER = "NO_FILTER";
/**
 * Filter Mode: Offer a column filter even if a search filter is defined (with the searchFilter prop).
 */
export const COLUMN_FILTER = "COLUMN_FILTER";

/**
 * Creates a filter condition for the given type, searchFilter prop and search term
 *
 * @param {String} type                     GraphQL base type
 * @param {function|String}searchFilter    searchFilter prop
 * @param {String} searchTerm               current search value
 * @return {object} condition graph or null
 */
export function createSearchFilter(type, searchFilter, searchTerm)
{
    if (!searchFilter)
    {
        return null;
    }

    let condition;
    if (typeof searchFilter === "function")
    {
        condition = searchFilter(searchTerm)
    }
    else
    {
        const scalarType = unwrapNonNull(lookupType(type, "rows." + searchFilter)).name;

        if (scalarType === "String")
        {
            condition = field(searchFilter)
                .containsIgnoreCase(
                    value(
                        searchTerm,
                        scalarType
                    )
                );
        }
        else
        {
            condition = field(searchFilter)
                .toString()
                .containsIgnoreCase(
                    value(
                        searchTerm,
                        scalarType
                    )
                );

        }
    }

    return condition;
}


function toggleOpen(modalState)
{
    return {
        ... modalState,
        isOpen: !modalState.isOpen
    };
}

const removeLink = action(
    "Remove Link",
    (root, selected, link, name, value) => {

        const id = get(link,value);
        selected.delete(id);
        const links = get(root, name);
        const newLinks = links.filter(l => l !== link);
        set(root, name, newLinks);

        //console.log("AFTER: {}", toJS(root))
    }
);

const MODAL_STATE_CLOSED = {
    iQuery: null,
    columns: null,
    selectedBefore: null,
    valuePath: null,
    idPath: null,
    isOpen: false
};


let associationSelectorCount = 0;


const updateLinksAction = action("AssociationSelector.updateLinks", (root, name, newLinks) =>
{
    set(root, name, newLinks);
});


function createNewLink(generateId, valuePath, linkedObj, root, linkObjectsField, onNew)
{
    const type = root._type;
    const targetField = valuePath[0];

    const leftSideRelation = config.inputSchema.getRelations().find(r => r.rightSideObjectName === linkObjectsField && r.targetType === type);
    if (!leftSideRelation)
    {
        throw new Error("Could not find left side relation for type '" + type + "' and linked objects field '" + linkObjectsField  + "'");
    }

    const linkType = leftSideRelation.sourceType;

    const rightSideRelation = config.inputSchema.getRelations().find(r => r.sourceType === linkType && r.leftSideObjectName === targetField);
    if (!rightSideRelation)
    {
        throw new Error("Could not find right side relation with source type '" + linkType + "' and left side object field '" + targetField + "'");
    }

    const newLink = {
        _type: linkType,
        id: generateId(),
        [targetField]: linkedObj
    };

    if (leftSideRelation.sourceField === "OBJECT_AND_SCALAR" || leftSideRelation.sourceField === "SCALAR")
    {
        newLink[leftSideRelation.sourceFields[0]] = root.id;
    }
    
    if (rightSideRelation.sourceField === "OBJECT_AND_SCALAR")
    {
        newLink[rightSideRelation.sourceFields[0]] = linkedObj.id;
    }

    if (typeof onNew === "function")
    {
        onNew(newLink);
    }

    return newLink;
}


function updateLinks(root, name, modalState, selected, generateId, onNew)
{

    const { iQuery, valuePath } = modalState;
    const idPath = valuePath.slice(1);

    const newLinkIds = new Set(selected);
    const objectLookup = new Map();

    // remove all existing linked ids
    const links = get(root, name);
    for (let i = 0; i < links.length; i++)
    {
        const link = links[i];

        const obj = get(link, valuePath[0]);

        newLinkIds.delete(obj.id);
        objectLookup.set(obj.id, obj)
    }

    const linkIdsToFetch = new Set(newLinkIds);

    // remove all selected ids from the current page and add them to our object lookup
    for (let i = 0; i < iQuery.rows.length; i++)
    {
        const row = iQuery.rows[i];
        const id = get(row, idPath);
        if (selected.has(id))
        {
            linkIdsToFetch.delete(id);
            objectLookup.set(id, row)
        }
    }

    let promise;

    const idField = idPath.join(".");
    const type = lookupType(iQuery.type, idField);
    if (type.kind !== "SCALAR")
    {
        throw new Error("Id field is not a scalar: " + iQuery.type + "." + idField)
    }

    // if there's still ids to fetch
    if (linkIdsToFetch.size > 0)
    {

        // we query the rest
        promise = iQuery._query.execute({
            config: {
                condition: field(idField)
                    .in(
                        values(type.name, ... linkIdsToFetch)
                    ),
                pageSize: 0
            }
        })
    }
    else
    {
        promise = Promise.resolve(false);
    }

    return promise.then(
        result => {
            if (result !== false)
            {
                const {rows} = getFirstValue(result);

                for (let i = 0; i < rows.length; i++)
                {
                    const row = rows[i];
                    const id = get(row, idPath);
                    objectLookup.set(id, row);
                }
            }

            const newLinks = [];

            // insert all existing links that are still selected
            for (let i = 0; i < links.length; i++)
            {
                const link = links[i];
                if (selected.has(get(link, valuePath)))
                {
                    newLinks.push(link)
                }
            }


            // create new links for new links ids
            for (let id of newLinkIds)
            {
                const linkedObj = objectLookup.get(id);

                if (!linkedObj)
                {
                    throw new Error("No linked object for id " + id);
                }

                const newObj = createNewLink(generateId, valuePath, linkedObj, root, name, onNew);
                newLinks.push(newObj)
            }
            updateLinksAction(root, name, newLinks);
        }
    )
}



function setsEqual(setA, setB)
{
    if (setA.size !== setB.size)
    {
        return false;
    }
    for (let value of setA)
    {
        if (!setB.has(value))
        {
            return false;
        }
    }
    return true;
}


const updateSelected = action("AssociationSelector.updateSelected", (selected, links, valuePath) => {
    const newSelected = new Set();
    links.forEach(
        link => newSelected.add(
            get(link, valuePath)
        )
    );

    selected.replace(newSelected);
})


let associationSelectorCounter = 0

/**
 * Displays the currently associated entities of a many-to-many relationship as seen from one of the associated sides.
 */
const AssociationSelector = fnObserver(props => {

    const [associationSelectorId] = useState("associationSelector-"+ associationSelectorCounter++)

    const {
        name,
        value,
        display,
        mode: modeFromProps,
        label,
        query,
        queryCondition: queryConditionFromProps,
        modalTitle,
        fade,
        helpText,
        labelClass,
        formGroupClass,
        generateId,
        onNew,
        visibleColumns,
        alignPagination,
        paginationPageSizes,
        searchFilter,
        modalFilter,
        disabled
    } = props;

    const queryDef = query.getQueryDefinition();
    const iQueryType = useMemo(
        () => {
            if (queryDef != null) {
                const aliases = queryDef.aliases;
                const queryName = queryDef.methodCalls[0];
                const gqlMethodName = aliases ? aliases[queryName] || queryName : queryName;
                return getGraphQLMethodType(gqlMethodName).name
            }
            return null;
        },
        [ queryDef ]
    );

    const [elementId] = useState("assoc-selector-" + (++associationSelectorCount));

    const formConfig = useFormConfig();

    const [modalState, setModalState] = useState(MODAL_STATE_CLOSED);

    const links = get(formConfig.root, name);

    const selected = useLocalObservable(() => new Set());

    const queryCondition = typeof queryConditionFromProps === "function" ?
        queryConditionFromProps() :
        queryConditionFromProps;

    const defaultQueryCondition = query.defaultVars.config?.condition;

    const executeQueryCondition = getQueryCondition(defaultQueryCondition, queryCondition);

    const openModal = () => {
        query.execute(
            {
                ...query.defaultVars,
                config: {
                    ...query.defaultVars.config,
                    condition : executeQueryCondition
                }
            }
        ).then(
            result => {
                try
                {
                    const iQuery = getFirstValue(result);
                    if (getGenericType(iQuery._type) !== INTERACTIVE_QUERY)
                    {
                        throw new Error("Result is no interactive query object");
                    }

                    const { inputSchema } = config;
                
                    const rawVisibleColumns = visibleColumns ?? inputSchema.getTypeMeta(iQuery.type, "associationSelectorVisibleColumns");
                    const convertedVisibleColumns = typeof rawVisibleColumns === "string" ?
                                                        rawVisibleColumns.split(",") :
                                                        rawVisibleColumns;

                    const columns = iQuery.columnStates
                        .filter(
                            cs => cs.enabled && cs.name !== "id" && cs.name !== config.mergeOptions.versionField
                                    && (convertedVisibleColumns?.includes(cs.name) ?? true)
                        )
                        .map(
                            cs => {
                                const heading = inputSchema.getFieldMeta(iQuery.type, cs.name, "heading");
                                return { name: cs.name, heading }
                            }
                        );


                    const valuePath = toPath(value);

                    updateSelected(selected, links, valuePath);

                    const selectedBefore = new Set(selected);
                    
                    const columnTypes = columns.map(({name}) => unwrapAll(lookupType(iQuery.type, name)).name)

                    setModalState({
                        iQuery,
                        columns,
                        columnTypes,
                        isOpen: true,
                        valuePath,
                        selectedBefore,
                        idPath: valuePath.slice(1)
                    });

                }
                catch (e)
                {
                    console.error("ERROR", e);
                }
            }
        );
    };



    const toggle = () => {
        setModalState(toggleOpen);

        const { selectedBefore } = modalState;
        if (!setsEqual(selected, selectedBefore))
        {
            autoSubmitHack(formConfig);
            updateLinks(formConfig.root, name, modalState, selected, generateId, onNew)
        }

    };

    if (!Array.isArray(links))
    {
        throw new Error("AssociationSelector name prop must point to list of link values: " + JSON.stringify(links, null, 4));
    }

    const effectiveMode = modeFromProps || formConfig.options.mode;
    const isDisabled = typeof disabled === "function" ? disabled() : disabled;

    return (
        <React.Fragment>

            <FormGroup
                formConfig={ formConfig }
                fieldId={ elementId}
                label={ label }
                helpText={ helpText }
                labelClass={ labelClass }
                formGroupClass={formGroupClass}
                errorMessages={null}
                mode={ effectiveMode }
            >
                <ListGroup
                    id={ elementId }
                    className="assoc-selector"
                >
                    {
                        links.map((link,idx) => {

                            return (
                                <ListGroupItem
                                    key={idx}
                                    className="d-flex justify-content-between align-items-center"
                                >
                                    {
                                        typeof display === "function" ? display(link) : get(link, display)
                                    }
                                    <button
                                        type="Button"
                                        className="btn btn-link m-0 p-0"
                                        title={
                                            i18n("Remove Association")
                                        }
                                        onClick={
                                            () => removeLink(formConfig.root, selected, link, name, value)
                                        }
                                        disabled={isDisabled}
                                    >
                                        <Icon className="fa-times"/>
                                    </button>
                                </ListGroupItem>
                            );
                        })
                    }
                </ListGroup>
                <ButtonToolbar>
                    <button
                        type="Button"
                        className="btn btn-light"
                        onClick={ openModal }
                        disabled={isDisabled}
                        name={ name }
                    >
                        <Icon className="fa-clipboard-check mr-1"/>
                        Select
                    </button>
                </ButtonToolbar>
            </FormGroup>
            <AssociationSelectorModal
                { ... modalState }
                iQueryType={ iQueryType }
                selected={ selected }
                title={modalTitle}
                toggle={toggle}
                fade={fade}
                modalFilter={ modalFilter }
                searchFilter={ searchFilter }
                alignPagination={ alignPagination }
                paginationPageSizes={ paginationPageSizes }
                associationSelectorId={ associationSelectorId }
            />
        </React.Fragment>
    )

});

AssociationSelector.propTypes = {
    /**
     * Path to use as display value for associations or render function for associations ( linkObj => ReactElement ).
     */
    display: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func
    ]).isRequired,

    /**
     * Path to use as the representative value / id of the link
     */
    value: PropTypes.string,

    /**
     * iQuery GraphQL query to fetch the current list of target objects
     */
    query: PropTypes.instanceOf(GraphQLQuery).isRequired,

    /**
     * Optional FilterDSL condition to be applied to the execution of the AssociationSelector's query
     */
    queryCondition: PropTypes.oneOfType([
        PropTypes.instanceOf(Condition),
        PropTypes.func
    ]),

    /**
     * Title for the modal dialog selecting the target object
     */
    modalTitle: PropTypes.string,

    // FIELD PROP TYPES

    /**
     * Name / path for the association selector field. In contrast to most normal fields this does not point
     * to a scalar value but to list of associative entity / link table fields with embedded target objects
     */
    name: PropTypes.string,

    /**
     * Mode for this calendar field. If not set or set to null, the mode will be inherited from the &lt;Form/&gt; or &lt;FormBlock&gt;.
     */
    mode: PropTypes.oneOf(FieldMode.values()),

    /**
     * Additional help text for this field. Is rendered for non-erroneous fields in place of the error.
     */
    helpText: PropTypes.string,

    /**
     * Label for the field. Must be defined if name is missing.
     */
    label: PropTypes.string,

    /**
     * Additional HTML classes for the label element.
     */
    labelClass: PropTypes.string,

    /**
     * Additional HTML classes for the form group element.
     */
    formGroupClass: PropTypes.string,

    /**
     * Whether to do the modal fade animation on selection (default is true)
     */
    fade: PropTypes.bool,

    /**
     * Function to return a new id value for newly created associations. Note that you can use placeholder id values.
     *
     * Default is to create a new UUID (NPM "uuid" v4).
     */
    generateId: PropTypes.func,

    /**
     * Optional callback function that is called for every newly created association link and allows to modify
     * properties on that new link. ( link => ... )
     *
     */
    onNew: PropTypes.func,

    
    /**
     * Disables the AssociationSelector.
     * Can be defined as callback function.
     */
     disabled: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.func
    ]),

    /**
     * Field name or function returning a filter expression used to allow and
     * validate text-input changes of the selected value.
     *
     * The field or filter must match exactly one element from the current `query`.
     *
     * (Function must be of the form `value => ...` and must return a Filter DSL condition.)
     *
     */
    searchFilter: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func
    ]),
    
    /**
     * set the pagination alignment of the datagrid in the modal ("left" [default], "center", "right")
     */
     alignPagination: PropTypes.string,

    /**
     * set the available page sizes for the datagrid pagination
     */
    paginationPageSizes: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),

    /**
     * Filter mode for the selector modal. Controls display of column and repeated search filter in interaction with the searchFilter prop,
     */
    modalFilter: PropTypes.oneOf([
        NO_SEARCH_FILTER,
        NO_FILTER,
        COLUMN_FILTER
    ]),

};

AssociationSelector.defaultProps = {
    modalTitle: i18n("Select Associated Objects"),
    fade: false,
    generateId: v4
};

AssociationSelector.displayName = "AssociationSelector";

export default AssociationSelector;

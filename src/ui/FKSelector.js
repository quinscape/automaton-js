/**
 * Filter Mode: When a search filter is defined (with the searchFilter prop), do not offer the same search filter in the modal.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react"
import cx from "classnames"
import PropTypes from "prop-types"
import {
    Addon,
    Field,
    FieldMode,
    FormContext,
    FormGroup,
    GlobalConfig,
    Icon,
    InputSchema,
    unwrapType,
} from "domainql-form"
import i18n from "../i18n";
import { action, toJS } from "mobx"
import { observer as fnObserver } from "mobx-react-lite";
import GraphQLQuery from "../GraphQLQuery";
import InteractiveQuery, { getFirstValue } from "../model/InteractiveQuery";
import config from "../config"

import { getGenericType, INTERACTIVE_QUERY } from "../domain";
import autoSubmitHack from "../util/autoSubmitHack";
import FkSelectorModal from "./FkSelectorModal";
import { useDebouncedCallback } from "use-debounce"
import get from "lodash.get"
import {
    getGraphQLMethodType,
    getIQueryPayloadType,
    getOutputTypeName,
    getParentObjectType,
    lookupType,
    unwrapAll,
    unwrapNonNull
} from "../util/type-utils"

import {field, Type, value, condition, component, Condition} from "../FilterDSL"
import { isNonNull } from "domainql-form/lib/InputSchema";
import { SCALAR } from "domainql-form/lib/kind";
import CachedQuery from "../model/CachedQuery";
import updateComponentCondition from "../util/updateComponentCondition"
import {and} from "../../filter";
import OfflineQuery from "../model/OfflineQuery";


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

const updateRelatedObject = action(
    "FkSelector.updateRelatedObject",
    (root, path, field, row) => {

        if (path.length > 1)
        {
            root = get(root, path.slice(0,-1))
        }

        const oldRow = root[field];
        root[field] = row;

        return oldRow;
    }
)

const MODAL_STATE_CLOSED = {
    iQuery: null,
    columns: null,
    columnTypes: null,
    visibleColumns: null,
    isOpen: false
};

function isSelected(fieldValue)
{
    return fieldValue !== null && fieldValue !== undefined && fieldValue !== "";
}


let checkUserFilter;

if (__DEV)
{
    checkUserFilter = (objectType, relation, searchFilter) => {

        const { inputSchema } = config;

        const validateReference = name => {

            //console.log("validateReference (objectType = ", objectType, "): ", name );

            let relatedType;
            try
            {
                relatedType = unwrapNonNull(inputSchema.resolveType(objectType, relation.leftSideObjectName + "." + name));
            }
            catch(e)
            {
                console.error("Error resolving searchFilter field '" + name + "'", e)
            }

            if (relatedType.kind !== SCALAR)
            {
                console.error("searchFilter field '" + name + "' is not a scalar field", relatedType);
            }
        };

        const validateFieldRefs = cond => {

            if (cond.type === Type.COMPONENT)
            {
                validateFieldRefs(cond.condition);
            }
            else if (cond.type === Type.CONDITION || cond.type === Type.OPERATION)
            {
                const { operands } = cond;
                if (operands)
                {
                    for (let i = 0; i < operands.length; i++)
                    {
                        const operand = operands[i];
                        validateFieldRefs(operand)
                    }
                }
            }
            else if (cond.type === Type.FIELD)
            {
                validateReference(cond.name);
            }
        }

        // if we have a function, we check an example filter
        if (typeof searchFilter === "function")
        {
            const condition = searchFilter("AAA")
            validateFieldRefs(condition);
        }
        else 
        {
            // otherwise we only check the static field reference
            validateReference(searchFilter);
        }
    };
}

let fkSelectorCounter = 0


/**
 * Renders the current value of foreign key references and allows changing of references via text-input and selection from
 * modal grid.
 */
const FKSelector = fnObserver(props => {

    const [fkSelectorId] = useState("fkSelector-"+ fkSelectorCounter++)

    const [modalState, setModalState] = useState(MODAL_STATE_CLOSED);

    const [ isLoading, setIsLoading ] = useState(false);

    const {
        display,
        query: queryFromProps,
        queryCondition: queryConditionFromProps,
        catalogueRootType,
        catalogueFieldQualifiedName,
        searchFilter,
        modalTitle,
        fade,
        searchTimeout,
        modalFilter,
        cachedPageSize,
        children,
        onChange,
        selectButtonContentRenderer,
        visibleColumns,
        alignPagination,
        paginationPageSizes,
        ... fieldProps
    } = props;

    const haveUserInput = !!searchFilter;

    const queryCondition = typeof queryConditionFromProps === "function" ?
        queryConditionFromProps() :
        queryConditionFromProps;

    const iQueryDoc = useMemo(
        () => {
            if (queryFromProps instanceof CachedQuery || queryFromProps instanceof OfflineQuery)
            {
                return queryFromProps;
            }
            else if (queryFromProps instanceof InteractiveQuery)
            {
                return new CachedQuery(
                    queryFromProps, {
                        pageSize: cachedPageSize
                    });
            }
            else
            {
                return null;
            }
        },
        [ FormContext.getUniqueId(queryFromProps) ]
    )

    const query = iQueryDoc ? iQueryDoc._query : queryFromProps;

    return (
        <Field
            {... fieldProps }
            addons={ Addon.filterAddons(children) }
        >
            {
                (formConfig, ctx) => {

                    const { fieldId, fieldType, qualifiedName, mode, autoFocus, inputClass, tooltip, placeholder, addons, path } = ctx;

                    const errorMessages  = formConfig.getErrors(ctx.qualifiedName);
                    const haveErrors = errorMessages.length > 0;

                    const rootType = catalogueRootType ?? getOutputTypeName(formConfig.type);
                    const sourcePath = catalogueFieldQualifiedName?.split(".") ?? path;

                    const relation = useMemo(
                        () => {

                            const { inputSchema } = config;

                            let objectType;
                            let fieldName;

                            if (sourcePath.length === 1)
                            {
                                // simple case
                                objectType = rootType;
                                fieldName = sourcePath[0];
                            }
                            else
                            {
                                // path is more than 1 element long, we need to figure out the correct object type and field
                                objectType = getParentObjectType(rootType, sourcePath);
                                fieldName = sourcePath[sourcePath.length - 1];
                            }

                            const relations = inputSchema.getRelations().filter(
                                r => r.sourceType === objectType && r.sourceFields[0] === fieldName
                            );

                            if (!relations.length)
                            {
                                throw new Error("No relation found starting at '" + objectType + "' and source field '" + fieldName + "'")
                            }

                            const relation = relations[0];

                            if (__DEV)
                            {
                                if (relation.sourceField !== "OBJECT_AND_SCALAR")
                                {
                                    throw new Error("Relation has invalid source field type: " + JSON.stringify(relation))
                                }

                                if (searchFilter)
                                {
                                    checkUserFilter(objectType, relation, searchFilter);
                                }
                                
                            }
                            //console.log("FKSelector relation", relation);

                            return relation;
                        },
                        [ rootType, qualifiedName ]
                    )

                    const getFieldValue = () => {

                        let fieldValue;
                        if (display)
                        {
                            fieldValue = typeof display === "function" ? display(formConfig, ctx) : get(formConfig.root, display);
                        }
                        else
                        {
                            const scalarType = unwrapType(ctx.fieldType).name;

                            fieldValue = Field.getValue(formConfig, ctx, errorMessages);
                            fieldValue = fieldValue !== null ? InputSchema.scalarToValue(scalarType, fieldValue) : "";
                        }

                        if (!isSelected(fieldValue))
                        {
                            fieldValue = haveUserInput ? "" : GlobalConfig.none();
                        }

                        return fieldValue;
                    };

                    const [inputValue, setInputValue] = useState(getFieldValue);
                    const [userIsTyping, setUserIsTyping] = useState(false);

                    const [isAmbiguousMatch, setIsAmbiguousMatch] = useState(false);


                    const queryDef = query.getQueryDefinition();
                    const aliases = queryDef.aliases;
                    const name = queryDef.methodCalls[0];
                    const gqlMethodName = aliases ? aliases[name] || name : name;

                    const iQueryType = useMemo(
                        () => getGraphQLMethodType(gqlMethodName).name,
                        [ gqlMethodName ]
                    );

                    const fieldValue = Field.getValue(formConfig, ctx, errorMessages);
                    useEffect(
                        () => {
                            if (!haveErrors && !userIsTyping)
                            {
                                const fieldValue = getFieldValue();
                                //console.log("SEARCH FIELD EFFECT", fieldValue, inputValue);
                                if (fieldValue !== inputValue)
                                {
                                    //console.log("CHANGE TO ", fieldValue);
                                    // formConfig.handleChange(ctx, fieldValue);
                                    setInputValue(fieldValue);
                                }
                            }
                        },
                        [fieldValue]
                    );

                    const debouncedInputValidation = useDebouncedCallback(
                        val => {

                            if (val === "")
                            {
                                if (isNonNull(ctx.fieldType))
                                {
                                    const { root, formContext } = formConfig;

                                    formContext.updateErrors(root, ctx.qualifiedName, [ val, formConfig.formContext.getRequiredErrorMessage(ctx) ]);
                                    setUserIsTyping(false);
                                    return;
                                }

                                const type = getIQueryPayloadType(iQueryType);
                                if (!type)
                                {
                                    throw new Error("Could not determine payload type of " + iQueryType + ". It does not seem to be an InteractiveQuery-based class.");
                                }
                                selectRow(null);
                                setUserIsTyping(false);
                                return;
                            }


                            //console.log("FK-CONTEXT", ctx);
                            //console.log("QUERY", query);

                            const condition = createSearchFilter(iQueryType, searchFilter, val);
                            setIsLoading(true);

                            const composite = updateComponentCondition(
                                query.defaultVars && query.defaultVars.config && query.defaultVars.config.condition || component(fkSelectorId, null),
                                condition,
                                fkSelectorId
                            )

                            query.defaultVars.config = {
                                ... query.defaultVars.config,
                                offset: 0,
                                pageSize: query.defaultVars.config?.pageSize ?? 10
                            };

                            query.execute({
                                    config: {
                                        condition : queryCondition ? and(composite, queryCondition) : composite,
                                        offset: 0,
                                        // we only want to know if there's more than one match. We don't care how many
                                        pageSize: 2
                                    }
                                })
                                .then(result => {
                                    const iQuery = getFirstValue(result);

                                    //console.log("Received search result: ", toJS(iQuery));

                                    //console.log("inputValidation: UPDATE CONFIG", query.defaultVars.config)

                                    const { length } = iQuery.rows;

                                    if (length === 1)
                                    {
                                        selectRow(iQuery.rows[0]);
                                        setIsAmbiguousMatch(false);
                                    }
                                    else if (length === 0)
                                    {
                                        formConfig.formContext.updateErrors(formConfig.root, ctx.qualifiedName, [ val, i18n("FKSelector:No match") ]);
                                        setIsAmbiguousMatch(false);
                                    }
                                    else
                                    {
                                        formConfig.formContext.updateErrors(formConfig.root, ctx.qualifiedName, [ val, i18n("FKSelector:Ambiguous match") ]);
                                        setIsAmbiguousMatch(true);
                                    }

                                    setIsLoading(false);
                                    setUserIsTyping(false);
                                    //console.log("ERRORS", formConfig.errors);
                                },
                                err => {
                                    console.error("Error searching for foreign key target", err);

                                    setUserIsTyping(false);
                                    setIsLoading(false);
                                }
                            );
                        },
                        searchTimeout
                    );

                    const selectRow = row => {

                        const { qualifiedName, path } = ctx;

                        let oldValue = null;
                        let value = null;
                        if (qualifiedName)
                        {
                            oldValue = Field.getValue(formConfig, ctx, errorMessages);
                            value = row ? row[relation.targetFields[0]] : "";
                            formConfig.handleChange(ctx, value);
                            setIsAmbiguousMatch(false);
                        }

                        const oldRow = updateRelatedObject(
                            formConfig.root,
                            path,
                            relation.leftSideObjectName,
                            row
                        )

                        if (onChange)
                        {
                            onChange({ oldValue, oldRow, row, fieldContext: ctx}, value)
                        }

                        setInputValue(getFieldValue());

                        autoSubmitHack(formConfig);
                        if (modalState.isOpen)
                        {
                            setModalState(MODAL_STATE_CLOSED);
                        }

                    };

                    const selectFromModal = () => {

                        // if we have an ambiguous match but are configured to show no search filter, we can still preselect the column filter if we have a simple search filter
                        const shouldPreselectFilter = modalFilter !== NO_SEARCH_FILTER || typeof searchFilter === "string";
                        let cond = isAmbiguousMatch && shouldPreselectFilter ? createSearchFilter(iQueryType, searchFilter, inputValue) : null

                        const composite = updateComponentCondition(
                            query.defaultVars && query.defaultVars.config && query.defaultVars.config.condition || component(fkSelectorId, null),
                            cond,
                            isAmbiguousMatch && modalFilter === NO_SEARCH_FILTER && shouldPreselectFilter ? "fk-selector-grid" : fkSelectorId
                        )

                        query.defaultVars.config = {
                            ... query.defaultVars.config,
                            offset: 0,
                            pageSize: query.defaultVars.config?.pageSize ?? 10
                        };

                        query.execute(
                                    {
                                        config: {
                                            ... iQueryDoc ? iQueryDoc.queryConfig : query.defaultVars.config,
                                            condition : queryCondition ? and(composite, queryCondition) : composite
                                        }
                                    }
                                )
                            .then(
                                result => {
                                    const iQuery = getFirstValue(result);
                                    if (getGenericType(iQuery._type) !== INTERACTIVE_QUERY)
                                    {
                                        throw new Error("Result is no interactive query object");
                                    }

                                    //console.log("selectFromModal: UPDATE CONFIG", query.defaultVars.config)

                                    try
                                    {
                                        const { inputSchema } = config;

                                        const rawVisibleColumns = visibleColumns ?? inputSchema.getTypeMeta(iQuery.type, "fkSelektorVisibleColumns");
                                        const convertedVisibleColumns = typeof rawVisibleColumns === "string" ?
                                                                            rawVisibleColumns.split(",") :
                                                                            rawVisibleColumns;

                                        const columns = iQuery.columnStates
                                            .filter(
                                                cs => cs.enabled && cs.name !== "id" && (convertedVisibleColumns?.includes(cs.name) ?? true)
                                            )
                                            .map(
                                                cs => {
                                                    const heading = inputSchema.getFieldMeta(iQuery.type, cs.name, "heading");
                                                    return { name: cs.name, heading }
                                                }
                                            );

                                        const columnTypes = columns.map(({name}) => unwrapAll(lookupType(iQuery.type, name)).name)

                                        //console.log(JSON.stringify(query.defaultVars, null, 4));

                                        setModalState({
                                            iQuery,
                                            columns,
                                            columnTypes,
                                            // XXX: There is only one situation where it makes sense to have a preselection within the modal filter
                                            //      if we just had an ambiguous match, the modal can show us the matches
                                            //      for every other match outcome or other selection, we don't want a filter that is retricting the results
                                            //      to the current state
                                            filter: isAmbiguousMatch && modalFilter !== NO_SEARCH_FILTER ? inputValue : "",
                                            isOpen: true
                                        });

                                    } catch (e)
                                    {
                                        console.error("ERROR", e);
                                }
                            }
                        );
                    };


                    const toggle = useCallback(
                        () => setModalState(toggleOpen),
                        []
                    );
                    const newAddons = addons.slice();

                    if (haveUserInput)
                    {
                        newAddons.push(
                            <Addon placement={ Addon.LEFT } text={ true }>
                                <Icon style={{ width: "1.8ex" }} className={ isLoading ? "text-muted fa-hourglass-half" : "fa-search" }/>
                            </Addon>
                        )
                    }

                    newAddons.push(
                        <Addon placement={ Addon.RIGHT }>
                            <button
                                className="btn btn-light"
                                type="button"
                                title={ modalTitle }
                                disabled={mode !== FieldMode.NORMAL }
                                aria-roledescription={ modalTitle }
                                onClick={ selectFromModal }
                            >
                                &hellip;
                            </button>
                        </Addon>
                    )


                    return (
                        <FormGroup
                            { ... ctx }
                            formConfig={ formConfig }
                            errorMessages={ errorMessages }
                        >
                            {
                                Addon.renderWithAddons(
                                    <input
                                        id={ fieldId }
                                        name={ qualifiedName }
                                        className={
                                            cx(
                                                inputClass,
                                                "fks-display form-control pl-2",
                                                mode !== FieldMode.NORMAL && "disabled",
                                                haveErrors && "is-invalid"
                                            )
                                        }
                                        type="text"
                                        placeholder={ placeholder }
                                        title={ tooltip }
                                        disabled={ mode === FieldMode.DISABLED }
                                        readOnly={ !haveUserInput || mode === FieldMode.READ_ONLY }
                                        value={ inputValue }
                                        onKeyPress={ ctx.handleKeyPress }
                                        onChange={
                                            ev => {
                                                const value = ev.target.value;
                                                setUserIsTyping(true);
                                                setInputValue(value);
                                                debouncedInputValidation(value);
                                            }
                                        }
                                        autoFocus={autoFocus ? true : null}
                                    />,
                                    newAddons
                                )
                            }
                            <FkSelectorModal
                                { ... modalState }
                                iQueryType={ iQueryType }
                                title={ modalTitle }
                                fieldType={ fieldType }
                                selectRow={ selectRow }
                                toggle={ toggle }
                                fade={ fade }
                                modalFilter={ modalFilter }
                                searchFilter={ searchFilter }
                                searchTimeout={ searchTimeout }
                                fkSelectorId={ fkSelectorId }
                                selectButtonContentRenderer={ selectButtonContentRenderer }
                                alignPagination={ alignPagination }
                                paginationPageSizes={ paginationPageSizes }
                            />
                        </FormGroup>
                    );
                }

            }
        </Field>
    );
});

FKSelector.propTypes = {
    /**
     * Property to use as display value or render function for the current value  ( formConfig => ReactElement ). Can be used to extend on simple property rendering.
     */
    display: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func
    ]),
    /**
     * iQuery GraphQL query to fetch the current list of target objects or iQuery document containing all values
     */
    query: PropTypes.oneOfType([
        PropTypes.instanceOf(GraphQLQuery),
        PropTypes.instanceOf(InteractiveQuery)
    ]).isRequired,

    /**
     * Optional FilterDSL condition to be applied to the execution of the FKSelector's query
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
     * Name / path for the  foreign key value (e.g. "name", but also "foos.0.name"). 
     */
    name: PropTypes.string.isRequired,

    /**
     * Mode for this foreign key selector. If not set or set to null, the mode will be inherited from the &lt;Form/&gt; or &lt;FormBlock&gt;.
     */
    mode: PropTypes.oneOf(FieldMode.values()),

    /**
     * Filter mode for the selector modal. Controls display of column and repeated search filter in interaction with the searchFilter prop,
     */
    modalFilter: PropTypes.oneOf([
        NO_SEARCH_FILTER,
        NO_FILTER,
        COLUMN_FILTER
    ]),

    /**
     * Additional help text for this field. Is rendered for non-erroneous fields in place of the error. If a function
     * is given, it should be a stable reference ( e.g. with useCallback()) to prevent creating the field context over
     * and over. The same considerations apply to using elements. ( The expression <Bla/> recreates that element on every
     * invocation, use static element references)
     */
    helpText: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.element]),
    /**
     * Tooltip / title attribute for the input element
     */
    tooltip: PropTypes.string,
    /**
     * Label for the field. Must be defined if name is missing.
     */
    label: PropTypes.string,

    /**
     * Additional HTML classes for the display value.
     */
    inputClass: PropTypes.string,

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
     * True to focus the fk selector input (See `searchFilter` )
     */
    autoFocus: PropTypes.bool,

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
     * Timeout in ms after which the input will do the validation query ( default: 350).
     */
    searchTimeout: PropTypes.number,

    /**
     * Placeholder for input (See `searchFilter`)
     */
    placeholder: PropTypes.string,

    /**
     * Page size to use when using an in-memory iQuery document as data source. (Default is 5)
     */
    cachedPageSize: PropTypes.number,

    /**
     * Optional validation handler ( (ctx, value) => error(s) ).
     */
    validate: PropTypes.func,

    /**
     * Optional async validation handler ( (ctx, value) => Promise<error(s)> ).
     */
    validateAsync: PropTypes.func,

    /**
     * Optional extended local on-change handler ({oldValue, oldRow, row, fieldContext)}, value => ...)
     */
    onChange: PropTypes.func,

    /**
     * Optional override for visible columns definition.
     * 
     * By default every column returned by the query is visible.
     * The FKSelector then checks for a "fkSelektorVisibleColumns" definition in the type metadata to filter out unneeded columns.
     * 
     * This property overrides the type metadata value for a single FKSelector field.
     */
    visibleColumns: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
    ]),

    /**
     * set the pagination alignment of the datagrid in the modal ("left" [default], "center", "right")
     */
    alignPagination: PropTypes.string,

    /**
     * set the available page sizes for the datagrid pagination
     */
    paginationPageSizes: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
};

FKSelector.defaultProps = {
    modalTitle: i18n("Select Target Object"),
    fade: false,
    searchTimeout: 350,
    cachedPageSize: 5
};

FKSelector.displayName = "FKSelector";

FKSelector.NO_SEARCH_FILTER = NO_SEARCH_FILTER;
FKSelector.NO_FILTER = NO_FILTER;
FKSelector.COLUMN_FILTER = COLUMN_FILTER;

export default FKSelector;


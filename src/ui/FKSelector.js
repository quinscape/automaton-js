import React, { useCallback, useMemo, useState } from "react"
import cx from "classnames"
import PropTypes from "prop-types"
import { Addon, Field, FieldMode, FormGroup, GlobalConfig, InputSchema, unwrapType, useFormConfig } from "domainql-form"
import i18n from "../i18n";
import { action, observable } from "mobx";
import { observer as fnObserver } from "mobx-react-lite";
import GraphQLQuery from "../GraphQLQuery";
import InteractiveQuery, { getFirstValue } from "../model/InteractiveQuery";
import config from "../config"

import { getGenericType, INTERACTIVE_QUERY } from "../domain";
import autoSubmitHack from "../util/autoSubmitHack";
import FkSelectorModal from "./FkSelectorModal";
import { useDebouncedCallback } from "use-debounce"
import toPath from "lodash.topath"
import get from "lodash.get"
import { getOutputTypeName, lookupType } from "../util/type-utils"

import { field, value } from "../FilterDSL"
import { getGraphQLMethodType } from "../Process";
import { isNonNull } from "domainql-form/lib/InputSchema";


function toggleOpen(modalState)
{
    return {
        ... modalState,
        isOpen: !modalState.isOpen
    };
}

const updateOuterForm = action(
    "Merge FK data",
    (root, obj, onUpdate, row) => {

        for (let name in obj)
        {
            if (obj.hasOwnProperty(name))
            {
                root[name] = obj[name];
            }
        }

        if (onUpdate)
        {
            onUpdate(row)
        }
    }
);


const MODAL_STATE_CLOSED = {
    iQuery: null,
    columns: null,
    isOpen: false
};



let fkSelectorCount = 0;


function isSelected(fieldValue)
{
    return fieldValue !== null && fieldValue !== undefined && fieldValue !== "";
}


function SelectButtonAddon({modalTitle, mode, query: queryFromProps, setModalState, left })
{
    const query = queryFromProps instanceof GraphQLQuery ? queryFromProps : queryFromProps._query;
    const iQueryDoc = queryFromProps instanceof InteractiveQuery ? queryFromProps : null;


    return (
        <span
            className={
                left ? "input-group-prepend": "input-group-append"
            }
        >
            <button
                className="btn btn-light border"
                type="button"
                title={modalTitle}
                disabled={mode !== FieldMode.NORMAL}
                aria-roledescription={modalTitle}
                onClick={
                    () => {

                        let promise;
                        if (iQueryDoc)
                        {
                            promise = Promise.resolve({ iQueryDoc })

                        }
                        else
                        {
                            promise = queryFromProps.execute(
                                queryFromProps.defaultVars
                            );
                        }
                        promise.then(
                            result => {
                                try
                                {
                                    const iQuery = getFirstValue(result);
                                    if (getGenericType(iQuery._type) !== INTERACTIVE_QUERY)
                                    {
                                        throw new Error("Result is no interactive query object");
                                    }

                                    const columns = iQuery.columnStates
                                        .filter(
                                            cs => cs.enabled && cs.name !== "id"
                                        )
                                        .map(
                                            cs => cs.name
                                        );

                                    //console.log(JSON.stringify(query.defaultVars, null, 4));

                                    setModalState({
                                        iQuery,
                                        columns,
                                        isOpen: true
                                    });

                                } catch (e)
                                {
                                    console.error("ERROR", e);
                                }
                            }
                        );
                    }
                }
            >
                &hellip;
            </button>
        </span>
    );
}


/**
 * Renders the current value of foreign key references and allows changing of references via text-input and selection from
 * modal grid.
 */
const FKSelector = fnObserver(props => {

    const formConfig = useFormConfig();

    const [modalState, setModalState] = useState(MODAL_STATE_CLOSED);
    const [ flag, setFlag ] = useState(false);

    const { display, query : queryFromProps, modalTitle, targetField, onUpdate, fade, validateInput, validateInputJS, children } = props;

    const haveUserInput = validateInput || validateInputJS;

    // FIELD PROPS
    const { id, name, mode: modeFromProps, helpText, tooltip, label: labelFromProps, inputClass, labelClass, formGroupClass, autoFocus, validationTimeout, placeholder } = props;


    const query = useMemo(
        () => {
            if (queryFromProps instanceof GraphQLQuery)
            {
                return queryFromProps;
            }
            else if (queryFromProps instanceof InteractiveQuery)
            {
                return queryFromProps._query;
            }
        },
        [queryFromProps]
    )

    const getUpdateForEmbedded = (rowType, rowValue) => {

        // resolve type of FKSelector parent;
        const type = getOutputTypeName(formConfig.type);

        const typeDef = config.inputSchema.getType(type);

        //console.log("TYPE-DEF", typeDef);
        const objectFields = typeDef.fields.filter(fd => unwrapType(fd.type).name === rowType);

        const fieldCount = objectFields.length;
        if (fieldCount > 1)
        {
            throw new Error("Ambiguous embedded fields in " + rowType + ": " + JSON.stringify(objectFields, null, 4));
        }

        if (fieldCount === 1)
        {
            return {
                [objectFields[0].name]: rowValue || {}
            }
        }

        return null;
    };

    /**
     * We're creating a simplified field context basically because our name prop is optional here :\
     */
    const fkContext = useMemo(
        () => {

            const haveNameProp = !!name;

            let qualifiedName;
            let path;
            let fieldType;
            let fieldId;
            let effectiveLabel;



            if (haveNameProp)
            {
                qualifiedName = formConfig.getPath(name);
                path = toPath(qualifiedName);
                fieldType = formConfig.schema.resolveType(formConfig.type, path);
                const lastSegment = path[path.length - 1];
                fieldId = id || "field-" + formConfig.type + "-" + qualifiedName;
                effectiveLabel =
                    typeof labelFromProps === "string" ? labelFromProps : formConfig.options.lookupLabel(formConfig, lastSegment);

            }
            else
            {
                if (!labelFromProps)
                {
                    throw new Error("<FKSelector/> needs a label prop if the name prop is missing");
                }
                if (!display)
                {
                    throw new Error("<FKSelector/> needs a display prop if the name prop is missing");
                }

                qualifiedName = null;
                path = null;
                fieldType = null;
                fieldId = "field-" + formConfig.type + "-fk" + fkSelectorCount++;
                effectiveLabel = labelFromProps;
            }

            let effectiveMode = modeFromProps || formConfig.options.mode;

            let inputMode;
            if (haveUserInput)
            {
                inputMode = FieldMode.NORMAL;
            }
            else
            {
                if (effectiveMode !== FieldMode.READ_ONLY)
                {
                    inputMode = FieldMode.DISABLED;
                }
                else
                {
                    inputMode = effectiveMode;
                }
            }

            const addons = Addon.filterAddons(children);
            const leftAddons = [];
            const rightAddons = [];

            let haveButtonAddon = false;
            let i;
            for (i = 0; i < addons.length; i++)
            {
                const addon = addons[i];

                const {className, placement} = addon.props;

                const isButtonAddon = className && className.indexOf(FKSelector.addonClass) >= 0;

                if (isButtonAddon)
                {
                    haveButtonAddon = true;
                }

                if (placement === Addon.LEFT)
                {
                    leftAddons.push(
                        isButtonAddon ? (
                                <SelectButtonAddon
                                    key={ i }
                                    query={ queryFromProps }
                                    modalTitle={ modalTitle }
                                    mode={ effectiveMode }
                                    setModalState={ setModalState }
                                    left={ true }
                                />
                            ) :
                            React.cloneElement(
                                addon,
                                {
                                    key: i
                                }
                            )
                    );
                }
                else if (placement === Addon.RIGHT)
                {
                    rightAddons.push(
                        isButtonAddon ? (
                                <SelectButtonAddon
                                    key={ i }
                                    query={ queryFromProps }
                                    modalTitle={ modalTitle }
                                    mode={ effectiveMode }
                                    setModalState={ setModalState }
                                    left={ false }
                                />
                            ) :
                            React.cloneElement(
                                addon,
                                {
                                    key: i
                                }
                            )
                    );
                }
            }

            if (!haveButtonAddon)
            {
                rightAddons.push(
                    <SelectButtonAddon
                        key={ i }
                        query={ queryFromProps }
                        modalTitle={ modalTitle }
                        mode={ effectiveMode }
                        setModalState={ setModalState }
                        left={ false }
                    />
                )
            }

            const ctx = {
                qualifiedName,
                path,
                fieldType,
                fieldId,
                label: effectiveLabel,
                mode: effectiveMode,
                inputMode,
                leftAddons,
                rightAddons,
                haveButtonAddon
            };

            //console.log("FK-CONTEXT", ctx, "PROPS", props);

            Field.registerContext(formConfig.root, ctx);

            return ctx;
        },
        [ formConfig.type, name ]
    );

    const errorMessages  = formConfig.getErrors(fkContext.qualifiedName);


    const getFieldValue = () => {

        let fieldValue;
        if (display)
        {
            fieldValue = typeof display === "function" ? display(formConfig) : get(formConfig.root, display);
        }
        else
        {
            const scalarType = unwrapType(fkContext.fieldType).name;

            fieldValue = Field.getValue(formConfig, fkContext, errorMessages);
            fieldValue = fieldValue !== null ? InputSchema.scalarToValue(scalarType, fieldValue) : "";
        }

        if (!isSelected(fieldValue))
        {
            fieldValue = haveUserInput ? "" : GlobalConfig.none();
        }

        return fieldValue;
    };

    const [inputValue, setInputValue] = useState(getFieldValue);

    const [ debouncedInputValidation, cancelDebouncedInputValidation ] = useDebouncedCallback(
        val => {

            const iQueryType = getGraphQLMethodType(query.getQueryDefinition().methods[0]);

            if (val === "")
            {
                if (isNonNull(fkContext.fieldType))
                {
                    formConfig.addError(
                        fkContext.fieldId,
                        "Field Required",
                        ""
                    );
                    return;
                }

                const genericTypes = config.inputSchema.schema.genericTypes.filter(
                    genericType => genericType.type === "InteractiveQueryQuxD"
                );
                const type = genericTypes[0].typeParameters[0];
                selectRow(type, null);
                return;
            }


            //console.log("FK-CONTEXT", fkContext);
            //console.log("QUERY", query);

            let promise;

            // we do a JS filter if
            if (
                // we have a js filter function and
                typeof validateInputJS === "function" &&
                // we have the injected iQuery document and
                queryFromProps instanceof InteractiveQuery &&
                // it contains all of the data for that type/condition.
                queryFromProps.rowCount === queryFromProps.rows.length
            )
            {
                const filterDoc = new InteractiveQuery();
                filterDoc._type = queryFromProps._type;
                filterDoc.type = queryFromProps.type;
                filterDoc.columnStates = queryFromProps.columnStates;
                filterDoc.queryConfig = {
                    config: {
                        // XXX: hope this doesn't give us problems
                        condition: null,
                        offset: 0,
                        pageSize: 0
                    }
                };

                const filteredRows = queryFromProps.rows.filter(row => validateInputJS(row, val) );
                filterDoc.rows = observable(
                    filteredRows
                );
                filterDoc.rowCount = filteredRows.length;
                //console.log({filterDoc: toJS(filterDoc)})

                promise = Promise.resolve({filterDoc});
            }
            else
            {
                let condition;

                if (typeof validateInput === "function")
                {
                    condition = validateInput(val)
                }
                else
                {
                    const typeRef = lookupType(iQueryType.name, "rows." + validateInput);
                    condition = field(validateInput)
                        .eq(
                            value(
                                val,
                                typeRef.name
                            )
                        );
                }

                promise = query.execute({
                    config: {
                        condition,
                        offset: 0,
                        pageSize: 0
                    }
                });
            }
            promise.then(result => {
                const iQuery = getFirstValue(result);

                const { length } = iQuery.rows;

                if (length === 1)
                {
                    formConfig.removeErrors(fkContext.fieldId);
                    selectRow(iQuery.type, iQuery.rows[0]);
                }
                else if (length === 0)
                {
                    formConfig.addError(fkContext.fieldId, i18n("FKSelector:No match"), val);
                }
                else
                {
                    formConfig.addError(fkContext.fieldId, i18n("FKSelector:Ambiguous match"), val);
                }

                setFlag(!flag);
                //console.log("ERRORS", formConfig.errors);
            });
        },
        validationTimeout
    );



    const selectRow = (type,row) => {

        //console.log("selectRow", toJS(row));

        const formUpdate = {};
        const { qualifiedName, fieldId } = fkContext;
        if (qualifiedName)
        {
            formUpdate[qualifiedName] = row && row[targetField];
        }

        if (!onUpdate)
        {
            Object.assign(formUpdate, getUpdateForEmbedded(type, row));
        }

        //console.log("FORM UPDATE", toJS(formUpdate, { recurseEverything: true}), "onUpdate = ", onUpdate, "row = ", toJS(row));

        formConfig.removeErrors(fieldId);
        updateOuterForm(
            formConfig.root,
            formUpdate,
            onUpdate,
            row
        );

        setInputValue(getFieldValue());

        autoSubmitHack(formConfig);
        if (modalState.isOpen)
        {
            setModalState(MODAL_STATE_CLOSED);
        }

    };

    const toggle = useCallback(
        () => setModalState(toggleOpen),
        []
    );




    const { fieldId, fieldType, qualifiedName, path, label, mode, inputMode, leftAddons, rightAddons } = fkContext;

    //console.log("render FKSelector", { props, fkContext});


    return (
        <FormGroup
            formConfig={formConfig}
            formGroupClass={cx("fk-selector", formGroupClass)}
            errorMessages={errorMessages}
            fieldId={fieldId}
            label={label}
            helpText={helpText}
            labelClass={labelClass}
            mode={mode}
        >
            <div className="input-group mb-3">
                {
                    leftAddons
                }
                <input
                    id={fieldId}
                    name={qualifiedName}
                    className={
                        cx(
                            inputClass,
                            "fks-display form-control border rounded pl-2",
                            inputMode !== FieldMode.NORMAL && "disabled",
                            errorMessages.length > 0 && "is-invalid"
                        )
                    }
                    type="text"
                    placeholder={placeholder}
                    title={tooltip}
                    disabled={inputMode === FieldMode.DISABLED}
                    readOnly={inputMode === FieldMode.READ_ONLY}
                    value={inputValue}
                    onChange={
                        ev => {
                            const value = ev.target.value;
                            setInputValue(value);
                            debouncedInputValidation(value);
                        }
                    }
                    autoFocus={autoFocus ? true : null}
                />
                {
                    rightAddons
                }
                <FkSelectorModal
                    {...modalState}
                    title={modalTitle}
                    fieldType={fieldType}
                    selectRow={selectRow}
                    toggle={toggle}
                    fade={fade}
                />
            </div>
        </FormGroup>
    );

});

FKSelector.propTypes = {
    /**
     * Property to use as display value or render function for the current value  ( formConfig => ReactElement ). Must be set if name is not set.
     */
    display: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func
    ]),
    /**
     * iQuery GraphQL query to fetch the current list of target objects
     */
    query: PropTypes.oneOfType([
        PropTypes.instanceOf(GraphQLQuery),
        PropTypes.instanceOf(InteractiveQuery)
    ]).isRequired,

    /**
     * Name of the relation target field 
     */
    targetField: PropTypes.string,
    /**
     * Optional alternate handler for target selection. The default behavior can automatically update
     * an embedded target object if
     */
    onUpdate: PropTypes.func,

    /**
     * Title for the modal dialog selecting the target object
     */
    modalTitle: PropTypes.string,

    // FIELD PROP TYPES

    /**
     * Name / path for the  foreign key value (e.g. "name", but also "foos.0.name"). Optional for this widget as it can
     * also operate just by updating embedded objects. If name is not set, display and label must be set.
     */
    name: PropTypes.string,

    /**
     * Mode for this foreign key selector. If not set or set to null, the mode will be inherited from the &lt;Form/&gt; or &lt;FormBlock&gt;.
     */
    mode: PropTypes.oneOf(FieldMode.values()),

    /**
     * Additional help text for this field. Is rendered for non-erroneous fields in place of the error.
     */
    helpText: PropTypes.string,
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
     * True to focus the fk selector input (See `validateInput` )
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
    validateInput: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func
    ]),

    /**
     * Provides a js validation function that is only used in one special case. Injected iQueries and textual user-input.
     *
     * If we use an InteractiveQuery that contains all the rows of that types, we can use this function to filter that
     * injected Interactive query document via JavaScript instead of querying the server.
     *
     * If this prop is not set, the FKSelector will query the server in any case.
     */
    validateInputJS: PropTypes.func,

    /**
     * Timeout in ms after which the input will do the validation query ( default: 300).
     */
    validationTimeout: PropTypes.number,

    /**
     * Placeholder for input (See `validateInput`)
     */
    placeholder: PropTypes.string
};

FKSelector.defaultProps = {
    targetField: "id",
    modalTitle: i18n("Select Target Object"),
    fade: false,
    validationTimeout: 250
};

FKSelector.displayName = "FKSelector";

FKSelector.addonClass = "fk-selector";

export default FKSelector;

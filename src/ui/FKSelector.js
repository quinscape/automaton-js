import React, { useCallback, useState, useMemo } from "react"
import cx from "classnames"
import PropTypes from "prop-types"
import { Field, FieldMode, FormConfig, FormGroup, GlobalConfig, unwrapType, useFormConfig } from "domainql-form"
import i18n from "../i18n";
import { action, toJS } from "mobx";
import { observer as fnObserver } from "mobx-react-lite";
import GraphQLQuery from "../GraphQLQuery";
import { getFirstValue } from "../model/InteractiveQuery";
import config from "../config"

import { getGenericType, INTERACTIVE_QUERY } from "../domain";
import autoSubmitHack from "../util/autoSubmitHack";
import FkSelectorModal from "./FkSelectorModal";
import toPath from "lodash.topath"

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

const INPUT = "Input";

const MODAL_STATE_CLOSED = {
    iQuery: null,
    columns: null,
    isOpen: false
};

function getOutputType(type)
{
    const end = type.length - INPUT.length;
    if (type.lastIndexOf(INPUT) === end)
    {
        return type.substr(0, end)
    }
    return type;
}


let fkSelectorCount = 0;

const FKSelector = fnObserver(props => {

    const formConfig = useFormConfig();

    const [modalState, setModalState] = useState(MODAL_STATE_CLOSED);

    const { display, query, modalTitle, targetField, onUpdate, fade } = props;

    // FIELD PROPS
    const { id, name, mode: modeFromProps, helpText, tooltip, label: labelFromProps, inputClass, labelClass, formGroupClass } = props;


    const getUpdateForEmbedded = (rowType, rowValue) => {

        // resolve type of FKSelector parent;
        const type = getOutputType(formConfig.type);

        const typeDef = config.inputSchema.getType(type);

        //console.log("TYPE-DEF", typeDef);
        const objectFields = typeDef.fields.filter(fd => unwrapType(fd.type).name === rowType);

        const fieldCount = objectFields.length;
        if (fieldCount > 1)
        {
            throw new Error("Ambiguous embedded fields in " + rowType + ": " + JSON.stringify(objectFields));
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

            const effectiveMode = modeFromProps || formConfig.options.mode;

            const ctx = {
                qualifiedName,
                path,
                fieldType,
                fieldId,
                label: effectiveLabel,
                mode: effectiveMode
            };

            //console.log("FK-CONTEXT", ctx);

            return ctx;
        },
        [ formConfig.type, name ]
    );

    const selectRow = row => {

        //console.log("selectRow", toJS(row));

        const formUpdate = {};
        const { qualifiedName } = fkContext;
        if (qualifiedName)
        {
            formUpdate[qualifiedName] = row && row[targetField];
        }

        if (!onUpdate)
        {
            Object.assign(formUpdate, getUpdateForEmbedded(modalState.iQuery.type, row));
        }

        //console.log("FORM UPDATE", toJS(formUpdate, { recurseEverything: true}), "onUpdate = ", onUpdate, "row = ", toJS(row));

        updateOuterForm(
            formConfig.root,
            formUpdate,
            onUpdate,
            row
        );
        autoSubmitHack(formConfig);
        setModalState(MODAL_STATE_CLOSED);
    };

    const toggle = useCallback(
        () => setModalState(toggleOpen),
        []
    );

    const { fieldId, fieldType, qualifiedName, path, label, mode } = fkContext;

    let fieldValue;
    if (display)
    {
        fieldValue = display(formConfig)
    }
    else
    {

        const errorMessages = formConfig.getErrors(qualifiedName);
        const scalarType = unwrapType(fieldType).name;


        fieldValue = formConfig.getValue(path, errorMessages);
        fieldValue = fieldValue !== null ? GlobalConfig.renderStatic(scalarType, fieldValue) : null;
    }

    return (
        <FormGroup
            formConfig={ formConfig }
            formGroupClass={ cx( "fk-selector", formGroupClass ) }

            fieldId={ fieldId }
            label={ label }
            helpText={ helpText }
            labelClass={ labelClass }
            mode={ mode }
        >
            <div className="input-group mb-3">
                <span
                    id={ fieldId }
                    className={
                        cx(
                            inputClass,
                            "fks-display form-control-plaintext border rounded pl-2"
                        )
                    }
                    title={
                        tooltip
                    }

                >
                    {
                        fieldValue !== null && fieldValue !== undefined && fieldValue !== "" ?
                            fieldValue :
                            GlobalConfig.none()
                    }
                </span>
                <span className="input-group-append">
                    <button
                        className="btn btn-secondary"
                        type="button"
                        title={ modalTitle }
                        disabled={ mode !== FieldMode.NORMAL }
                        aria-roledescription={ modalTitle }
                        onClick={
                            () =>
                                query.execute(
                                    query.defaultVars
                                ).then(result => {

                                    try
                                    {
                                        const iQuery = getFirstValue(result);
                                        if (getGenericType(iQuery._type) !== INTERACTIVE_QUERY)
                                        {
                                            throw new Error("Result is no interactive query object");
                                        }

                                        iQuery._query = query;

                                        const columns = iQuery.columnStates
                                            .filter(
                                                cs => cs.enabled && cs.name !== "id"
                                            )
                                            .map(
                                                cs => cs.name
                                            );

                                        //console.log("COLUMNS", columns);

                                        setModalState({
                                            iQuery,
                                            columns,
                                            isOpen: true
                                        });
                                        
                                    }
                                    catch (e)
                                    {
                                        console.error("ERROR", e);
                                    }
                                }
                            )
                        }
                    >
                        &hellip;
                    </button>
                </span>
                <FkSelectorModal
                    { ...modalState }
                    title={ modalTitle }
                    fieldType={ fieldType }
                    selectRow={ selectRow }
                    toggle={ toggle }
                    fade={ fade }
                />
            </div>
        </FormGroup>
    );

});

FKSelector.propTypes = {
    /**
     * Optional render function for the current value  ( formConfig => ReactElement ). Must be set if name is not set.
     */
    display: PropTypes.func,
    /**
     * iQuery GraphQL query to fetch the current list of target objects
     */
    query: PropTypes.instanceOf(GraphQLQuery).isRequired,

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
     * Name / path for the  calendar field value (e.g. "name", but also "foos.0.name"). Optional for this widget as it can
     * also operate just by updating embedded objects. If name is not set, display and label must be set.
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
    fade: PropTypes.bool

};

FKSelector.defaultProps = {
    targetField: "id",
    modalTitle: i18n("Select Target Object"),
    fade: true
};

export default FKSelector;

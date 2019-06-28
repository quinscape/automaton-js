import React, { useCallback, useState } from "react"
import cx from "classnames"
import PropTypes from "prop-types"
import { Field, FieldMode, FormGroup, GlobalConfig, unwrapType, useFormConfig } from "domainql-form"
import i18n from "../i18n";
import { action } from "mobx";

import { Container, Modal, ModalBody, ModalHeader, ButtonToolbar } from "reactstrap"
import GraphQLQuery from "../GraphQLQuery";
import { getFirstValue } from "../model/InteractiveQuery";
import config from "../config"

import { getGenericType, INTERACTIVE_QUERY } from "../domain";
import DataGrid from "./datagrid/IQueryGrid";
import autoSubmitHack from "../util/autoSubmitHack";
import { isNonNull } from "domainql-form/src/InputSchema";


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



const FKSelector = props => {

    const { display, query, modalTitle, targetField, onUpdate, ... fieldProps} = props;

    const formConfig = useFormConfig();

    const [ modalState, setModalState ] = useState(MODAL_STATE_CLOSED);

    const getUpdateForEmbedded = (rowType, rowValue) => {

        // resolve type of FKSelector parent;
        const type = getOutputType(formConfig.type);
        // if (rowType !== type)
        // {
        //     throw new Error("Type mismatch: formConfig = " + type + ", rowValue = " + rowType);
        // }

        const typeDef = config.inputSchema.getType(type);

        console.log("TYPE-DEF", typeDef);
        const objectFields = typeDef.fields.filter(fd => unwrapType(fd.type).name === rowType);

        const fieldCount = objectFields.length;
        if (fieldCount > 1)
        {
            throw new Error("Amiguous embbeded fields in " + rowType + ": " + JSON.stringify(objectFields));
        }

        if (fieldCount === 1)
        {
            return {
                [objectFields[0].name] : rowValue || {}
            }
        }
        
        return null;
    };


    const selectRow = row => {
        const qualifiedName = formConfig.getPath(fieldProps.name);


        const formUpdate = {
            [qualifiedName]: row && row[targetField],
            ... !onUpdate ? getUpdateForEmbedded(modalState.iQuery.type, row) : null
        };

        console.log("FORM UPDATE", formUpdate);

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



    return (
        <Field
            {... fieldProps}
        >
            {

                (formConfig, ctx) => {

                    const { fieldType, mode, fieldId, inputClass, tooltip, path, qualifiedName, placeholder } = ctx;

                    const errorMessages = formConfig.getErrors(qualifiedName);
                    const scalarType = unwrapType(fieldType).name;

                    let fieldValue = formConfig.getValue(path, errorMessages);
                    //const fieldValue = InputSchema.scalarToValue(scalarType, fieldValue);
                    if (display)
                    {
                        fieldValue = display(formConfig)
                    }
                    else
                    {
                        fieldValue = fieldValue !== null && GlobalConfig.renderStatic(scalarType, fieldValue);
                    }

                    console.log("MODAL-STATE", modalState);

                    return (
                        <FormGroup
                            { ... ctx }
                            formConfig={ formConfig }
                            errorMessages={ errorMessages }
                            formGroupClass={ cx("fk-selector", ctx.formGroupClass) }
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
                                        fieldValue !== null && fieldValue !== undefined && fieldValue !== "" ? fieldValue : GlobalConfig.none()
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
                                            () => query.execute(
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

                                                    const columns = iQuery.columnConfig.columnStates
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
                                                    })
                                                }
                                                catch(e)
                                                {
                                                    console.error("ERROR", e);
                                                }
                                            })
                                        }
                                    >
                                        &hellip;
                                    </button>
                                </span>
                                <Modal isOpen={ modalState.isOpen } toggle={ toggle } size="lg">
                                    <ModalHeader
                                        toggle={ toggle }
                                    >
                                        {
                                            modalTitle
                                        }
                                    </ModalHeader>
                                    <ModalBody>
                                        <Container fluid={ true }>
                                            {
                                                modalState.isOpen && (
                                                    <DataGrid
                                                        id="fk-selector-grid"
                                                        tableClassName="table-hover table-striped table-bordered table-sm table-responsive"
                                                        value={ modalState.iQuery }
                                                    >
                                                        <DataGrid.Column
                                                            heading={ "Action" }
                                                        >
                                                            {
                                                                row => (
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-secondary"
                                                                        onClick={ ev => selectRow(row) }
                                                                    >
                                                                        {
                                                                            i18n("Select")
                                                                        }
                                                                    </button>
                                                                )
                                                            }
                                                        </DataGrid.Column>
                                                        {
                                                            modalState.columns.map(
                                                                name => (
                                                                    <DataGrid.Column
                                                                        key={ name }
                                                                        name={ name }
                                                                        filter="containsIgnoreCase"
                                                                    />
                                                                )
                                                            )
                                                        }
                                                    </DataGrid>
                                                )
                                            }
                                            <ButtonToolbar>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    disabled={ isNonNull(fieldType) }
                                                    onClick={ ev => selectRow(null) }
                                                >
                                                    {
                                                        i18n("Select None")
                                                    }
                                                </button>

                                            </ButtonToolbar>
                                        </Container>
                                    </ModalBody>
                                </Modal>
                            </div>
                        </FormGroup>
                    );
                }
            }
        </Field>
    );

};

FKSelector.propTypes = {
    /**
     * Optional render function for the current value  ( formConfig => ReactElement )
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
     * Name / path for the  calendar field value (e.g. "name", but also "foos.0.name")
     */
    name: PropTypes.string.isRequired,

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
     * Label for the field.
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
    formGroupClass: PropTypes.string

};

FKSelector.defaultProps = {
    nonNull: false,
    targetField: "id",
    modalTitle: i18n("Select Target Object")
};

export default FKSelector;

import React, { useEffect, useRef, useState } from "react"
import { observer } from "mobx-react-lite";
import get from "lodash.get";
import toPath from "lodash.topath";
import {Addon, Field, FieldMode, FormGroup, useFormConfig} from "domainql-form";
import { join } from "./condition-layout";
import i18n from "../../i18n"
import { lookupType } from "../../util/type-utils";
import { Type } from "../../FilterDSL";
import cx from "classnames";
import SelectionTreeModal from "../treeselection/SelectionTreeModal";
import { createTreeRepresentationForInputSchema, createTreeRepresentationForInputSchemaByPath } from "../../util/inputSchemaUtilities";
import { setInObjectAtPathImmutable } from "../../util/mutateObject";


function getOperandsFromParent(conditionRoot, path)
{
    const p = toPath(path).slice(0,-2);
    p.push("operands");
    return get(conditionRoot, p);
}


const FieldSelect = observer((props) => {

    const {
        layoutId,
        rootType,
        conditionRoot,
        path,
        editorState,
        valueRenderer,
        schemaResolveFilterCallback
    } = props;

    const formConfig = useFormConfig();

    /**
     * Remember the previous field scalar type as state
     */
    const scalarTypeRef  = useRef(null);

    const { opts } = editorState;

    const [isModalOpen, setModalOpen] = useState(false);
    const [columnTreeObject, setColumnTreeObject] = useState({});

    useEffect(() => {
        setColumnTreeObject(createTreeRepresentationForInputSchema(rootType, {
            filterCallback: schemaResolveFilterCallback
        }));
    }, [rootType]);

    function expandDirectory(path) {
        const directoryContents = createTreeRepresentationForInputSchemaByPath(rootType, path, {
            filterCallback: schemaResolveFilterCallback
        });
        const result = {};
        if (setInObjectAtPathImmutable(columnTreeObject, path, directoryContents, result)) {
            setColumnTreeObject(result);
        }
    }

    function collapseDirectory(path) {
        const result = {};
        if (setInObjectAtPathImmutable(columnTreeObject, path, {}, result)) {
            setColumnTreeObject(result);
        }
    }

    const validatePath = (fieldContext, value) => {

        if (opts.allowFields.length)
        {
            return opts.allowFields.indexOf(value) < 0 ? i18n("ConditionEditor:Invalid Field") : null;
        }

        let typeDef;
        let isInvalid = false;
        try
        {
            typeDef = lookupType(opts.rootType, value);
        }
        catch(e)
        {
            isInvalid  = true;
        }

        if (!typeDef)
        {
            isInvalid = true;
        }

        return isInvalid ? i18n("ConditionEditor:Invalid Field") : null

    };

    const onInputChange = (ctx, value) => {

        const mismatched = submitValueChange(value);

        if (mismatched.length > 0) {
            formConfig.formContext.addError(
                formConfig.root,
                ctx.qualifiedName,
                i18n("ConditionEditor:Field Type Mismatch With {0}", mismatched.join(", ")),
                value
            )
        }
    }

    const submitValueChange = (value) => {
        const typeDef = lookupType(opts.rootType, value);
        const mismatched = [];

        if (scalarTypeRef.current !== typeDef.name)
        {
            scalarTypeRef.current = typeDef.name

            const pathArray = toPath(path);
            const index = +pathArray[pathArray.length - 1];

            if (isNaN(index))
            {
                throw new Error("Expected path to end in a operands.n with n being a number: " + path)
            }


            const operands = getOperandsFromParent(conditionRoot, path);
            if (operands)
            {
                const newOperands = [];
                let revalidate = false;
                for (let i = 0; i < operands.length; i++)
                {
                    const operand = operands[i];
                    if (operand.type === Type.FIELD)
                    {
                        const otherType = lookupType(opts.rootType, operand.name);
                        if (index !== i && typeDef.name !== otherType.name)
                        {
                            mismatched.push(operand.name);
                        }
                        newOperands.push(operand);
                    }
                    else if (operand.type === Type.VALUE)
                    {
                        if (typeDef.name !== operand.scalarType)
                        {
                            newOperands.push({
                                type: Type.VALUE,
                                scalarType: typeDef.name,
                                value: operand.value
                            });

                            revalidate = true;
                        }
                        else
                        {
                            newOperands.push(operand);
                        }
                    }
                    else if (operand.type === Type.VALUES)
                    {
                        if (typeDef.name !== operand.scalarType)
                        {
                            newOperands.push({
                                type: Type.VALUES,
                                scalarType: typeDef.name,
                                values: operand.values
                            });

                            revalidate = true;
                        }
                        else
                        {
                            newOperands.push(operand);
                        }
                    }
                }

                editorState.updateOperands(
                    path,
                    newOperands,
                    revalidate
                );
            }
        }

        return mismatched;
    }
    
    return (
        <span
            data-layout={ layoutId }
            className="field mr-2"
        >
            <Field
                type="String"
                labelClass="sr-only"
                label="Field name"
                name={ join(path, "name") }
                validate={ validatePath }
                onChange={ onInputChange }
                addons={ [ <Addon placement={ Addon.RIGHT }>
                    <button
                        type="button"
                        className="btn btn-light border"
                        onClick={() => {
                            setModalOpen(true);
                        }}
                    >
                        &hellip;
                    </button>
                </Addon> ]}
            >
                {
                    (formConfig, ctx) => {
                        const {
                            fieldId,
                            qualifiedName,
                            autoFocus,
                            inputClass,
                            tooltip,
                            placeholder,
                            handleChange,
                            handleKeyPress,
                            addons
                        } = ctx;

                        const errorMessages  = formConfig.getErrors(ctx.qualifiedName);
                        const haveErrors = errorMessages.length > 0;

                        const fieldValue = Field.getValue(formConfig, ctx, errorMessages);
                        const [selectedElement, setSelectedElement] = useState(fieldValue);

                        const onFieldSelectListModalSubmit = (element) => {
                            setSelectedElement(element);
                            // handleChange expects an event, but we need to call it here for the data to be written
                            // to the state, so we're faking the event's structure here
                            handleChange({
                                target: {
                                    value: element
                                }
                            });
                        }

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
                                                    haveErrors && "is-invalid"
                                                )
                                            }
                                            type="text"
                                            placeholder={ placeholder }
                                            title={ tooltip }
                                            value={
                                                typeof valueRenderer === "function" ?
                                                    valueRenderer(selectedElement) :
                                                    selectedElement
                                            }
                                            onKeyPress={ handleKeyPress }
                                            onChange={ (event) => {
                                                const value = event.target.value;
                                                setSelectedElement(value);
                                                handleChange(event);
                                            } }
                                            autoFocus={ autoFocus ? true : null }
                                        />,
                                        addons
                                    )
                                }
            
                                <SelectionTreeModal
                                    className="field-select-modal"
                                    modalHeader={i18n("ConditionEditor:Select Field")}
                                    toggle={() => setModalOpen(!isModalOpen)}
                                    isOpen={isModalOpen}
                                    valueRenderer={valueRenderer}
                                    singleSelect
                                    onSubmit={(elementName) => {
                                        if (elementName.length > 0) {
                                            onFieldSelectListModalSubmit(elementName[0]);
                                        } else {
                                            onFieldSelectListModalSubmit();
                                        }
                                    }}
                                    treeContent={columnTreeObject}
                                    onExpandDirectory={expandDirectory}
                                    onCollapseDirectory={collapseDirectory}
                                />
                            </FormGroup>
                        );
                    }
                }
            </Field>
        </span>
    );
});

export default FieldSelect;

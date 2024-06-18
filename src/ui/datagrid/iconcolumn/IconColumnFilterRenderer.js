import React, {useState, useEffect} from "react";

import {Addon, Field, FormGroup, Icon, unwrapType, InputSchema} from "domainql-form";
import i18n from "../../../i18n";
import TokenList from "../../token/TokenList";
import SelectionTreeModal from "../../treeselection/SelectionTreeModal";
import autoSubmitHack from "../../../util/autoSubmitHack";

const IconColumnFilterRenderer = (props) => {
    const {
        flagDataMap,
        type,
        children,
        ... fieldProps
    } = props;

    const selectionModalObject = Object.fromEntries(Array.from(flagDataMap.keys()).map((key) => [key, true]));

    const [isSelectionModalOpen, setSelectionModalOpen] = useState(false);
    const toggleSelectionModalOpen = () => {
        setSelectionModalOpen(!isSelectionModalOpen);
    }

    return (
        <Field
            {... fieldProps}
            type={"StringSet"}
            addons={ Addon.filterAddons(children)}
        >
            {
                (formConfig, fieldContext) => {
                    const { qualifiedName } = fieldContext;

                    const errorMessages = formConfig.getErrors(qualifiedName);
                    const haveErrors = errorMessages.length > 0;

                    const getSelectedObjects = () => {
                        let currentFieldValue;
                        const scalarType = unwrapType(fieldContext.fieldType).name;
                
                        currentFieldValue = Field.getValue(formConfig, fieldContext, errorMessages);
                        currentFieldValue = currentFieldValue !== null ? InputSchema.scalarToValue(scalarType, currentFieldValue) : "";
                
                        if (typeof currentFieldValue !== "string" || currentFieldValue === "") {
                            return [];
                        }
                        return currentFieldValue.split(" & ");
                    };
                
                    const [selectedObjects, setSelectedObjects] = useState(getSelectedObjects());
                
                    const fieldValue = Field.getValue(formConfig, fieldContext, errorMessages);
                    useEffect(
                        () => {
                            if (!haveErrors)
                            {
                                const currentFieldValue = getSelectedObjects();
                                if (currentFieldValue.sort().toString() !== selectedObjects.sort().toString())
                                {
                                    setSelectedObjects(currentFieldValue);
                                }
                            }
                        },
                        [fieldValue]
                    );

                    const setNewSelectedObjects = (newSelectedObjects) => {
                        setSelectedObjects(newSelectedObjects);

                        formConfig.handleChange(fieldContext, newSelectedObjects.join(" & "));
                        autoSubmitHack(formConfig);
                    }

                    const renderFlags = (value, showTextIfIconAvailable) => {
                        const flagData = flagDataMap.get(value);
                        if (value != null) {
                            const icon = flagData?.icon ? (
                                <Icon
                                    className={flagData.icon}
                                />
                            ) : "";
                            if (showTextIfIconAvailable) {
                                return (
                                    <span title={i18n(flagData.text)}>
                                        {
                                            icon
                                        }
                                        {
                                            flagData.text
                                        }
                                    </span>
                                );
                            } else {
                                return (
                                    <span title={i18n(flagData.text)}>
                                        {
                                            icon || flagData.text
                                        }
                                    </span>
                                );
                            }
                        } else {
                            return value;
                        }
                    }

                    const fieldElement = Addon.renderWithAddons(
                        <TokenList
                            tokens={selectedObjects}
                            isCompact
                            buttonRenderer={() => {
                                return (
                                    <Icon className="fa-edit mr-1"/>
                                )
                            }}
                            onEdit={() => {
                                console.log("modal opened");
                                setSelectionModalOpen(true);
                            }}
                            onChange={setNewSelectedObjects}
                            renderer={(value) => renderFlags(value, false)}
                        />
                    );

                    return (
                        <FormGroup
                            { ... fieldContext }
                            formConfig={ formConfig }
                            errorMessages={ errorMessages }
                        >
                            {
                                fieldElement
                            }
                            <SelectionTreeModal
                                className="icon-filter-modal"
                                modalHeader={i18n("Select Filter Items")}
                                toggle={toggleSelectionModalOpen}
                                isOpen={isSelectionModalOpen}
                                selected={selectedObjects}
                                onSubmit={setNewSelectedObjects}
                                treeContent={selectionModalObject}
                                valueRenderer={(value) => renderFlags (value, true)}
                                sorted
                            />
                        </FormGroup>
                    )
                }
            }
        </Field>
    );
}

export default IconColumnFilterRenderer;

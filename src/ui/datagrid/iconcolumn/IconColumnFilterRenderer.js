import React, {useState} from "react";

import {Addon, Field, FieldMode, FormGroup, Icon, unwrapType} from "domainql-form";
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

    const [selectedObjects, setSelectedObjects] = useState([]);

    return (
        <Field
            {... fieldProps}
            type={"StringSet"}
            addons={ Addon.filterAddons(children)}
        >
            {
                (formConfig, fieldContext) => {
                    const { fieldType, mode, fieldId, inputClass, tooltip, path, qualifiedName, placeholder, addons } = fieldContext;

                    const setNewSelectedObjects = (newSelectedObjects) => {
                        setSelectedObjects(newSelectedObjects);

                        formConfig.handleChange(fieldContext, newSelectedObjects);
                        autoSubmitHack(formConfig);
                    }

                    const renderFlags = (value, showTextIfIconAvailable) => {
                        const flagData = flagDataMap.get(value);
                        if (value != null) {
                            const icon = flagData.icon ? (
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

                    const errorMessages = formConfig.getErrors(qualifiedName);

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
                            />
                        </FormGroup>
                    )
                }
            }
        </Field>
    );
}

export default IconColumnFilterRenderer;

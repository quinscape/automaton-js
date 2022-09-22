import React from "react";

import {Addon, Field, FieldMode, FormGroup, Icon, unwrapType} from "domainql-form";
import i18n from "../../../i18n";
import cx from "classnames";
import TokenList from "../../token/TokenList";

const IconColumnFilterRenderer = (props) => {
    const {
        flagDataMap,
        type,
        children,
        ... fieldProps
    } = props;

    return (
        <Field
            {... fieldProps}
            type={type ?? "String"}
            addons={ Addon.filterAddons(children)}
        >
            {
                (formConfig, fieldContext) => {
                    const { fieldType, mode, fieldId, inputClass, tooltip, path, qualifiedName, placeholder, addons } = fieldContext;

                    const errorMessages = formConfig.getErrors(qualifiedName);
                    //TODO: onChange, onEdit
                    const fieldElement = Addon.renderWithAddons(
                        <TokenList
                            tokens={["fdsf", "fdsfdsf"]}
                            isCompact
                            buttonRenderer={() => {
                                return (
                                    <Icon className="fa-edit mr-1"/>
                                )
                            }}
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
                        </FormGroup>
                    )
                }
            }
        </Field>
    );
}

export default IconColumnFilterRenderer;

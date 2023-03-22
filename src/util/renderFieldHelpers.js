import { GlobalConfig, FormConfig } from "domainql-form"
import React from "react"

/**
 * Callback for renderFieldHelpers
 *
 * @callback renderFieldHelper
 * @param {FormConfig} formConfig   form config instance
 * @param {Object} fieldContext     field context
 * @param {String} value            Field value (unconverted)
 */

/**
 * Creates a custom field render function that invokes the original field renderer and then calls an array of helper
 * functions to provide the user with context dependent helper elements
 *
 * @param {Array<renderFieldHelper>} helpers    Array of render function ( (formConfig, fieldContext, value) => ... )
 * 
 * @return {React.ReactElement}
 */
export default function renderFieldHelpers(helpers) {
    return (formConfig, fieldContext) => {

        // use default FieldRendering
        const renderFn = GlobalConfig.getRenderFn(formConfig, fieldContext)
        return (
            <>
                {
                    renderFn(formConfig, fieldContext)
                }
                {
                    helpers.map((helper, idx) => {

                        const elem = document.getElementById(fieldContext.fieldId)

                        return (
                            <React.Fragment
                                key = { idx }
                            >
                                {
                                    helper({
                                        formConfig,
                                        fieldContext,
                                        value: elem && elem.value
                                    })
                                }
                                
                            </React.Fragment>
                        )
                    })
                }
            </>
        )
    }
}

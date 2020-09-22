import React, { useRef } from "react"
import PropTypes from "prop-types"
import cx from "classnames"
import { Icon } from "domainql-form";
import useAutomatonEnv from "../useAutomatonEnv";
import i18n from "../i18n";


function findFieldName(button)
{
    let formGroup = button.parentNode;

    while (formGroup && (!formGroup.classList || !formGroup.classList.contains("form-group")))
    {
        formGroup = formGroup.parentNode;
    }

    if (!formGroup)
    {
        throw new Error("Could not find .form-group around " + button);
    }
    const formControl = formGroup.querySelector(".form-control,.form-check-input,.form-control-plaintext");

    if (!formControl)
    {
        throw new Error("Could not find .form-control in " + formGroup);
    }

    return formControl.dataset.name || formControl.name;
}

/**
 * Addon button to invoke meta functionality to configure the current mask. Detects the surrounding field / process / view
 * and invokes a subprocess with those parameters.
 */
const FieldMetaButton = ({
         subProcess,
         icon="fa-cog",
         label = i18n("Configure Field"),
         mini = true,
         dialogOptions = null
    }) => {

    const ref = useRef(null)
    const env = useAutomatonEnv();

    return (
        <button
            ref={ ref }
            className="btn btn-light btn-sm border"
            aria-label={ label }
            onClick={ () => {

                const fieldName = findFieldName(ref.current);
                const { processName, state } = env;


                return env.process.runSubProcess(
                    subProcess,
                    {
                        processName,
                        state,
                        fieldName
                    },
                    dialogOptions
                )
            }}
        >
            <Icon className={ cx(icon, !mini && "mr-1") }/>
            {
                !mini && label
            }
        </button>
    );
};

FieldMetaButton.propTypes = {
    /**
     * Subprocess to call from the button. Will receive the input parameters "processName", "state", and "fieldName".
     */
    subProcess: PropTypes.string.isRequired,

    /**
     * Icon to use for the button. Default is fa-cog.
     */
    icon: PropTypes.string,

    /**
     * Text to use for the button. Default is `i18n("Configure Field")`
     */
    label: PropTypes.string,

    /**
     * If false, use label in button, otherwise just use aria-label
     */
    mini: PropTypes.bool,

    /**
     * Process dialog options for the invoked subprocess.
     */
    dialogOptions: PropTypes.object

}

export default FieldMetaButton;

import React, { useCallback } from "react"
import PropTypes from "prop-types"
import { useFormConfig } from "domainql-form"
import Icon from "./Icon";
import cx from "classnames"

import { observer as fnObserver } from "mobx-react-lite"
import useAutomatonEnv from "../useAutomatonEnv";

const Button = props => {

    const formConfig = useFormConfig();
    const env = useAutomatonEnv();

    const { className, name, icon, text, transition, disabled } = props;
    /**
     * Returns either the explicit context set as prop or the current form object model if present.
     *
     * @return {*} context
     */
    const getContext = () =>
    {
        const { context : contextFromProps } = props;
        // if no explicit context is set, use original form root (might be null)
        return contextFromProps !== undefined ? contextFromProps : formConfig.root && formConfig.root.model;
    };

    const onClick = ev => {


        // double check for safety
        if (isDisabled())
        {
            return;
        }

        const { action } = props;
        //console.log("BUTTON-CLICK", { action, transition, context, env })

        if (typeof action === "function")
        {
            action(getContext())
        }
        else
        {
            const entry = env.process.getTransition(transition);
            if (!entry)
            {
                throw new Error("No transition '" + transition + "' in " + env.process.name + "/" + env.process.currentState)
            }

            if (entry.discard)
            {
                formConfig.root && formConfig.root.reset();
            }
            else
            {
                const { formInstance } = formConfig;
                if (formInstance)
                {
                    formInstance.handleSubmit();
                }
            }

            try
            {
                const { process } = env;

                //console.log("TRANSITION", transition, process);
                // it's important to take context *after* we submit or reset it above
                process.transition(transition, getContext())
            }
            catch (e)
            {
                console.error(e);
            }
        }
    };

    const isDisabled = () =>
    {

        let isDisabled = false;

        if (typeof disabled === "function")
        {
            isDisabled = disabled(formConfig);
        }

        // if the `transition` prop is defined ..
        if (!isDisabled && transition)
        {
            const entry = env.process.getTransition(transition);
            if (!entry)
            {
                throw new Error("No transition '" + transition + "' in " + env.process.name + "/" + env.process.currentState)
            }

            // .. and we're not discarding and we have errors, then disable button
            isDisabled = !entry.discard && formConfig.hasErrors();
        }

        return isDisabled;
    };

        return (
            <button
                type="button"
                name={ name }
                className={ className }
                disabled={ isDisabled() }
                onClick={ onClick }
            >
                {
                    icon && (
                        <Icon
                            className={
                                cx(
                                    icon,
                                    "pr-1"
                                )
                            }
                        />
                    )
                }
                {
                    text
                }
            </button>
        )
};

Button.propTypes = {
    action: PropTypes.func,
    transition: PropTypes.string,
    className: PropTypes.string,
    icon: PropTypes.string,
    text: PropTypes.string
};

Button.defaultProps = {
    className: "btn btn-secondary",
    text: ""
};


export default fnObserver( Button )

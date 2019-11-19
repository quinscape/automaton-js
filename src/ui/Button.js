import React from "react"
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
        return contextFromProps !== undefined ? contextFromProps : formConfig.root;
    };

    const onClick = ev => {

        // double check for safety
        if (isDisabled(formConfig))
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

            if (formConfig.root)
            {
                if (!entry.discard)
                {
                    formConfig.ctx.submit();
                }
            }

            try
            {
                const { process } = env;

                //console.log("TRANSITION", transition, process);
                // it's important to take context *after* we submit or reset it above
                process.transition(transition, getContext(), name)
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
    /**
     * Transition reference. button must have either a `transition` or an `action` attribute.
     */
    transition: PropTypes.string,
    /**
     * Additional button classes
     */
    className: PropTypes.string,
    /**
     * Icon class for the button
     */
    icon: PropTypes.string,

    /**
     * Text for the button
     */
    text: PropTypes.string,
    /**
     * Additional function to check for disabled status. The default behavior is to disable the button if the button has
     * a transition which is not discarding and there are form errors.
     *
     * This check runs before that and can disable the button in any case.
     */
    disabled: PropTypes.func,
    /**
     * Explicitly sets the button context to the given object. If no context is given, the form base object of the surrounding
     * form is used.
     */
    context: PropTypes.any,
    /**
     * Optional action function, receives the context as argument
     */
    action: PropTypes.func
};

Button.defaultProps = {
    className: "btn btn-secondary",
    text: ""
};


export default fnObserver( Button )

import React from "react"
import withAutomatonEnv from "../withAutomatonEnv";
import { withFormConfig } from "domainql-form";
import PropTypes from "prop-types";
import Icon from "./Icon";
import cx from "classnames"

import { observer } from "mobx-react"


class Button extends React.Component {

    static propTypes = {
        action: PropTypes.func,
        transition: PropTypes.string,
        className: PropTypes.string,
        icon: PropTypes.string,
        text: PropTypes.string
    };

    static defaultProps = {
        className: "btn btn-secondary",
        text: ""
    };


    /**
     * Returns either the explicit context set as prop or the current form object model if present.
     *
     * @return {*} context
     */
    getContext()
    {
        const { context : contextFromProps, formConfig } = this.props;
        // if no explicit context is set, use original form root (might be null)
        return contextFromProps !== undefined ? contextFromProps : formConfig.root && formConfig.root.model;
    }

    onClick = ev => {
        const { action, transition, context : contextFromProps, env, formConfig } = this.props;

        // double check for safety
        if (this.isDisabled())
        {
            return;
        }


        //console.log("BUTTON-CLICK", { action, transition, context, env })

        if (typeof action === "function")
        {
            action(this.getContext())
        }
        else
        {
            const entry = this.getTransitionEntry();

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
                process.transition(transition, this.getContext())
            }
            catch (e)
            {
                console.error(e);
            }
        }
    };

    isDisabled()
    {
        const { transition, formConfig, disabled } = this.props;

        let isDisabled = false;

        if (typeof disabled === "function")
        {
            isDisabled = disabled(formConfig);
        }

        // if the `transition` prop is defined ..
        if (!isDisabled && transition)
        {
            const entry = this.getTransitionEntry();

            // .. and we're not discarding and we have errors, then disable button
            isDisabled = !entry.discard && formConfig.hasErrors();
        }

        return isDisabled;
    }

    getTransitionEntry()
    {
        const { env, transition } = this.props;
        const entry = env.process.getTransition(transition);
        if (!entry)
        {
            throw new Error("No transition '" + transition + "' in " + env.process.name + "/" + env.process.currentState)
        }
        return entry;
    }


    render()
    {
        const { className, name, icon, text } = this.props;

        return (
            <button
                type="button"
                name={ name }
                className={ className }
                disabled={ this.isDisabled() }
                onClick={ this.onClick }
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
    }


}


export default withAutomatonEnv(
    withFormConfig(
        observer(
            Button
        )
    )
)

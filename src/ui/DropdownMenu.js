import React, { useState } from "react"
import PropTypes from "prop-types"
import cx from "classnames";
import { Icon } from "domainql-form";

import {
    Dropdown,
    DropdownMenu as ReactStrapDropdownMenu,
    DropdownToggle
} from "reactstrap"

/**
 * Simplified Dropdown Menu component with a local open state handling.
 *
 * Simply wrap Buttons or DropdownItems in this component.
 */
const DropdownMenu = ({ text, title, inline, buttonClassName, children}) => {

    const [dropdownOpen,setDropdownOpen] = useState(false)
    const toggle = () => setDropdownOpen(prevState => !prevState)

    let dropdownText;
    if (text)
    {
        if (typeof text === "function")
        {
            dropdownText = text();
        }
        else
        {
            dropdownText = text;
        }
    }
    else
    {
        dropdownText = <Icon className="fas fa-ellipsis-v"/>;
    }

    return (
        <Dropdown isOpen={dropdownOpen} toggle={toggle} className={ !inline ? "float-right" : "inline" } size="lg">
            {
                <DropdownToggle className={ cx("btn mr-2", buttonClassName)} title={ title }>
                    {
                        // default className defined in DropdownToggle is btn-secondary
                        dropdownText
                    }
                </DropdownToggle>
            }
            <ReactStrapDropdownMenu end>
                {
                    children
                }
            </ReactStrapDropdownMenu>
        </Dropdown>
    )
}

DropdownMenu.propTypes = {

    /**
     * Optional text or render function to change the labeling of the dropdown button.
     * Default is a vertical ellipsis icon.
     */
    text: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func
    ]),

    /**
     * Optional title to change the tooltip of the dropdown button.
     */
    title: PropTypes.string,

    /**
     * Optional inline mode switch for the dropdown button to not be floated to the right.
     */
    inline: PropTypes.bool
}

export default DropdownMenu

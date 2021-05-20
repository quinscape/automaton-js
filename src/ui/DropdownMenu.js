import React, { useState } from "react"
import PropTypes from "prop-types"
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
const DropdownMenu = ({ text, children}) => {

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
        <Dropdown isOpen={dropdownOpen} toggle={toggle} className="float-right" size="lg">
            <DropdownToggle className="btn btn-primary mr-2">
                {
                    dropdownText
                }
            </DropdownToggle>

            <ReactStrapDropdownMenu right >
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
    ])
}

export default DropdownMenu

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
const DropdownMenu = ({ text, title, inline, children}) => {

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
                title ? (
                    <label className="btn-tooltip" title={title} aria-label={title}>
                        <DropdownToggle className="btn btn-primary mr-2">
                            {
                                dropdownText
                            }
                        </DropdownToggle>
                    </label>
                ) : (
                    <DropdownToggle className="btn btn-primary mr-2">
                        {
                            dropdownText
                        }
                    </DropdownToggle>
                )
            }
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

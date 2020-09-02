import React from "react"
import cx from "classnames"

import { GlobalConfig, Icon } from "domainql-form";
import uri from "../uri";
import PropTypes from "prop-types";
import AttachmentField from "./AttachmentField";


/**
 * Renders a link to an attachment
 */
const AttachmentLink = ({attachment, className, disabled = false}) => {

    return (
        attachment ? (
                <a
                    className={
                        cx(
                            "attachment-link btn btn-link",
                            className,
                            disabled && "disabled"
                        )
                    }
                    target="_blank" rel="noopener noreferrer"
                    href={
                        attachment.url ||
                        uri("/_auto/attachment/{id}", {
                            id: attachment.id
                        })
                    }
                    onClick={
                        ev => {
                            if (disabled)
                            {
                                ev.preventDefault();
                            }
                        }
                    }
                >
                    <Icon className="fa-paperclip mr-1 text-dark"/>
                    {
                        attachment.description
                    }
                </a>
            ) : (
            <span
                className={
                    cx(
                        "attachment-link btn btn-link disabled",
                        className
                    )
                }
            >
                {
                    GlobalConfig.none()
                }
            </span>
        )

    );
};

AttachmentLink.propTypes = {
    /**
     * An App_Attachment structure / observable 
     */
    attachment: PropTypes.object,

    /**
     * Additional HTML classes for the attachment link.
     */
    className: PropTypes.string,

    /**
     * True if the attachment link should be disabled
     */
    disabled: PropTypes.bool

}


export default AttachmentLink;

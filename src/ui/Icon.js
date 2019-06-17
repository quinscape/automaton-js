import React from "react"
import cx from "classnames"
import PropTypes from "prop-types"

/**
 * Simple FontAwesome Icon component
 */
const Icon = props =>  {

    const { className, brand, ... rest } = props;

    return (
        <i
            { ... rest }
            className={
                cx(
                    brand ? "fab" : "fas",
                    className
                )
            }
        />
    );
}

Icon.propTypes = {
    /**
     * Fontawesome icon as class name
     */
    className: PropTypes.string.isRequired,
    /**
     * Optional tooltip / title
     */
    title: PropTypes.string,
    /**
     * true if icon is a brand icon
     */
    brand: PropTypes.bool
};


export default Icon

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
    className: PropTypes.string.isRequired,
    title: PropTypes.string,
    brand: PropTypes.bool
};


export default Icon

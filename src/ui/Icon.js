import React from "react"
import cx from "classnames"
import PropTypes from "prop-types"

/**
 * Simple FontAwesome Icon component
 */
class Icon extends React.Component {

    static propTypes = {
        className: PropTypes.string.isRequired,
        title: PropTypes.string,
        brand: PropTypes.bool
    };

    render()
    {

        const { className, brand , ... rest} = this.props;

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
}

export default Icon

import React from "react"

import config from "../config"
import { Icon } from "domainql-form"
import PropTypes from "prop-types";

/**
 * A CSRF-protection-compliant Spring security log out-form
 */
function LogoutForm({userString})
{

    const { auth , contextPath, csrfToken } = config;

    const { login } = auth;

    const isAnonymous = login === "anonymous";

    const jsonTitle = __DEV ? auth.roles.join(", ") : null;

    return !isAnonymous ? 
        (
            <>
                <form method="POST" action={ contextPath + "/logout" } className="form-inline fa-pull-right">
                    { "Logged in as\u00a0" }
                    <span className="text-primary">

                        <Icon className="fa-id-card-alt" title={ jsonTitle }/>
                        { " " + (!userString ? login : (typeof userString === "function" ? userString() : userString)) }
                    </span>
                    :
                    <button type="submit" className="btn btn-link ">
                        Log out
                    </button>
                    <input type="hidden" name={ csrfToken.param } value={ csrfToken.value }/>
                </form>
            </>
        )
        :
        (
            <>
                <div className="fa-pull-right">
                    <a
                        className="btn btn-link"
                        href={ contextPath + "/login" }
                    >
                        Login...
                    </a>
                </div>
            </>
        )
}

LogoutForm.propTypes = {
    /**
     * optional template for displaying the username reading
     */
     userString: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func
    ])
}

export default LogoutForm

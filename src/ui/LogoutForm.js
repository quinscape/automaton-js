import React from "react"
import PropTypes from "prop-types"

import config from "../config"
import i18n from "../i18n";

import { Icon } from "domainql-form"

function defaultRenderUser()
{
    const { auth } = config;

    const { login } = auth;

    const devRoles = __DEV ? auth.roles.join(", ") + " ( id = '" + auth.id + "')" : null;

    return (
        <>
            {
                i18n("Logged in as ")
            }
            <span className="text-primary">
                <Icon className="fa-id-card-alt" title={ devRoles }/>
                {" " + login}
            </span>
            {
                ":"
            }
        </>
    );
}

/**
 * A CSRF-protection-compliant Spring security log out-form
 */
function LogoutForm({renderUser = defaultRenderUser })
{
    const { auth, contextPath, csrfToken} = config;
    const { login } = auth;

    const isAnonymous = login === "anonymous";

    if (!isAnonymous)
    {
        return (

            <form method="POST" action={contextPath + "/logout"} className="form-inline fa-pull-right logout-form">
                {
                    renderUser()
                }
                <button type="submit" className="btn btn-link ">
                    {
                        i18n("Log out")
                    }
                </button>
                <input type="hidden" name={ csrfToken.param } value={ csrfToken.value }/>
            </form>

        )
    }
    else
    {
        return (
            <div className="fa-pull-right">
                <a
                    className="btn btn-link"
                    href={contextPath + "/login"}
                >
                    Login...
                </a>
            </div>
        )
    }
}


LogoutForm.propTypes = {
    /**
     * Optional render function to render the part before the logout button.
     */
    renderUser: PropTypes.func
}

export default LogoutForm

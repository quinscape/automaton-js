import React from "react"

import config from "../config"
import { Icon } from "domainql-form"

/**
 * A CSRF-protection-compliant Spring security log out-form
 */
class LogoutForm extends React.Component {

    render()
    {
        const { auth , contextPath, csrfToken } = config;


        const { login } = auth;

        const isAnonymous = login === "anonymous";

        const jsonTitle = __DEV ? auth.roles.join(", ") : null;

        return (
            <React.Fragment>
                {
                    !isAnonymous ?
                    <form method="POST" action={ contextPath + "/logout" } className="form-inline fa-pull-right">
                        { "Logged in as\u00a0" }
                        <span className="text-primary">

                        <Icon className="fa-id-card-alt" title={ jsonTitle }/>
                            { " " + login }
                    </span>
                        :
                        <button type="submit" className="btn btn-link ">
                            Log out
                        </button>
                        <input type="hidden" name={ csrfToken.param } value={ csrfToken.value }/>
                    </form>
                    :
                    <div className="fa-pull-right">
                        <a
                            className="btn btn-link"
                            href={ contextPath + "/login" }
                        >
                            Login...
                        </a>
                    </div>
                }
            </React.Fragment>
        )
    }
}

export default LogoutForm

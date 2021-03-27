import React from "react"
import cx from "classnames"
import TOCLink from "./TOCLink";
import { useRouter } from "next/router";

const Layout = ({docs = null, sidebar = false, footer, children}) => {

    if (!docs)
    {
        throw new Error("Layout need docs prop");
    }

    const router = useRouter();

    const showSidebar = typeof sidebar === "function";

    return (
        <div className="container">
            <header>
                <nav className="navbar navbar-dark bg-primary">
                    <a className="navbar-brand text-white" href={ router.basePath + "/" }><i className="fab fa-quinscape"/> Automaton-Js Documentation</a>

                    <ul className="nav justify-content-end">
                        <li className="nav-item">
                            <a className="nav-link text-light" href={ router.basePath + "/component" }>Components / Hooks</a>
                        </li>
                        <li className="nav-item text-light">
                            <a className="nav-link text-light" href={ router.basePath + "/class" }>Classes</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link text-light" href={ router.basePath + "/misc" }>Utils / Functions</a>
                        </li>
                    </ul>
                </nav>
            </header>
            <main className="row">
                <div
                    className={
                        cx(
                            showSidebar ? "col-10" : "col"
                        )
                    }>
                    <div className="container">
                        {children}
                    </div>
                </div>
                <div className="col-2">
                    <div className="mt-5">
                    {
                        showSidebar && sidebar()
                    }
                    </div>
                </div>
            </main>
            <footer className="row">
                <div className="col">
                    <hr/>
                    {
                        typeof footer === "function" && footer()
                    }
                </div>
            </footer>
        </div>
    );
};

export default Layout;

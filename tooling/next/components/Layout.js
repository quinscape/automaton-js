import React from "react"
import cx from "classnames"
import TOCLink from "./TOCLink";
import { useRouter } from "next/router";

const Layout = ({sidebar = false, footer, children}) => {

    const router = useRouter();

    const showSidebar = typeof sidebar === "function";

    return (
        <div className="container">
            <header>
                <nav className="navbar navbar-dark bg-primary">
                    <a className="navbar-brand text-white" href={ router.basePath + "/" }><i className="fab fa-quinscape"/> Automaton-Js</a>

                    <ul className="nav justify-content-end">
                        <li className="nav-item">
                            <a className="nav-link btn-sm text-light" href={ router.basePath + "/declarative-api" }>Declarative</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link btn-sm text-light" href={ router.basePath + "/iquery" }>InteractiveQuery</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link btn-sm text-light" href={ router.basePath + "/domain" }>Domain-Objects</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link btn-sm text-light" href={ router.basePath + "/process" }>Process</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link btn-sm text-light" href={ router.basePath + "/component" }>Components</a>
                        </li>
                        <li className="nav-item text-light">
                            <a className="nav-link btn-sm text-light" href={ router.basePath + "/class" }>Classes</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link btn-sm text-light" href={ router.basePath + "/schema" }>Schema</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link btn-sm text-light" href={ router.basePath + "/config" }>Configuration</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link btn-sm text-light" href={ router.basePath + "/misc" }>Misc</a>
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
                {
                    showSidebar && (
                        <div className="col-2">
                            <div className="mt-5">
                                {
                                    sidebar()
                                }
                            </div>
                        </div>
                    )
                }
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

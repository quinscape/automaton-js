import React, { useEffect, useState } from "react"
import cx from "classnames"
import TOCLink from "./TOCLink";
import TOCSidebar from "./TOCSidebar";
import { useRouter } from "next/router";
import ReadingPosition, { ReadingPositionState } from "./ReadingPosition";

const Layout = ({sidebar = false, largeSidebar = false, footer, children}) => {

    const router = useRouter();
    const [intersectionContext, setIntersectionContext] = useState(null);

    useEffect(() => {
        setIntersectionContext(
            new ReadingPositionState(
                new IntersectionObserver(
                    (entries) =>
                    {
                        entries.forEach(
                            (entry) =>
                            {
                                const entryEl = entry.target;
                                const oldState = intersectionContext?.intersections[entryEl.id];
                                const ratio = entry.intersectionRatio;
                                if (oldState == null || oldState.ratio != ratio) {
                                    setIntersectionContext(
                                        intersectionContext => intersectionContext.withIntersection(entryEl, ratio)
                                    )
                                }
                            }
                        )
                    },
                    {
                        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
                    }
                )
            )
        );
    }, []);

    const showSidebar = typeof sidebar === "function";

    return (
        <div className="container">
            <header>
                <nav className="navbar navbar-dark bg-primary">
                    <a className="navbar-brand text-white" href={ router.basePath + "/" }><i className="fab fa-quinscape"/> Automaton-Js</a>

                </nav>
            </header>
            <ReadingPosition.Provider value={intersectionContext}>
                <main className="row">
                    <div
                        className={
                            cx(
                                showSidebar ? largeSidebar ? "col-9" : "col-10" : "col",
                                "mt-3"
                            )
                        }>
                        <div className="container">
                            {children}
                        </div>
                    </div>
                    {
                        showSidebar && (
                            <div className={ largeSidebar ? "col-3" : "col-2" }>
                                <div className="mt-5 sidebar">
                                    {
                                        sidebar()
                                    }
                                </div>
                            </div>
                        )
                    }
                </main>
            </ReadingPosition.Provider>
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
/*
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

 */

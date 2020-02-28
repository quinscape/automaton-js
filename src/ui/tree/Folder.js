import React, { useContext, useEffect, useMemo, useRef, useState } from "react"
import cx from "classnames"
import PropTypes from "prop-types"
import { getFirstValue } from "../../model/InteractiveQuery";
import i18n from "../../i18n";

import { nextSelectionId, TreeContext } from "./Tree";
import GraphQLQuery from "../../GraphQLQuery";
import TreeItem from "./TreeItem";
import MetaItem from "./MetaItem";
import CaretButton from "./CaretButton";


const LOADING = "LOADING";
/**
 * Renders an initially closed folder that quries additional children on demand.
 */
const Folder = ({render, query, variables, children}) => {

    const ref = useRef(null);

    const [open, setOpen] = useState(false);

    const [objects, setObjects] = useState(null);

    const selectionId = useMemo( nextSelectionId, []);

    const ctx = useContext( TreeContext );

    const toggle = ev => {
        if (!objects)
        {
            query.execute(variables).then(
                data => {
                    setObjects(
                        getFirstValue(data)
                    );
                    setOpen(!open);

                    if (ev === undefined && !ctx.selected)
                    {
                        ctx.selectFirst();
                    }
                }
            );
            setObjects(LOADING);
        }
        else
        {
            const newState = !open;
            if (!newState)
            {
                ctx.reselectHidden(ref.current, selectionId);
            }
            setOpen(open => !open);
        }
    };

    const isLoading = typeof objects === "string";

    if (!render)
    {
        // render invisible folder
        useEffect(
            () => {
                toggle();
            },
            [query]
        );

        return (
            <React.Fragment>
                {
                    isLoading && (
                        <li>
                            <div className="text-muted small">
                                {
                                    i18n("Loading")
                                }
                            </div>
                        </li>
                    )
                }
                {
                    !isLoading && objects && (
                        children(objects)
                    )
                }
            </React.Fragment>
        )
    }

    return (
        <TreeItem
            ref={ ref }
            selectionId={ selectionId }
        >
            <CaretButton
                open={open}
                onClick={toggle}
            />
            <div className="wrapper">
                <div className={ cx("header", selectionId === ctx.selected && "focus") }>

                    <button
                        type="button"
                        className={ cx("btn btn-link default", ctx.options.small && "btn-sm" ) }
                        tabIndex={-1}
                        onClick={toggle}
                    >
                        {
                            render()
                        }
                    </button>
                </div>
                {
                    <ul role="group">
                        {
                            isLoading && (
                                <MetaItem>
                                    {
                                        i18n("Loading")
                                    }
                                </MetaItem>
                            )
                        }
                        {
                            !isLoading && objects && open && (
                                children(objects)
                            )
                        }
                    </ul>
                }
            </div>
        </TreeItem>
    );
};

Folder.propTypes = {
    /**
     * Render prop that renders the folder header. If not given, an invisible folder is rendered that immediately executes
     * its query and renders the items received on the same level.
     *
     */
    render: PropTypes.func,

    /**
     * GraphQL query for this folder
     */
    query: PropTypes.instanceOf(GraphQLQuery).isRequired,

    /**
     * Query variables for the folder query.
     */
    variables: PropTypes.object,

    /**
     * The method expects a single function as children which receives the iQuery document result.
     */
    children: PropTypes.func
};

Folder.displayName = "Tree.Folder";

export default Folder

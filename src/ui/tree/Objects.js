import React, { useContext, useState } from "react"
import PropTypes from "prop-types"
import { observer as fnObserver } from "mobx-react-lite"
import InteractiveQuery, { getFirstValue } from "../../model/InteractiveQuery";
import i18n from "../../i18n";
import { toJS } from "mobx";
import ObjectItem from "./ObjectItem";
import { appendRows, TreeContext } from "./Tree";
import MetaItem from "./MetaItem";
import MoreItem from "./MoreItem";


/**
 * Embeds a list of objects at the current level.
 */
const Objects = fnObserver(({render, values, actions, children}) => {

    const [ dropDown, setDropDown ] = useState(-1);

    const ctx = useContext(TreeContext);

    const loadMore = wasSelected => {

        const { queryConfig, rowCount, _query : query } = values;

        const newConfig = {
            config: {
                ... queryConfig,
                offset: queryConfig.offset + queryConfig.pageSize
            }
        };

        //console.log("MORE", newConfig);

        query.execute(newConfig).then(data => {

            // The "more" link is currently focused and is about to be replaced
            // so we remember the list index of the current selected item.
            const selectionIndex = wasSelected && ctx.findSelectionIndex(ctx.selected);

            const newValues = getFirstValue(data);
            appendRows(values, newValues);

            if (wasSelected && selectionIndex >= 0)
            {
                // we reselect the previous item index, selecting the item that has replaced
                setTimeout(
                    () => ctx.selectByIndex(selectionIndex),
                    1   // just put it at the end of the current chain
                );
            }

        });

    };

    const { rows, rowCount } = values;

    return (
        <React.Fragment>
            {
                rows.length === 0 && (
                    <MetaItem>
                        {
                            i18n("No Results")
                        }
                    </MetaItem>
                )
            }
            {
                rows.map((row,idx) => (
                    <ObjectItem
                        key={ idx }
                        index={ idx }
                        render={ render }
                        actions={actions }
                        row={ row }
                        dropDown={ dropDown }
                        setDropDown={ setDropDown }
                        renderKid={ children }
                    />
                ))
            }
            {
                rows.length < rowCount && (
                    <MoreItem
                        onMore={ wasSelected => loadMore(wasSelected) }
                    />
                )
            }
        </React.Fragment>
    );
});

Objects.propTypes = {
    /**
     * Render function called once to render the item body for every row
     */
    render: PropTypes.func.isRequired,

    /**
     * Injected InteractiveQuery instance.
     */
    values: PropTypes.instanceOf(InteractiveQuery).isRequired,

    /**
     * Array of menu entries with label and action function. The first action is the default action that is also
     * executed on item click.
     */
    actions: PropTypes.arrayOf(
        PropTypes.shape({
            /** Label for the action */
            label: PropTypes.string.isRequired,
            /** Action function for the action */
            action: PropTypes.func.isRequired
        }).isRequired
    )
};

Objects.displayName = "Tree.Objects";

export default Objects

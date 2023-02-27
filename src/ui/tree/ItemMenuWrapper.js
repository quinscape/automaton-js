import React from "react";
import cx from "classnames";
import { Icon } from "domainql-form";
import { Popper } from "react-popper";
import ItemMenu from "./ItemMenu";
import { findParentLink } from "./Tree";
import i18n from "../../i18n";


const ItemMenuWrapper = ({
    ctx,
    selectionId,
    row,
    actions
}) => {
    const isSelected = selectionId === ctx.selected;
    const isMenuOpen = selectionId === ctx.menu;
    return (<>
        <button
            type="button"
            className={ cx("btn btn-secondary item-menu ml-1 sr-only sr-only-focusable", ctx.options.small && "btn-sm") }
            tabIndex={isSelected ? 0 : -1}
            aria-haspopup={ true }
            aria-expanded={ isMenuOpen }
            onClick={() => ctx.updateMenu(selectionId)}
            title={i18n("Tree:Open Contextmenu")}
        >
            <Icon className="fa-angle-right p-1"/>
        </button>
        {
            isMenuOpen && (
                <Popper
                    placement="bottom-start"
                    referenceElement={ ctx.menuElem }
                    modifiers={ ctx.options.popperModifiers }
                >
                    {({ref, style, placement, scheduleUpdate}) => (
                        <ItemMenu
                            ref={ ref }
                            style={ style }
                            data-placement={ placement }
                            scheduleUpdate={ scheduleUpdate }
                            close={ () => {
                                ctx.updateMenu(null);
                                const link = findParentLink(ctx.menuElem);
                                link && link.focus();
                            } }

                            row={ row }
                            actions={ actions }
                        />
                    )}
                </Popper>
            )
        }
    </>)
}

export default ItemMenuWrapper;

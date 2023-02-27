import { Icon } from "domainql-form";
import React from "react";
import i18n from "../../i18n";

const ICON_OPEN = <Icon className="fa-caret-down"/>;
const ICON_CLOSE = <Icon className="fa-caret-right"/>;


const CaretButton = ({open, onClick}) => (
    <button
        type="button"
        className="caret btn btn-link"
        aria-expanded={open}
        tabIndex={-1}
        onClick={onClick}
        title={open ? i18n("Collapse Treeitem") : i18n("Expand Treeitem")}
    >
        {
            open ? ICON_OPEN : ICON_CLOSE
        }
    </button>
);

export default CaretButton;

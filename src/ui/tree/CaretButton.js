import { Icon } from "domainql-form";
import React from "react";
import cx from "classnames";
import i18n from "../../i18n";

const ICON_OPEN = <Icon className="fa-caret-down"/>;
const ICON_CLOSE = <Icon className="fa-caret-right"/>;


const CaretButton = ({open, onClick, invisible}) => (
    <button
        type="button"
        className={cx("caret", "btn", "btn-link", invisible && "invisible")}
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

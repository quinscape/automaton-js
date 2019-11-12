import React from "react"
import cx from "classnames"
import PropTypes from "prop-types"
import { Icon } from "domainql-form";
import i18n from "../../i18n";
import WorkingSet, { WorkingSetStatus as StatusEnum} from "../../WorkingSet";
import { observer as fnObserver } from "mobx-react-lite"
import { toJS } from "mobx";

/**
 * Helper component to display a status icon with a tooltip for a data grid with working set.
 */
const WorkingSetStatus = fnObserver((props) => {

    const { currentObj, workingSet, iconClass, createdIcon, modifiedIcon, deletedIcon, createdTooltip, modifiedTooltip, deletedTooltip } = props;
    const entry = workingSet.lookup(currentObj._type, currentObj.id);

    //console.log("WorkingSetStatus", toJS(entry));

    if (entry)
    {
        if (entry.status === StatusEnum.NEW)
        {
            return (
                <Icon className={ cx(iconClass, createdIcon) } tooltip={ createdTooltip }/>
            )
        }
        else if (entry.status === StatusEnum.MODIFIED)
        {
            return (
                <Icon className={ cx(iconClass, modifiedIcon) } tooltip={ modifiedTooltip }/>
            )
        }
        else if (entry.status === StatusEnum.DELETED)
        {
            return (
                <Icon className={ cx(iconClass, deletedIcon) } tooltip={ deletedTooltip }/>
            )
        }
    }
    return false;
});

WorkingSetStatus.defaultProps = {
    iconClass: "m-2",
    createdIcon: "fa-asterisk",
    modifiedIcon: "fa-edit",
    deletedIcon: "fa-trash-alt",
    createdTooltip: i18n("WorkingSetStatus:Object created"),
    modifiedTooltip: i18n("WorkingSetStatus:Object modified"),
    deletedTooltip: i18n("WorkingSetStatus:Object deleted")
};


WorkingSetStatus.propTypes = {

    /**
     * Current data-grid row object
     */
    currentObj: PropTypes.object,

    /**
     * Working set
     */
    workingSet: PropTypes.instanceOf(WorkingSet),

    /**
     * Additional classes for all icons (default "m-2")
     */
    iconClass: PropTypes.string,

    /**
     * Icon to show for CREATED status  (default "fa-asterisk")
     */
    createdIcon: PropTypes.string,

    /**
     * Icon to show for MODIFIED status (default "fa-edit")
     */
    modifiedIcon: PropTypes.string,

    /**
     * Icon to show for DELETED status (default "fa-trash-alt")
     */
    deletedIcon: PropTypes.string,

    /**
     * Tooltip to display for the CREATED icon
     */
    createdTooltip: PropTypes.string,

    /**
     * Tooltip to display for the MODIFIED icon
     */
    modifiedTooltip: PropTypes.string,

    /**
     * Tooltip to display for the DELETED icon
     */
    deletedTooltip: PropTypes.string
};

WorkingSetStatus.displayName = "WorkingSetStatus";

export default WorkingSetStatus;

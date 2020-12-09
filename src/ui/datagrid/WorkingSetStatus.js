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

    const { currentObj, type : typeFromProps, id: idFromProps, workingSet, iconClass, createdIcon, modifiedIcon, deletedIcon, createdTooltip, modifiedTooltip, deletedTooltip } = props;

    let entityType;
    let entityId;

    if (currentObj)
    {
        entityType = currentObj._type;
        entityId = currentObj.id;

        if (!entityType)
        {
            throw new Error("WorkingSetStatus: No _type property on " + JSON.stringify(currentObj));
        }
        if (!entityId)
        {
            throw new Error("WorkingSetStatus: No id property on " + JSON.stringify(currentObj));
        }
    }
    else
    {
        entityType = typeFromProps;
        entityId = idFromProps;

        if (!entityType || !entityId)
        {
            throw new Error("WorkingSetStatus: You need to either set the currentObj prop or both type and id props");
        }
    }

    const entry = workingSet.lookup( entityType, entityId);

    //console.log("WorkingSetStatus", toJS(entry));

    if (entry)
    {
        if (entry.status === StatusEnum.NEW)
        {
            return (
                <Icon className={ cx(iconClass, createdIcon) } tooltip={ createdTooltip }/>
            )
        }
        else if (entry.status === StatusEnum.MODIFIED && workingSet.isModified(entityType, entityId))
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
     * Current data-grid row object. You should define either the currentObj prop or a pair of type and id prop.
     */
    currentObj: PropTypes.object,

    /**
     *  Type of the current object (alternative to defining the complete object via currentObj)
     */
    type: PropTypes.string,

    /**
     *  Id of the current object (alternative to defining the complete object via currentObj)
     */
    id: PropTypes.string,

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

import React from "react"
import PropTypes from "prop-types"
import cx from "classnames"
import mapIterator from "../util/mapIterator";
import { observer as fnObserver } from "mobx-react-lite"
import { Icon } from "domainql-form";
import { Badge } from "reactstrap";
import { Monitor } from "../message/monitor/useDomainMonitor";


const ICONS = {
    ACTIVE: "fa-edit",
    CHANGED: "fa-save",
    DELETED: "fa-eraser"
};


const DomainActivityIndicator = fnObserver(({domainType, id, version, monitor}) => {

    const activities = monitor.get(domainType, id, version);
    return (
        <div className="domain-activity-indicator">
            {
                mapIterator(activities, (a, type) => {
                    const {length} = a;

                    if (!length)
                    {
                        return false;
                    }

                    return (
                        <Badge
                            key={type}
                            color="info"
                            title={ a.map(a => a.user).join(", ") }
                        >
                            <Icon
                                className={ ICONS[type] }
                            />
                            {
                                length > 1 && (" x " + length)
                            }
                        </Badge>
                    );
                })
            }
        </div>
    );
});

DomainActivityIndicator.propTypes = {
    /**
     * Monitor object provided by useMonitor()
     */
    monitor: PropTypes.instanceOf(Monitor).isRequired,
    /**
     * Domain type of the entity to show activity for
     */
    domainType: PropTypes.string.isRequired,
    /**
     * Id of the entity to show activity for
     */
    id: PropTypes.any.isRequired,
    /**
     * Version of the entity if used together with merging. Prevents false-positive changes
     */
    version: PropTypes.string
};

export default DomainActivityIndicator;

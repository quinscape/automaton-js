import React, { useEffect, useMemo } from "react"
import { action, observable, toJS } from "mobx";
import subscribeToTopic from "../subscribeToTopic";

// keep in sync with src/main/java/de/quinscape/automaton/runtime/domain/DomainMonitorService.java in automaton
export const DOMAIN_MON_TOPIC = "DomainMon";


function getKey(domainType, id)
{
    return domainType + ":" + id;
}

// keep in sync with src/main/java/de/quinscape/automaton/model/domainmon/ActivityType.java
// in automaton
const INACTIVE = "INACTIVE";
const ACTIVE = "ACTIVE";
const CHANGED = "CHANGED";
const DELETED = "DELETED";

export class Monitor{

    @observable
    activities = new Map();

    @action
    add(activity)
    {
        const { domainType, id, type, connectionId } = activity;
        const key = getKey(domainType, id);

        const map = this.activities.get(key);

        if (!map)
        {
            if (type === INACTIVE)
            {
                return;
            }

            const newPerType = observable(new Map());
            newPerType.set(activity.type,[activity]);
            
            this.activities.set(
                key,
                newPerType
            );
        }
        else
        {
            if (type === INACTIVE)
            {
                const perType = map.get(ACTIVE);
                map.set(ACTIVE, perType.filter(a => a.connectionId !== connectionId));
            }
            else
            {
                let perType = map.get(activity.type);

                if (type === ACTIVE)
                {
                    perType = perType.filter(a => a.connectionId !== connectionId);
                }
                else if (type === CHANGED || type === DELETED)
                {
                    perType = perType.filter(a => a.type === CHANGED || a.type === DELETED);
                    
                }

                perType.push( activity );

                map.set(ACTIVE, perType);
            }
        }

        console.log("Added", toJS(this.activities))
    }

    get(domainType, id, version = null)
    {
        const activities = this.activities.get(getKey(domainType, id));
        if (!activities || !version)
        {
            return activities;
        }
        return activities.filter(a => !((a.type === CHANGED || a.type === DELETED) && a.version === version));
    }
}

/**
 * Convenience hook to use the domain monitor for a list of domain types. Returns an observable containing
 * the
 * @param {Object} filter       Filter expression. (see src/main/java/de/quinscape/automaton/model/domainmon/DomainActivity.java in automaton)
 * @param {Array<*>} [deps]     Dependency array for values inside the filter. E.g. if you have something like
 *                              `field("id").eq(value("String",id))` as filter, you need `[id]` as dependency array
 * @returns {[]|*[]}
 */
export default function useDomainMonitor(filter, deps = [])
{
    const monitor = useMemo(() => new Monitor(), deps);

    useEffect(
        () =>
            subscribeToTopic(
                DOMAIN_MON_TOPIC,
                activity => monitor.add(activity),
                filter
            ),
        deps
    );

    return monitor;
}

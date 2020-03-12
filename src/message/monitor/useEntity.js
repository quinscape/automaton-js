import { useEffect } from "react";
import publish from "../publish";
import config from "../../config";
import Hub from "../Hub";
import { DOMAIN_MON_TOPIC } from "./useDomainMonitor";


export default function useEntity(domainType, id, version = null)
{
    useEffect(
        () => {
            publish(
                DOMAIN_MON_TOPIC,
                {
                    domainType,
                    id,
                    connectionId: Hub.getConnectionId(),
                    user: config.auth.login,
                    type: "ACTIVE",
                    version
                }
            );

            return () => {
                publish(
                    DOMAIN_MON_TOPIC,
                    {
                        domainType,
                        id,
                        connectionId: Hub.getConnectionId(),
                        user: config.auth.login,
                        type: "INACTIVE",
                        version
                    }
                );

            }
        },
        [ domainType, id, version ]
    );

    return true;
}

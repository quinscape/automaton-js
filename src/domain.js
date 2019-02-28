import { WireFormat } from "domainql-form"
import config from "./config"
import matchPath from "./matchPath";

const domainClasses = {};

let wireFormat;


export function loadDomainDefinitions(ctx)
{
    const keys = ctx.keys();

    //console.log("Modules: ", keys);

    for (let i = 0; i < keys.length; i++)
    {
        const moduleName = keys[i];

        const { isDomain, shortName } = matchPath(moduleName);
        if (isDomain)
        {
            domainClasses[shortName] = ctx(moduleName).default;
        }
    }

    console.log("DOMAIN-CLASSES", domainClasses);

    wireFormat = new WireFormat(
        config.inputSchema,
        domainClasses
    );
}

export function getWireFormat()
{
    return wireFormat;
}

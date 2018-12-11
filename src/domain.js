import { WireFormat } from "domainql-form"
import config from "./config"

const domainClasses = {};

let wireFormat;

const DOMAIN_REGEX = /^\.\/domain\/(.*?)\.js$/

export function loadDomainDefinitions(ctx)
{
    const keys = ctx.keys();

    //console.log("Modules: ", keys);

    for (let i = 0; i < keys.length; i++)
    {
        const moduleName = keys[i];

        const m = DOMAIN_REGEX.exec(moduleName);
        if (m)
        {
            domainClasses[m[1]] = ctx(moduleName).default;
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

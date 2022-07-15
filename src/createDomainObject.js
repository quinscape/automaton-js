import config from "./config";
import { getWireFormat } from "./domain";
import { v4 } from "uuid";
import { observable } from "mobx";
import { getFields, unwrapNonNull } from "./util/type-utils";
import { LIST } from "domainql-form/lib/kind";
import { isPropertyWritable } from "domainql-form";

const DEFAULT_OPTIONS = {
    /**
     * if true, null all existing scalar fields and set an empty array to for list fields
     */
    nullFields: true
    
};

/**
 * Creates a new domain object with a new UUID.
 *
 * @category domain
 *
 * @param {String} type                 domain type name
 * @param {*} [id]                      id for the new object (default creates a new UUID)
 * @param {Object} [opts]               Options object
 * @param {boolean} [opts.nullFields]   if true, null all existing scalar fields and set an empty array to for list fields (default is true)
 * @return {object}  domain object
 */
export default function createDomainObject(type, id = v4(), opts )
{

    if (opts)
    {
        opts = {
            ... DEFAULT_OPTIONS,
            ... opts
        };
    }
    else
    {
        opts = DEFAULT_OPTIONS;
    }

    const typeRef = config.inputSchema.getType(type);

    if (typeRef === null)
    {
        throw new Error("Unknown type: " + type);
    }

    const DomainClass = getWireFormat().classes[type];

    let instance;
    if (!DomainClass)
    {
        instance = observable({
            _type: type,
            id
        });
    }
    else
    {
        instance = new DomainClass();
        instance._type = type;
        instance.id = id;
    }

    if (opts.nullFields)
    {
        const fields = getFields(typeRef);

        for (let i = 0; i < fields.length; i++)
        {
            const { name, type } = fields[i];

            if (name !== "id" && isPropertyWritable(instance, name))
            {
                if (unwrapNonNull(type).kind === LIST)
                {
                    instance[name] = [];
                }
                else
                {
                    instance[name] = null;
                }
            }
        }
    }

    return instance;
}

import config from "./config";
import { getWireFormat } from "./domain";
import uuid from "uuid";
import { observable } from "mobx";
import { getFields, unwrapNonNull } from "./util/type-utils";
import { LIST } from "domainql-form/lib/kind";


/**
 * Creates a new domain object with a new UUID.
 *
 * @param {String} type      domain type name
 * @param {*} [id]           id for the new object (default creates a new UUID)
 * @return {object}  domain object
 */
export default function createDomainObject(type, id = uuid.v4())
{
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

    const fields = getFields(typeRef);

    for (let i = 0; i < fields.length; i++)
    {
        const { name, type } = fields[i];

        if (name !== "id")
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

    return instance;
}

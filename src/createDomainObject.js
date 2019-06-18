import { getWireFormat } from "./domain";
import uuid from "uuid";


/**
 * Creates a new domain object with a new UUID.
 *
 * @param {String} type      domain type name
 * @return {object}  domain object
 */
export default function createDomainObject(type)
{
    const id = uuid.v4();

    const newObj = getWireFormat().classes[type];

    if (!newObj)
    {
        return {
            _type: type,
            id
        };
    }
    else
    {
        newObj._type = type;
        newObj.id = id;
    }
}

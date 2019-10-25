import { getWireFormat } from "./domain";
import uuid from "uuid";


/**
 * Creates a new domain object with a new UUID.
 *
 * @param {String} type      domain type name
 * @param {*} [id]           id for the new object (default creates a new UUID)
 * @return {object}  domain object
 */
export default function createDomainObject(type, id = uuid.v4())
{
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

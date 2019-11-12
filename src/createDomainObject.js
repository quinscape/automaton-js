import { getWireFormat } from "./domain";
import uuid from "uuid";
import { observable } from "mobx";


/**
 * Creates a new domain object with a new UUID.
 *
 * @param {String} type      domain type name
 * @param {*} [id]           id for the new object (default creates a new UUID)
 * @return {object}  domain object
 */
export default function createDomainObject(type, id = uuid.v4())
{
    const DomainClass = getWireFormat().classes[type];

    if (!DomainClass)
    {
        return observable({
            _type: type,
            id
        });
    }
    else
    {
        const newObj = new DomainClass();
        newObj._type = type;
        newObj.id = id;
        return newObj;
    }
}

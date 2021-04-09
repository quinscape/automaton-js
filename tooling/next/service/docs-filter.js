import { getRuleReference } from "./validateRule";
import Group from "./Group";


export function filterByCategory(name = null)
{
    return doc => {
        return doc.category === name;
    };
}


function filterCollectionByCategory(docs, category)
{
    return name => {
        return category === false || docs.docs[name].category === category;
    };
}


export function filterPageDefaults(pageDefaults, groups, category = false, markdowns = [])
{

    const { docs } = pageDefaults.props;


    const newDocs = {
        handwritten: docs.handwritten.filter(
            hw => {
                if (markdowns.indexOf(hw.src) >= 0)
                {
                    return true;
                }

                const ref = getRuleReference(hw);
                if (ref)
                {
                    const doc = docs.docs[ref];
                    if ((groups === false || groups.indexOf(doc.group) >= 0) && (category === false || doc.category === category))
                    {
                        return true;
                    }
                }
                return false;
            }
        ),
        docs: (function (docs) {
            const out = {};
            for (let name in docs)
            {
                if (docs.hasOwnProperty(name))
                {
                    const doc = docs[name];
                    if ((groups === false || groups.indexOf(doc.group) >= 0) && (category === false || doc.category === category))
                    {
                        out[name] = doc;
                    }
                }
            }
            return out;
        })(docs.docs)
    };

    if (groups === false || groups.indexOf(Group.COMPONENT) >= 0)
    {
        newDocs.components = docs.components.filter( filterCollectionByCategory(docs, category) );
    }

    if (groups === false || groups.indexOf(Group.HOOK) >= 0)
    {
        newDocs.hooks = docs.hooks.filter( filterCollectionByCategory(docs, category) );
    }

    if (groups === false || groups.indexOf(Group.CLASS) >= 0)
    {
        newDocs.classes = docs.classes.filter( filterCollectionByCategory(docs, category) );
    }

    if (groups === false || groups.indexOf(Group.UTIL) >= 0)
    {
        newDocs.utils = docs.utils.filter( filterCollectionByCategory(docs, category) );
    }

    if (groups === false || groups.indexOf(Group.FUNCTION) >= 0)
    {
        newDocs.functions = docs.functions.filter( filterCollectionByCategory(docs, category) );
    }
    //console.log("Filtered docs for " + groups, JSON.stringify(docs, null, 4))

    pageDefaults.props.docs = newDocs;

    return pageDefaults;
}


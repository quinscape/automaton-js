import config from "../config";
import { findNamed, getFields, isListType, isWrappedScalarType, unwrapAll } from "../util/type-utils";


const DEFAULT_TYPE_CONFIG = {
    mergeGroups: [],
    ignored: []
};

/**
 * Many to many relation tag used by automaton
 * @type {string}
 */
const MANY_TO_MANY = "ManyToMany"

export default class MergePlan {

    mergeConfig;

    infos = new Map();

    linkTypes = new Map();


    constructor(mergeConfig)
    {
        this.mergeConfig = mergeConfig;

        //console.log("mergeConfig", mergeConfig);
    }


    getInfo(typeName)
    {
        let plan = this.infos.get(typeName);
        if (!plan)
        {
            plan = this.createMergeInfo(typeName);
            this.infos.set(typeName, plan);
        }
        return plan;
    }


    createMergeInfo(typeName)
    {
        const typeDef = config.inputSchema.getType(typeName);

        if (!typeDef)
        {
            throw new Error("Could not find type '" + typeName + "'")
        }

        const idField = findNamed(getFields(typeDef), "id");
        if (!idField)
        {
            throw new Error(`Type '${typeName}' has no 'id' field.`)
        }
        const idType = unwrapAll(idField.type).name;
        const fieldDefs = getFields(typeDef);

        if (!fieldDefs)
        {
            throw new Error(`Could resolve fields for type '${name}' in schema: ` + JSON.stringify(typeDef));
        }

        const embedded = [];
        const scalarFields = [];

        const { mergeGroups } = findNamed(this.mergeConfig.typeConfigs, typeName) || DEFAULT_TYPE_CONFIG;


        const groupFields = [];
        const groupFieldNames = new Set();

        for (let i = 0; i < mergeGroups.length; i++)
        {
            const { fields } = mergeGroups[i];

            const out = [];


            for (let j = 0; j < fields.length; j++)
            {
                const name = fields[j];

                const fieldDef = findNamed(fieldDefs, name);
                if (!fieldDef)
                {
                    throw new Error(`Could not find merge-group field '${name}'`)
                }

                const { type } = fieldDef;

                if (!isWrappedScalarType(type))
                {
                    throw new Error(`Merge-group field '${name}' is not a scalar field: ${JSON.stringify(type)}`)
                }

                out.push({
                    type: unwrapAll(type).name,
                    name
                });

                groupFieldNames.add(name);
            }

            groupFields.push(out);
        }

        for (let i = 0; i < fieldDefs.length; i++)
        {
            const {name, type} = fieldDefs[i];

            if (isWrappedScalarType(type))
            {
                if (!groupFieldNames.has(name) && name !== config.mergeOptions.versionField)
                {
                    scalarFields.push({
                        type: unwrapAll(type).name,
                        name
                    })
                }
            }
            else
            {
                if (isListType(type))
                {
                    const linkTypeName = unwrapAll(type).name;

                    const leftSideRelation = config.inputSchema.getRelations().find(
                        r => r.sourceType === linkTypeName &&
                             r.targetType === typeName &&
                             r.metaTags.indexOf(MANY_TO_MANY) >= 0
                    );
                    const rightSideRelation = config.inputSchema.getRelations().find(
                        r => r.sourceType === linkTypeName &&
                             r.targetType !== typeName &&
                             r.leftSideObjectName &&
                             r.metaTags.indexOf(MANY_TO_MANY) >= 0
                    );

                    if (
                        leftSideRelation &&
                        rightSideRelation
                    )
                    {

                        embedded.push({
                            name,
                            isManyToMany: true,
                            linkTypeName,
                            leftSideRelation,
                            rightSideRelation
                        });

                        if (leftSideRelation.rightSideObjectName)
                        {
                            const linkType = {
                                fieldName: name,
                                targetType: typeName,
                                relation: leftSideRelation,
                            };

                            const array = this.linkTypes.get(linkTypeName);
                            if (!array)
                            {
                                this.linkTypes.set(linkTypeName, [linkType])
                            }
                            else
                            {
                                array.push(linkType);
                            }
                        }
                    }
                    else
                    {
                        embedded.push({
                            name,
                            isManyToMany: false
                        });
                    }
                }
            }
        }

        const info = {
            idType,
            embedded,
            groupFields,
            scalarFields
        };

        //console.log("MERGE-INFO for", typeName, JSON.stringify(info, null, 4));

        return info;

    }
}

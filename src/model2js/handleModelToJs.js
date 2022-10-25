import {modelToJsSchema} from "./schemaDeclaration"
import Ajv from "ajv";
import jsonMap from "json-source-map"
import {js as jsBeautify} from "js-beautify"
import {html as htmlBeautify} from  "js-beautify"
//var htmlBeautify = require('js-beautify').html;

const ajvInstance = new Ajv({allErrors: true, jsPropertySyntax: true});

export const modelSchemaValidation = (jsonData) => {
    const valid = ajvInstance.validate(modelToJsSchema, jsonData);
    if (!valid) {
        const sourceMap = jsonMap.stringify(jsonData, null, 2);
        const jsonLines = sourceMap.json.split('\n');
        ajvInstance.errors.forEach(error => {
            let errorMessage = '';
            errorMessage += ajvInstance.errorsText([error]);
            let errorPointer = sourceMap.pointers[error.dataPath];
            errorMessage = `\n> Line ${errorPointer.value.line + 1} ` + errorMessage;
            console.log("\x1b[41m", errorMessage, "\x1b[0m");
        });
    }
    return valid
}

export const renderCopyRights = (copyRights) => {
    let copyRightsStatement = ``;
    if (copyRights) {
        copyRightsStatement += `${copyRights}
`
    }
    return copyRightsStatement
}

export const renderImportStatements = (importDeclarations) => {
    let importStatements = "";

    importDeclarations.map((importDeclaration) => {
        const {specifiers, source} = importDeclaration

        importStatements += "import "

        specifiers.map((specifier, index, specifiers) => {
            const specifierType = specifiers[0].type
            const {type, name, aliasOf} = specifier

            if (type === "ImportDefaultSpecifier") {
                importStatements += name

                if (specifiers [1]) {
                    importStatements += ", {"
                }
            }

            if (type === "ImportSpecifier") {
                if (index === 0) {
                    importStatements += "{"
                }

                if ((index > 0 && specifierType === "ImportSpecifier") || (index > 1 && specifierType === "ImportDefaultSpecifier")) {
                    importStatements += ", "
                }

                if (aliasOf) {
                    importStatements += aliasOf + " as "
                }

                importStatements += name

                if (index === specifiers.length - 1) {
                    importStatements += "}"
                }
            }
        })
        importStatements += ` from "${source}" \n \n`
    })

    return importStatements;
}

export const renderExtraConstantsScript = (extraConstants) => {
    let extraConstantsScript = ''
    extraConstants.forEach(extraConstant => {
        extraConstantsScript += `${extraConstant}
    `
    })
    return extraConstantsScript;
}

export const renderQueryScript = (query) => {
    let queryScript = ''
    const {query: queryElement, variables} = query

    const commonCondition = (condition) => {
        const {type, name, operands} = condition

        queryScript += `
            "condition": {
                "type": "${type}",
                "name": "${name}",`
        if (operands && operands.length > 0) {
            queryScript += `
                "operands": [`

            operands.map(({type: typeOfOperands, name: nameOfOperands, id, condition: conditionOfOperands, scalarType, value}) => {

                queryScript += `
                    {`
                if (typeOfOperands) {
                    queryScript += `
                        "type": "${typeOfOperands}",`
                }
                if (id || id === null) {
                    queryScript += `
                        "id": ${id},`
                }
                if (scalarType) {
                    queryScript += `
                        "scalarType": "${scalarType}",`
                }
                if (value) {
                    queryScript += `
                        "value": ${value},`
                }
                if (nameOfOperands || nameOfOperands === null) {

                    nameOfOperands !== null ?
                        queryScript += `
                        "name": "${nameOfOperands}",`
                        :
                        queryScript += `
                        "name": ${nameOfOperands},`
                }
                if (conditionOfOperands) {
                    commonCondition(conditionOfOperands)
                }
                queryScript += `
                    },`
            })
            queryScript += `
            ]`
        }
        queryScript += `
            },`
    }

    queryScript += `
export default query(
    // language=GraphQL
        \` ${queryElement}\``

    if (variables != null) {
        const {configs, domainType, field, condition} = variables

        queryScript += `,
            {`

        if (configs) {
            configs.map ((config) => {
                const {name, pageSize, sortFields, condition } = config

                queryScript += `
            "${name}": {`

                if (condition) {
                    commonCondition(condition)
                }

                if (pageSize) {
                    queryScript += `
                    "pageSize": ${pageSize},`
                }

                if (sortFields) {
                    queryScript += `
                    "sortFields": ["${sortFields}"],`
                }

                queryScript += `
                },`
            })

        }
        if (domainType) {
            queryScript += `
                "domainType": "${domainType}",`
        }
        if (field) {
            queryScript += `
                "field": "${field}",`
        }
        if (condition) {
            commonCondition(condition)
        }

        queryScript += `
            }`
    }
    queryScript += `
        )`

    return queryScript
}

export const renderStateScript = (state) => {
    let stateScript = ''
    const {name, composite, transitionMap, filterFunctions} = state

    stateScript += `
    const ${name} = new ViewState("${name}", (process, scope) => {
    `

    if(filterFunctions){
        filterFunctions.forEach(filterFn => {
            const {name: nameOfFilterFunctions, filterParams, mapName} = filterFn
            if(mapName) {
                const getterName = `get${mapName[0].toUpperCase()}${mapName.slice(1)}()`
                stateScript += `const ${mapName} = ${getterName};
                `;
            }
            filterParams.map((filterParam) => {
                const {name, query, rootType, sourceName, modalTitle, valueFieldName} = filterParam
                stateScript += `
            ${nameOfFilterFunctions} (${name}, ${query}, ${rootType}, ${sourceName}, ${modalTitle}, ${valueFieldName});
    `
            })
        });
    }

    if (transitionMap) {
        let transitionScript = ''
        transitionScript += `return {
        `

        for (let transitionName in transitionMap) {
            if (transitionMap.hasOwnProperty(transitionName)) {

                const transition = transitionMap[transitionName];
                const {to, action, discard, confirmation} = transition;

                transitionScript += `
            "${transitionName}" : {`;

                if (to) {
                    transitionScript += `
                to: ${to},`
                }
                if (confirmation) {
                    const paramExpression = confirmation.params.length === 1 ? confirmation.params[0] : "(" + confirmation.params.join(
                        ", ") + ")";
                    transitionScript += `
                confirmation: ${paramExpression} => ${confirmation.code},`
                }
                if (discard) {
                    transitionScript += `
                discard: ${discard},`
                }

                if (action) {
                    const paramExpression = action.params.length === 1 ? action.params[0] : "(" + action.params.join(
                        ", ") + ")";
                    transitionScript += `
                action: ${paramExpression} => 
                    ${action.code},`
                }
                transitionScript += `},`;
            }

        }
        transitionScript += `
        }
    },`
        stateScript += `${jsBeautify(transitionScript)}`;
    }

    if (composite) {
        let compositeScript = '';
        const {constants, root} = composite

        const handleConstatnts = (constants) => {
            let constant = ``
            if (constants.length > 0) {
                constants.forEach(constantElement => {
                    const {kind, declarations} = constantElement
                    constant += `
        ${kind} `

                    declarations.forEach(({id, init}) => {

                        if (!id) {
                            constant += `{control, setControl} = ${init}`
                        } else {
                            if (id.type === 'Identifier') {
                                constant += `${id.name} = ${init}`
                            }
                            if (id.type === 'ObjectPattern') {
                                const {properties} = id
                                const map = Array.prototype.map
                                const keys = map.call(properties, function (item) {
                                    return item.key;
                                })
                                properties.length === 0 ? constant += `${keys} = ${init}` : constant += `{${keys}} = ${init}`
                            }
                            if (id.type === 'ListPattern') {
                                const {properties} = id
                                const map = Array.prototype.map
                                const keys = map.call(properties, function (item) {
                                    return item.key;
                                })
                                properties.length === 0 ? constant += `${keys} = ${init}` : constant += `[${keys}] = ${init}`
                            }
                            if (id.type === 'FunctionPattern') {
                                const {properties} = id
                                const map = Array.prototype.map
                                const keys = map.call(properties, function (item) {
                                    return item.key;
                                })
                                constant += `${keys} = ${init}`
                            }
                            if (id.type === 'ArrayPattern') {
                                const {elements} = id
                                const map = Array.prototype.map
                                const names = map.call(elements, function (item) {
                                    return item.name;
                                })
                                elements.length === 0 ? constant += `${names} = ${init}` : constant += `{${names}} = ${init}`
                            }
                        }
                    })

                });
            }
            return constant
        }

        const handleKidsofRoot = (kids) => {
            const commonAttrs = (attrs) => {
                if (attrs) {
                    attrs.map(({name, value}) => {

                        if (value != null) {

                            if (name == "renderedIf") {
                                return
                            }
                            if (value.code) {
                                compositeScript += ` ${name} = ${value.code}`
                            }
                            if (value.params) {
                                let paramsName = [];
                                value.params.map(({name: nameOfParams}) => {
                                    paramsName.push(nameOfParams)
                                    return (paramsName)
                                })

                                if (value.root.code) {
                                    paramsName = value.params.length === 1 ? `${paramsName} => ` : ` (${paramsName.join(', ')}) => (`

                                    compositeScript += ` ${name}={ ${paramsName} ${value.root.code}
                                        `
                                    if (value.params.length > 1) {
                                        compositeScript += `)`
                                    }
                                    compositeScript += `}`
                                }
                            
                                if (value.root.attrPath) {
                                    compositeScript += ` ${name} = {${paramsName}.${value.root.attrPath}} `
                                }

                                if (value.root.attrs) {
                                    const {name: nameOfRoot, attrs, kids} = value.root
                                    paramsName = value.params.length === 1 ? `${paramsName} => ` : ` (${paramsName.join(', ')}) => {`

                                    compositeScript += ` ${name}={ ${paramsName}`

                                    compositeScript += `
                                    return (
                                        <${nameOfRoot}`
                                    if (attrs && attrs.length > 0) {
                                        commonAttrs(attrs)
                                    }
                                    if (kids && kids.length > 0) {
                                        compositeScript += `>`
                                        handleKidsofRoot(kids)
                                        compositeScript += `
                                        </${nameOfRoot}>
                                        `
                                    } else {
                                        compositeScript += `/>
                                            `
                                    }
                                    compositeScript += `
                                        )`
                                    if (value.params.length > 1) {
                                        compositeScript += `}`
                                    }
                                    compositeScript += `}`
                                }

                            }
                        } else {
                            compositeScript += ` ${name} `
                        }
                    })
                }
            }
            const renderedIf = (attrs) => {
                if (attrs) {
                    attrs.map(({name, value}) => {
                        if (name === "renderedIf") {
                            compositeScript += `
                    {
                        ${value.code} && (
                `
                        }
                    })
                }
            }
            const endOfRenderedIf = (attrs) => {
                if (attrs) {
                    attrs.map(({name}) => {
                        if (name === "renderedIf") {
                            compositeScript += `
                            )
                    }
                            `
                        }
                    })
                }
            }
            const commonRoot = (nameOfRoot, attrsOfRoot, kidsOfRoot, code) => {
                if (nameOfRoot) {
                    compositeScript += `(
                    <${nameOfRoot}`
                    if (attrsOfRoot && attrsOfRoot.length > 0) {
                        commonAttrs(attrsOfRoot)
                    }
                    if (kidsOfRoot && kidsOfRoot.length > 0) {
                        compositeScript += `>`
                        handleKidsofRoot(kidsOfRoot)
                        compositeScript += `
                    </${nameOfRoot}>
                        )
                }`
                    } else {
                        compositeScript += `/>
                )
                }`
                    }
                } else if (code) {
                    compositeScript += `${code}
                    }`
                }
            }

            kids.map(({name, attrs, value, code, root, params, kids, html, condition}) => {

                if (root) {

                    compositeScript += `
                    {`

                    params.map(({name: nameOfParams}) => {
                        compositeScript += `
                    ${nameOfParams} => `
                    })

                    if (root.length >= 1) {
                        root.map(({name: nameOfRoot, attrs: attrsOfRoot, kids: kidsOfRoot, code}) => {

                            commonRoot(nameOfRoot, attrsOfRoot, kidsOfRoot, code)
                        })
                    } else {
                        const {name: nameOfRoot, attrs: attrsOfRoot, kids: kidsOfRoot, code} = root

                        commonRoot(nameOfRoot, attrsOfRoot, kidsOfRoot, code)
                    }
                }

                if (name) {
                    kids && kids.length >= 1 ? compositeScript += `
                ` : compositeScript += `
                    `
                    if (condition) {
                        compositeScript += `{${condition} && `
                    }

                    if (attrs && attrs.length >= 1) {
                        renderedIf(attrs)
                        compositeScript += `<${name}`
                        commonAttrs(attrs)
                        kids && kids.length >= 1 ? compositeScript += `>` : compositeScript += `/>`
                    } else {
                        compositeScript += `<${name}`
                        kids && kids.length >= 1 ? compositeScript += `>` : compositeScript += `/>`
                    }
                    if(condition){
                        compositeScript +=  ` }`
                    }
                }

                if (value) {
                    compositeScript += `
                    ${value}`
                }

                if (code) {
                    compositeScript += `
                    ${code}`
                }

                if (html) {

                    if (attrs && attrs.length >= 1) {

                        renderedIf(attrs)

                        compositeScript += `
                    <React.Fragment>
                        ${html}
                    </React.Fragment>`

                    } else {

                        compositeScript += `
                    ${html}`

                    }
                }

                if (kids && kids.length >= 1) {
                    handleKidsofRoot(kids)
                    compositeScript += `</${name}>`
                }

                if (attrs && attrs.length >= 1) {
                    endOfRenderedIf(attrs)
                }

                compositeScript += `
                `
            })

        }

        compositeScript += ` props => {
            ${handleConstatnts(constants)}
    
            return(
                <${root.name}>
                    `
        if (root.kids) {
            handleKidsofRoot(root.kids)
        }
        compositeScript += `
                </${root.name}>
                    )
                }`
        stateScript += `${htmlBeautify(compositeScript)}`;
    }

    stateScript += `);
    
    export default ${name};`

    return stateScript;
}

export const renderProcessExportScript = (processExports) => {
    let processScript = "";

    const {init, extraConstants, scope, configuration, startState} = processExports;

    if (extraConstants) {
        extraConstants.map((extraConstant) => {
            processScript += `${extraConstant}
    `
        })
    }
    //END the section of extraConstant

    processScript += `export function initProcess(process,scope) {`

    if (configuration && configuration.length >= 1) {
        configuration.map((config) => {
            processScript += `
            ${config}`
        })
    }

    if (startState !== null) {
        processScript += `
        return ${startState}`

    } else if (startState === null && init && init.length >= 1) {
        init.map((initValue) => {
            processScript += `
        ${initValue}`
        })
    }

    processScript += `
    }`

    //End the section of EXPORT AND STATES
    if (scope !== null) {
        const {name, observables, actions, computeds, helpers, constructorFunction} = scope
        processScript += `
export default class ${name} {
`;
        observables.map((observable) => {
            processScript += `
        @observable
        ${observable.name} = ${observable.defaultValue};
    `
        });

        if (constructorFunction != null) {
            const {params, code} = constructorFunction;
            const param = params.length === 1 ? params : params.join(', ')
            processScript += `
        constructor(${param}) {
            ${code}
        }
    `
        }

        actions.map((action) => {
            const {name, params, code, noAnnotation} = action
            const param = params.length === 1 ? params : params.join(', ')

            if (!noAnnotation) {
                processScript += `
        @action`
            }

            processScript += `
        ${name}(${param})
        {
            ${code}
        }
    `
        })

        if (helpers && helpers.length >= 1) {

            helpers.map((helper) => {
                const {name, defaultValue, code, params, actionAnnotation} = helper
                if (actionAnnotation) {
                    processScript +=`
                    @action`
                }
                if (params) {
                    params.length === 1 ? params : params.join(', ')
                }

                processScript += `  
            ${name} =`

                if (defaultValue) {

                    processScript += ` ${defaultValue}
                `
                }

                if (code && params) {

                    processScript += ` (${params}) => {
                    ${code}
                }
                `
                } else if (code) {
                    processScript += ` () => {
                        ${code}
                    }
                    `
                }
            })
        }

        if (computeds && computeds.length >= 1) {

            computeds.map((computed) => {
                const {name, code} = computed

                processScript += `
        @computed get ${name}()
        {
            ${code}
        }
    `
            })
        }
    }
    processScript += `}`;
    //END the section of SCOPE
    return jsBeautify(processScript);
}

export const renderUserScopeScript = (userScope) => {
    let userScopeScript = ''
    const {name, observables, actions, computeds, helpers, constructorFunction} = userScope

    userScopeScript += `
export class ${name}
 {
    `

    observables.forEach(observable => {
        const {name, defaultValue} = observable
        userScopeScript += `
    @observable ${name} = ${defaultValue};`
    })

    if (constructorFunction != null) {
        const {params, code} = constructorFunction;
        const param = params.length === 1 ? params : params.join(', ')
        userScopeScript += `
    constructor(${param}) {
        ${code}
    }
`
    }

    userScopeScript += `
 }`
    return userScopeScript
}

export const renderSessionScopeScript = (sessionScope) => {
    let sessionScopeScript = ''
    const {name, observables, actions, computeds, helpers, constructorFunction} = sessionScope

    sessionScopeScript += `
export class ${name}
 {
    `

    observables.forEach(observable => {
        const {name, defaultValue} = observable
        sessionScopeScript += `
    @observable ${name} = ${defaultValue};`
    })

    if (constructorFunction != null) {
        const {params, code} = constructorFunction;
        const param = params.length === 1 ? params : params.join(', ')
        sessionScopeScript += `
    constructor(${param}) {
        ${code}
    }
`
    }

    sessionScopeScript += `
 }`
    return sessionScopeScript
}

export const renderDomainScript = (domain) => {
    let domainScript = '';
    const {computeds, observables, name, constructorFunction} = domain
    domainScript += `
    export default class ${name} {
    `

    if (observables && observables.length >= 1) {
        observables.forEach(observable => {
            const {name} = observable
            domainScript += `
        @observable ${name}
        `
        })
    }

    if (computeds && computeds.length >= 1) {
        computeds.forEach(computed => {
            const {name, code} = computed
            domainScript += `
        @computed get ${name}()
        {
            ${code}
        }
        `
        })
    }

    if (constructorFunction != null) {
        const {params, code} = constructorFunction;
        const param = params.length === 1 ? params : params.join(', ')
        domainScript += `
    constructor(${param}) {
        ${code}
    }
`
    }

    domainScript += `
    }`
    return jsBeautify(domainScript)
}











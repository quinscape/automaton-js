import {modelToJsSchema} from "./schemaDeclaration"
import Ajv from "ajv";
import jsonMap from "json-source-map"
import {js as beautify} from "js-beautify"
const ajvInstance = new Ajv({allErrors: true,jsonPointers: true});

export const modelSchemaValidation =(jsonData)=>{
        const valid = ajvInstance.validate(modelToJsSchema, jsonData);
        if (!valid) {
            const sourceMap = jsonMap.stringify(jsonData, null, 2);
            const jsonLines = sourceMap.json.split('\n');
            ajvInstance.errors.forEach(error => {
                let errorMessage = '';
                errorMessage += ajvInstance.errorsText([ error ]);
                let errorPointer = sourceMap.pointers[error.dataPath];
                errorMessage = `\n> Line ${errorPointer.value.line +1} ` + errorMessage;
                console.log("\x1b[41m",errorMessage,"\x1b[0m");
            });
        }
        return valid
}

export const renderImportStatements = (importDeclarations) => {
    let importStatements = "";

    importDeclarations.map((importDeclaration) => {
        const {specifiers, source} = importDeclaration

        importStatements += "import "

        specifiers.map((specifier, index,specifiers) => {
            const specifierType = specifiers[0].type
            const {type, name, aliasOf} = specifier

            if (type === "ImportDefaultSpecifier") {
                importStatements += name

                if(specifiers [1]) {
                    importStatements += ", {"
                }
            }

            if (type === "ImportSpecifier" ) {
                if (index === 0) {
                    importStatements += "{"
                }

                if ((index > 0 && specifierType === "ImportSpecifier") || (index > 1 && specifierType === "ImportDefaultSpecifier") ) {
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
    return beautify(extraConstantsScript);
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
        \`${queryElement}\``

    if (variables != null) {
        const {config, domainType, field, condition} = variables

        queryScript += `,
            {`

        if (config) {
            const {pageSize, sortFields, condition} = config

            queryScript += `
            "config": {`

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

    return beautify(queryScript)
}

export const renderCompositeScript = (exportData,composite, shortName) => {
    let componentScript = "";
    let constant = ``
    const {constants, root} = composite
    const handleKidsofRoot = (kids) => {
        const commonAttrs = (attrs) => {
            if (attrs) {
                attrs.map(({ name, value }) => {

                    if (value != null) {
                        if(name === "renderedIf"){
                            return
                        }
                        if (value.code) {
                            componentScript += ` ${name}=${value.code}`
                        }
                        if (value.params) {
                            let paramsName = [];

                            value.params.map(({ name: nameOfParams }) => {
                                paramsName.push(nameOfParams)
                                return (paramsName)
                            })

                            paramsName = value.params.length === 0 ? `${paramsName} => ` : ` (${paramsName.join(', ')}) => (`

                            componentScript += ` ${name}={`
                            componentScript += `${paramsName} ${value.root.code}`
                            if (value.params.length >= 1) { componentScript += `)` }
                            componentScript += `}`
                        }


                    }
                    else {
                        componentScript += ` ${name} `
                    }
                })
            }
        }
        const renderedIf = (attrs) =>{
            if(attrs){
                attrs.map(({name,value})=>{
                    if(name === "renderedIf"){
                        componentScript +=`
                {
                    ${value.code} && (
            `
                    }
                })
            }
        }
        const endOfRenderedIf = (attrs) =>{
            if(attrs){
                attrs.map(({name})=>{
                    if(name === "renderedIf"){
                        componentScript +=`
                        )
                }
                        `
                    }
                })
            }
        }
        const commonRoot = (nameOfRoot, attrsOfRoot,kidsOfRoot, code) =>{
            if (nameOfRoot) {
                componentScript += `(
                <${nameOfRoot}`
                if (attrsOfRoot && attrsOfRoot.length > 0) {
                    commonAttrs(attrsOfRoot)
                }
                if (kidsOfRoot && kidsOfRoot.length > 0) {
                    componentScript += `>`
                    handleKidsofRoot(kidsOfRoot)
                    componentScript += `
                </${nameOfRoot}>
                    )
            }`
                } else {
                    componentScript += `/>
            )
            }`
                }
            }
            else if (code) {
                componentScript += `${code}
                }`
            }
        }

        kids.map(({ name, attrs, value, code, root, params, kids,html }) => {

            if ( root ) {

                componentScript += `
                {`

                params.map(({ name: nameOfParams }) => {
                    componentScript += `
                ${nameOfParams} => `
                })

                if ( root.length >=1 ){
                    root.map(({ name: nameOfRoot, attrs: attrsOfRoot, kids:kidsOfRoot, code })=>{

                        commonRoot(nameOfRoot, attrsOfRoot,kidsOfRoot, code)
                    })
                } else {
                    const { name: nameOfRoot, attrs: attrsOfRoot, kids:kidsOfRoot, code } = root

                    commonRoot(nameOfRoot, attrsOfRoot,kidsOfRoot, code)
                }
            }

            if (name) {
                kids && kids.length >= 1 ? componentScript += `
            ` : componentScript += `
                `
                if (attrs && attrs.length >= 1) {
                    renderedIf(attrs)
                    componentScript += `<${name}`
                    commonAttrs(attrs)
                    kids && kids.length >= 1 ? componentScript += `>` : componentScript += `/>`
                }
                else{
                    componentScript += `<${name}`
                    kids && kids.length >= 1 ? componentScript += `>` : componentScript += `/>`
                }
            }

            if (value) {
                componentScript += `
                ${value}`
            }

            if (code) {
                componentScript += `
                ${code}`
            }

            if(html){

                if (attrs && attrs.length >= 1) {

                    renderedIf(attrs)

                    componentScript +=`
                <React.Fragment>
                    ${html}
                </React.Fragment>`

                } else {

                    componentScript +=`
                ${html}`

                }
            }

            if (kids && kids.length >= 1) {
                handleKidsofRoot(kids)
                componentScript += `</${name}>`
            }

            if(attrs && attrs.length >=1){
                endOfRenderedIf(attrs)
            }

            componentScript += `
            `
        })

    }

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
                        const { properties } = id
                        const map = Array.prototype.map
                        const keys = map.call(properties, function (item) {
                            return item.key;
                        })
                        properties.length === 0 ? constant += `${keys} = ${init}` : constant += `[${keys}] = ${init}`
                    }
                    if (id.type === 'FunctionPattern') {
                        const { properties } = id
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
            return constant
        });

    }

    componentScript += `
    
    const ${shortName} = (props) => {
    ${constant}

return(
<${root.name}>
`;
    if (root.kids) {
        handleKidsofRoot(root.kids)
    }
        componentScript += `
</${root.name}>
)
};
`
    componentScript += `
export default ${exportData}`

    return componentScript;
}

export const renderStateScript = (state) => {
    let stateScript = ''
    const {name, composite, transitionMap} = state

    stateScript += `
    const ${name} = new ViewState(`

    if (name) {
        stateScript +=` "${name}", `
    }

    if (transitionMap) {
        stateScript +=`(process, scope) => ({`

        for (let transitionName in transitionMap) {
            if (transitionMap.hasOwnProperty(transitionName)) {

                const transition = transitionMap[transitionName];
                const {to, action, discard, confirmation} = transition;

                stateScript += `
            "${transitionName}" : {`;

                if (to) {
                    stateScript += `
                to: ${to},`
                }
                if (confirmation) {
                    const paramExpression = confirmation.params.length === 1 ? confirmation.params[0] : "(" + confirmation.params.join(
                        ", ") + ")";
                    stateScript += `
                confirmation: ${paramExpression} => ${confirmation.code},`
                }
                if (discard) {
                    stateScript += `
                discard: ${discard},`
                }

                if (action) {
                    const paramExpression = action.params.length === 1 ? action.params[0] : "(" + action.params.join(
                        ", ") + ")";
                    stateScript += `
                action: ${paramExpression} => 
                    ${action.code},`
                }
                stateScript += `
                },`;
            }

        }
        stateScript += `
    }),`
    }

    if (composite) {

        let constant = ``
        const {constants, root} = composite
        const handleKidsofRoot = (kids) => {
            const commonAttrs = (attrs) => {
                if (attrs) {
                    attrs.map(({ name, value }) => {

                        if (value != null) {
                            if(name === "renderedIf"){
                                return
                            }
                            if (value.code) {
                                stateScript += ` ${name}=${value.code}`
                            }
                            if (value.params) {
                                let paramsName = [];

                                value.params.map(({ name: nameOfParams }) => {
                                    paramsName.push(nameOfParams)
                                    return (paramsName)
                                })

                                paramsName = value.params.length === 0 ? `${paramsName} => ` : ` (${paramsName.join(', ')}) => (`

                                stateScript += ` ${name}={`
                                stateScript += `${paramsName} ${value.root.code}`
                                if (value.params.length >= 1) { stateScript += `)` }
                                stateScript += `}`
                            }


                        }
                        else {
                            stateScript += ` ${name} `
                        }
                    })
                }
            }
            const renderedIf = (attrs) =>{
                if(attrs){
                    attrs.map(({name,value})=>{
                        if(name === "renderedIf"){
                            stateScript +=`
                    {
                        ${value.code} && (
                `
                        }
                    })
                }
            }
            const endOfRenderedIf = (attrs) =>{
                if(attrs){
                    attrs.map(({name})=>{
                        if(name === "renderedIf"){
                            stateScript +=`
                            )
                    }
                            `
                        }
                    })
                }
            }
            const commonRoot = (nameOfRoot, attrsOfRoot,kidsOfRoot, code) =>{
                if (nameOfRoot) {
                    stateScript += `(
                    <${nameOfRoot}`
                    if (attrsOfRoot && attrsOfRoot.length > 0) {
                        commonAttrs(attrsOfRoot)
                    }
                    if (kidsOfRoot && kidsOfRoot.length > 0) {
                        stateScript += `>`
                        handleKidsofRoot(kidsOfRoot)
                        stateScript += `
                    </${nameOfRoot}>
                        )
                }`
                    } else {
                        stateScript += `/>
                )
                }`
                    }
                }
                else if (code) {
                    stateScript += `${code}
                    }`
                }
            }

            kids.map(({ name, attrs, value, code, root, params, kids,html }) => {

                if ( root ) {

                    stateScript += `
                    {`

                    params.map(({ name: nameOfParams }) => {
                        stateScript += `
                    ${nameOfParams} => `
                    })

                    if ( root.length >=1 ){
                        root.map(({ name: nameOfRoot, attrs: attrsOfRoot, kids:kidsOfRoot, code })=>{

                            commonRoot(nameOfRoot, attrsOfRoot,kidsOfRoot, code)
                        })
                    } else {
                        const { name: nameOfRoot, attrs: attrsOfRoot, kids:kidsOfRoot, code } = root

                        commonRoot(nameOfRoot, attrsOfRoot,kidsOfRoot, code)
                    }
                }

                if (name) {
                    kids && kids.length >= 1 ? stateScript += `
                ` : stateScript += `
                    `
                    if (attrs && attrs.length >= 1) {
                        renderedIf(attrs)
                        stateScript += `<${name}`
                        commonAttrs(attrs)
                        kids && kids.length >= 1 ? stateScript += `>` : stateScript += `/>`
                    }
                    else{
                        stateScript += `<${name}`
                        kids && kids.length >= 1 ? stateScript += `>` : stateScript += `/>`
                    }
                }

                if (value) {
                    stateScript += `
                    ${value}`
                }

                if (code) {
                    stateScript += `
                    ${code}`
                }

                if(html){

                    if (attrs && attrs.length >= 1) {

                        renderedIf(attrs)

                        stateScript +=`
                    <React.Fragment>
                        ${html}
                    </React.Fragment>`

                    } else {

                        stateScript +=`
                    ${html}`

                    }
                }

                if (kids && kids.length >= 1) {
                    handleKidsofRoot(kids)
                    stateScript += `</${name}>`
                }

                if(attrs && attrs.length >=1){
                    endOfRenderedIf(attrs)
                }

                stateScript += `
                `
            })

        }

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
                            const { properties } = id
                            const map = Array.prototype.map
                            const keys = map.call(properties, function (item) {
                                return item.key;
                            })
                            properties.length === 0 ? constant += `${keys} = ${init}` : constant += `[${keys}] = ${init}`
                        }
                        if (id.type === 'FunctionPattern') {
                            const { properties } = id
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
                return constant
            });

        }

        stateScript += ` props => {
                ${constant}
        
                return(
                    <${root.name}>
                    `
        if (root.kids){
            handleKidsofRoot(root.kids)
        }
        stateScript +=`
                    </${root.name}>
                        )
                    }`

    }

    stateScript +=`);
    
    export default ${name};`

    return stateScript;
}

export const renderProcessExportScript = (processExports) => {
    let processScript = "";

    const {init, extraConstants, scope ,configuration,startState} = processExports;

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
        init.map ((initValue) => {
            processScript += `
        ${initValue}`
        })
    }

    processScript +=`
    }`

    //End the section of EXPORT AND STATES
    if (scope !== null) {
        const { name, observables, actions, computeds, helpers } = scope
        processScript += `
export default class ${name} {
`;
        observables.map((observable) => {
            processScript += `
        @observable
        ${observable.name} = ${observable.defaultValue};
    `
        });

        actions.map((action) => {
            const params = action.params.length === 1 ? action.params : action.params.join(', ')
            processScript += `
        @action
        ${action.name}(${params})
        {
            ${action.code}
        }
    `
        })

        if(helpers && helpers.length >= 1){

            helpers.map((helper)=>{
                const {name, defaultValue, code, params} = helper
                if(params) { params.length === 1 ? params : params.join(', ') }

                processScript += `  
            ${name} =`

                if( defaultValue ){

                    processScript += ` ${defaultValue}
                `
                }

                if(code && params){

                    processScript += ` (${params}) => {
                    ${code}
                }
                `
                } else if(code) {
                    processScript += ` () => {
                        ${code}
                    }
                    `
                }
            })
        }

        if (computeds && computeds.length >= 1) {

            computeds.map((computed)=>{
                const { name, code } = computed

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
    return processScript;
}

export const renderUserScopeScript = (userScope) => {
    let userScopeScript = ''
    const {name, observables, actions, computeds, helpers} = userScope

    userScopeScript += `
export class ${name}
 {`

    observables.forEach(observable => {
        const {name, defaultValue} = observable
    userScopeScript += `
    @observable ${name} = ${defaultValue};`
    })

    userScopeScript +=`
 }`
    return userScopeScript
}

export const renderSessionScopeScript = (sessionScope) => {
    let sessionScopeScript = ''
    const { name, observables, actions, computeds, helpers } = sessionScope

    sessionScopeScript += `
export class ${name}
 {`

    observables.forEach(observable => {
        const { name, defaultValue } = observable
    sessionScopeScript += `
    @observable ${name} = ${defaultValue};`
    })

    sessionScopeScript += `
 }`
    return sessionScopeScript
}

export const renderDomainScript = (domain) => {
    let domainScript = '';
    const {computeds, observables, name} = domain
    domainScript += `
    export default class ${name} {`
    observables.forEach(observable => {
        const {name} = observable
        domainScript += `
        @observable ${name}
        `
    })
    if (computeds && computeds.length >= 1) {
        computeds.forEach(computed => {
            const {name, code} = computed
            domainScript += `
        @computed get ${name}()
        {
            ${code}
        }
    }`
        })
    }
    return beautify(domainScript)
}











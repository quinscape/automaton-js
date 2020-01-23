var beautify = require('js-beautify').js;

export const renderImportStatements = (importDeclarations) => {
    let importStatements = "";
    for (let declaration in importDeclarations) {
        if (importDeclarations.hasOwnProperty(declaration)) {
            const importDeclaration = importDeclarations[declaration];

            if (importDeclaration.type === "ImportDeclaration") {
                importStatements += "import "
            }
            for (let i = 0; i < importDeclaration.specifiers.length; i++) {
                let specifiers = importDeclaration.specifiers[i];
                let specifiersEnd = importDeclaration.specifiers.length - 1;
                let specifiersType = importDeclaration.specifiers[0].type;

                if (specifiers.type === "ImportDefaultSpecifier") {
                    importStatements += specifiers.name;
                    if (importDeclaration.specifiers[1]) {
                        importStatements += ",{"
                    }
                }

                if (i === 0 && specifiers.type === "ImportSpecifier") {
                    importStatements += "{"
                }
                if (i > 1 && specifiersType === "ImportDefaultSpecifier") {
                    importStatements += ", "
                }
                if (i > 0 && specifiersType !== "ImportDefaultSpecifier") {
                    importStatements += ", "
                }
                if (specifiers.aliasOf) {
                    importStatements += specifiers.aliasOf + " as "
                }

                if (specifiers.type === "ImportSpecifier") {
                    importStatements += specifiers.name
                }

                if (i === specifiersEnd && specifiers.type !== "ImportDefaultSpecifier") {
                    importStatements += "}"
                }
            }

            importStatements += ` from "${importDeclaration.source}"\n`
        }
    }

    return beautify(importStatements);
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
    computeds.forEach(computed => {
        const {name, code} = computed
        domainScript += `
        @computed get ${name}()
        {
            ${code}
        }
    }`
    })
    return beautify(domainScript)
}

export const renderExtraConstantsScript = (extraConstants) => {
    let extraConstantsScript = ''
    extraConstants.forEach(extraConstant => {
        extraConstantsScript += `${extraConstant}
    `
    })
    return beautify(extraConstantsScript);
}

export const renderCompositeScript = (composite, shortName) => {
    let componentScript = "";
    const {constants, root} = composite
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

    function handleKidsOfRoot() {
        const commonKid = (kids) => {
            const commonAttrs = (attrs) => {
                if (attrs) {
                    attrs.map(({ name, value }) => {

                        if (value != null) {
                            if(name=="renderedIf"){
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
                        if(name=="renderedIf"){
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
                        if(name=="renderedIf"){
                            componentScript +=`
                            )
                    }
                            `
                        }
                    })
                }
            }

            kids.map(({ name, attrs, value, code, root, params, kids }) => {

                if (root) {
                    const { name: nameOfRoot, attrs: attrsOfRoot, kids, code } = root
                    componentScript += `
                    {`
                    params.map(({ name: nameOfParams }) => {
                        componentScript += `
                    ${nameOfParams} => `
                    })
                    if (nameOfRoot) {
                        componentScript += `(
                        <${nameOfRoot}`
                        if (attrsOfRoot && attrsOfRoot.length > 0) {
                            commonAttrs(attrsOfRoot)
                        }
                        if (kids && kids.length > 0) {
                            componentScript += `>`
                            commonKid(kids)
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
                if (kids && kids.length >= 1) {
                    commonKid(kids)
                    componentScript += `</${name}>`
                }
                if(attrs && attrs.length >=1){
                    endOfRenderedIf(attrs)
                }
                componentScript += `
                `
            })

        }
        commonKid(root.kids)
    }

    componentScript += `
    
    const ${shortName} = (props) => {
    ${constant}

return(
<${root.name}>
`;
    handleKidsOfRoot()

    componentScript += `
</${root.name}>
)
};
`
    return componentScript;
}

export const renderProcessExportScript = (processExports) => {
    let processScript = "";

    const {extraConstants, process, scope} = processExports;
    if (extraConstants) {
        extraConstants.map((extraConstant) => {
            processScript += `${extraConstant}
    `
        })
    }
    ;
    //END the section of extraConstant

    processScript += `export function initProcess(process,scope)
    {
        ${'//code'}
        return (
            {
                startState:${process.startState},
                states: {
                    `;

    const {states} = process;

    for (let stateName in states) {
        if (states.hasOwnProperty(stateName)) {
            const transitionMap = states[stateName];

            processScript += `
        "${stateName}": {
        `

            for (let transitionName in transitionMap) {
                if (transitionMap.hasOwnProperty(transitionName)) {

                    const transition = transitionMap[transitionName];

                    processScript += `
        "${transitionName}" : {`;

                    const {to, action, discard} = transition;

                    if (to) {
                        processScript += `
                        to: "${to}",
                        `
                    }

                    if (action) {
                        const paramExpression = action.params.length === 1 ? action.params[0] : "(" + action.params.join(
                            ", ") + ")";
                        processScript += `action: ${paramExpression} => ${action.code},`
                    }

                    if (discard) {
                        processScript += `discard: ${discard},`
                    }
                }
                processScript += `},`;
            }
        }
        processScript += `},`;

    }
    processScript += `
         }})`;
    //End the section of EXPORT AND STATES
    if (scope !== null) {
        const {name, observables, actions, computeds, helpers} = scope
        processScript += `}
export default class ${name} {
`;
        observables.map((observable) => {
            processScript += `
        @observable
        ${observable.name} = ${observable.defaultValue};
    `
        });

        helpers.map((helper)=>{
            processScript += `  
        ${helper.name} = ${helper.defaultValue}
            `
        })

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
        // computeds.map((computed)=>{
        //     processScript += ``
        // })
    }
    processScript += `}`;
    //END the section of SCOPE
    return beautify(processScript);
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
        @observable ${name} = ${defaultValue}
    }`
    })
    return beautify(userScopeScript)
}

export const renderQueryScript = (query) => {
    let queryScript = ''
    const { query: queryElement, variables } = query
    queryScript += `
export default query(
    // language=GraphQL
        \`${queryElement}\``

    if (variables != null) {
        const { pageSize, sortFields } = variables.config
        queryScript += `,{
            "config": {
                pageSize: ${pageSize}`
        if(sortFields){
            queryScript +=`
                sortFields: ["${sortFields}"]`
        }
        queryScript +=`
            }
        }`
    }
    queryScript += `
    )`
    return queryScript
}










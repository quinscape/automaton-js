import {renderDomainScript, renderImportStatements, renderQueryScript,renderProcessExportScript,renderStateScript} from "../../src/model2js/handleModelToJs";
import assert from "power-assert"

const importDeclarationJson = require("./importDeclaration.json");
const stateJson = require("./state.json");
const queryJson = require("./query.json")
const domainJson = require("./domain.json")
const processExportJson = require("./processExport.json")

const {importDeclarations} = importDeclarationJson
const {state} = stateJson
const {query} = queryJson
const {domain} = domainJson
const {processExports} = processExportJson

describe("handle model to js", () => {

//import test code
    it("expect import specifier statement", () => {
        const result = renderImportStatements(importDeclarations)
        assert(result.includes("import {action, computed, observable, toJS} from \"mobx\""))
    });
    it("expect import default specifier statement", () => {
        const result = renderImportStatements(importDeclarations)
        assert(result.includes(`import React from "react"`))
    });
    it("expect import AliasOf statement", () => {
        const result = renderImportStatements(importDeclarations)
        assert(result.includes("import {IQueryGrid as DataGrid, observer as fnObserver} from \"mobx-react-lite\""))
    });

//domain test code
    it("expect domain statement", () => {
        const result = renderDomainScript(domain)
        assert(result.includes(
            `export default class Foo {

    @observable id

    @computed get code() {
        return this.name + ":" + this.num + ":" + this.type;
    }

    constructor() {
        makeObservable(this);
    }

}`))
    });

//State test code
    it("expect the start of state", () => {
        const result = renderStateScript(state)
        assert(result.includes(`
    const stateName = new ViewState("stateName", (process, scope) => {`))
    });

    it("expect end of State", () => {
        const result = renderStateScript(state)
        assert(result.includes(`);
    
    export default stateName;`))
    });

//filterFunctions part within State
    it("expect the filter functions", () => {
        const result = renderStateScript(state)
        assert(result.includes(`
            registerFKSelectorFilterAndRenderer ("FKSelectorAKZI", Q_AnlagenAppUser, "AAnlage", "anBenutzerId", "Auswahldialog: AKZI Nutzer *", "akzi");
    
            registerFKSelectorFilterAndRenderer ("FKSelectorFOO", Q_FooAppUser, "AFoo", "anBenutzerId", "Auswahldialog: FOO Nutzer *", "foo");
    
            registerFKSelectorFilterAndRenderer ("FKSelectorBAR", Q_Bar, "ABar", "anBenutzerId", "Auswahldialog: BAR Nutzer *", "bar");`))
    });

//transitionMap part within State
    it("expect the start of transitionMap", () => {
        const result = renderStateScript(state)
        assert(result.includes(`return {`))
    });

    it("expect a complete transitionMap process", () => {
        const result = renderStateScript(state)
        assert(result.includes(`
    "TransitionName": {
        to: Target,
        discard: true,
        action: t => {
            t.back(backToParent(t));
            t.isRecorded = false;
            /***zur vorherigen Maske zurückkehren***/

        },
    },`))
    });

    it("expect the end of transitionMap", () => {
        const result = renderStateScript(state)
        assert(result.includes(`
}
}, `))
    });

//composite part within State
    it("expect start of composite", () => {
        const result = renderStateScript(state)
        assert(result.includes(`props => {`))
    });

    it("expect start of main root", () => {
        const result = renderStateScript(state)
        assert(result.includes(`
 return(
 <root.name>`))
    });

    it("expect end of main root and composite", () => {
        const result = renderStateScript(state)
        assert(result.includes(`
 </root.name>
 )
 }`))
    });

    it("expect constants of type Identifier", () => {
        const result = renderStateScript(state)
        assert(result.includes(
            `const selectValues = ['Stammdaten', 'Störfall']`
        ))
    });

    it("expect constants of type ObjectPattern", () => {
        const result = renderStateScript(state)
        assert(result.includes(
            `const {scope} = props`
        ))
    });

    it("expect constants of type ListPattern", () => {
        const result = renderStateScript(state)
        assert(result.includes(
            `const [dropdownOpen,setDropdownOpen] = useState(false)`
        ))
    });

    it("expect constants of type FunctionPattern", () => {
        const result = renderStateScript(state)
        assert(result.includes(
            `const toggle = () => setDropdownOpen(prevState => !prevState)`
        ))
    });

    it("expect constants of type ArrayPattern", () => {
        const result = renderStateScript(state)
        assert(result.includes(
            `const {modalOpen,setModalOpen} = useState(false)`
        ))
    });

    it("expect start of root and Attribute of name renderedIf", () => {
        const result = renderStateScript(state)
        assert(result.includes(`
     {
     renderedIfCode && (
     <nameOfKid>
         <nameOfKid>
             valueOfKid
         </nameOfKid>
     </nameOfKid>
     )
     }`))
    });

    it("expect start of kid and attribute with params and root", () => {
        const result = renderStateScript(state)
        assert(result.includes(`
         <div rowClasses={ nameOfParamsOfAttrs=> "the code of roots from Attrs is here"
             }/>`))
    });

    it("expect kid of type JSXRenderFunction and root without kid", () => {
        const result = renderStateScript(state)
        assert(result.includes(`{
             nameOfParamsOfKid => (
             <rootNameOnly />
             )
             }`))
    });

    it("expect kid of type JSXRenderFunction and root with kid", () => {
        const result = renderStateScript(state)
        assert(result.includes(`{
             nameOfParamsOfKid => (
             <rootNameWithkKids>
                 <Button />

             </rootNameWithkKids>
             )
             }`))
    });

    it("expect kid with value key and type of JSXText", () => {
        const result = renderStateScript(state)
        assert(result.includes(`
             <CardHeader>
                 kid with only value key
             </CardHeader>`))
    });

    it("expect kid with only code key", () => {
        const result = renderStateScript(state)
        assert(result.includes(`

             {() => <React.Fragment>
                 <Col md="3">kid with only code key</Col>
             </React.Fragment>}`))
    });

//process export test code

    it("expect extra constant from process export", () => {
        const result = renderProcessExportScript(processExports)
        assert(result.includes(`// deconstruct FilterDSL methods
const {
    field,
    value,
    and,
    or,
    not
} = FilterDSL;
const auth = config.auth;
`
        ))
    });

    it("expect start state from process export", () => {
        const result = renderProcessExportScript(processExports)
        assert(result.includes(`
export function initProcess(process, scope) {
    let target, context;
    if (process.input.object) context = process.input.object;
    return Promise.resolve().then(() => {}).then(() => {
        return target;
    })
}
`
        ))
    });

    it("expect observable Scope from process export", () => {
        const result = renderProcessExportScript(processExports)
        assert(result.includes(`
export default class ProzessKatalogverwaltung {

    @observable
    ausgewaehlterKatalog = false;
`))
    });

    it("expect helpers Scope from process export", () => {
        const result = renderProcessExportScript(processExports)
        assert(result.includes(`

    decisionPuefeWelcherKatalogGeoeffnetWerdenSoll = (t, process) => {
        /***Implementierung Katalogverwaltung abgeschlossen***/
        return false;

    }
`))
    });

    it("expect helpers Scope from process export with action annotation", () => {
        const result = renderProcessExportScript(processExports)
        assert(result.includes(`

    @action
    decisionPuefeWelcherKatalogGeoeffnetWerdenSoll = () => {
        /***Implementierung Katalogverwaltung abgeschlossen***/
        return false;

    }
}`))
    });

    it("expect action Scope from process export", () => {
        const result = renderProcessExportScript(processExports)
        assert(result.includes(`
    @action
    updateAusgewaehlterKatalog(ausgewaehlterKatalog) {
        this.ausgewaehlterKatalog = ausgewaehlterKatalog;
    }
`))
    });

//query test code
    it("expect query element statement", () => {
        const result = renderQueryScript(query)
        assert(result.includes(         `
export default query(
    // language=GraphQL
        \` query Q_AppUser($config: QueryConfigInput!)
    {
        iQueryAppUser(config: $config)
        {
            columnStates{
                }
            queryConfig{
                }
            rows{
                }
    }\`,
            {
            "config": {
                    "pageSize": 20,
                },
            }
        )`))
    });

    it("expect query variable config", () => {
        const result = renderQueryScript(query)
        assert(result.includes(`,
            {
            "config": {
                    "pageSize": 20,
                },
            }
        )`))
    });

});
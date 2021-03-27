import { loadDocs } from "./service/docs.js";

loadDocs("").then(exports => {

    console.log(exports);
})

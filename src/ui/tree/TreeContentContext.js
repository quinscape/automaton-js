import { createContext } from "react";
import { action, makeObservable, observable } from "mobx";

export class TreeContentContextState {

    constructor()
    {
        makeObservable(this)
    }

    @observable
    rows = {};

    @observable
    folders = {};

    @action
    setRow(row, rowId) {
        if (rowId == null) {
            rowId = this.generateRowId(row);
        }
        console.group("update row");
        console.log("old rows", this.rows);
        this.rows = {
            ...this.rows,
            [rowId]: row
        };
        console.log("new rows", this.rows);
        console.groupEnd("update row");
    }

    @action
    setAllRows(rows) {
        if (Array.isArray(rows)) {
            for (const row of rows) {
                this.setRow(row);
            }
        } else {
            this.rows = {
                ...this.rows,
                ...rows
            };
        }
    }

    @action
    setFolderList(folderId, list) {
        this.folders = {
            ...this.folders,
            [folderId]: list
        }
    }

    generateRowId(row) {
        return `${row._type}:${row.id}`;
    }

}

const TreeContentContext = createContext(new TreeContentContextState());

export default TreeContentContext;

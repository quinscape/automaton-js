import { createDragDropManager } from 'dnd-core'
import { HTML5Backend } from "react-dnd-html5-backend"

export const DndManager = createDragDropManager(HTML5Backend);

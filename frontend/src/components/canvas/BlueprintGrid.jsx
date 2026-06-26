import { useEffect, useCallback, useState, useRef } from 'react';
import ReactFlow, {
  useNodesState, useEdgesState, Background, BackgroundVariant, Controls,
  ReactFlowProvider, useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useShapeStore } from '../../stores/shapeStore';
import { useSchemaStore } from '../../stores/schemaStore';
import ShapeNode from './ShapeNode';
import DraftNode from './DraftNode';

const nodeTypes = { shapeNode: ShapeNode, draftNode: DraftNode };

/* ─── Context menu ─────────────────────────────────────────── */
function ContextMenu({ menu, onClose, onAddShape, onModifica, onCopy, onCut, onPaste, onDelete, clipboardCount }) {
  if (!menu) return null;

  const isPane = menu.kind === 'pane';
  const isSingle = !isPane && menu.nodeIds.length === 1;

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50 min-w-[160px]"
      style={{ top: menu.sy, left: menu.sx }}
      onClick={(e) => e.stopPropagation()}
    >
      {isPane ? (
        <>
          <MenuItem onClick={() => { onAddShape(menu.flowPos); onClose(); }}>
            + Aggiungi forma qui
          </MenuItem>
          {clipboardCount > 0 && (
            <MenuItem onClick={() => { onPaste(menu.flowPos); onClose(); }}>
              Incolla ({clipboardCount})
            </MenuItem>
          )}
        </>
      ) : (
        <>
          {isSingle && (
            <>
              <MenuItem onClick={() => { onModifica(menu.nodeIds[0]); onClose(); }}>
                Modifica
              </MenuItem>
              <Divider />
            </>
          )}
          <MenuItem onClick={() => { onCopy(menu.nodeIds); onClose(); }}>
            Copia{menu.nodeIds.length > 1 ? ` (${menu.nodeIds.length})` : ''}
          </MenuItem>
          <MenuItem onClick={() => { onCut(menu.nodeIds); onClose(); }}>
            Taglia{menu.nodeIds.length > 1 ? ` (${menu.nodeIds.length})` : ''}
          </MenuItem>
          <Divider />
          <MenuItem danger onClick={() => { onDelete(menu.nodeIds); onClose(); }}>
            Elimina{menu.nodeIds.length > 1 ? ` (${menu.nodeIds.length})` : ''}
          </MenuItem>
        </>
      )}
    </div>
  );
}

function MenuItem({ children, onClick, danger }) {
  return (
    <button
      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${danger ? 'text-red-600' : 'text-gray-700'}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <hr className="my-1 border-gray-100" />;
}

/* ─── Inner component (needs ReactFlow context) ─────────────── */
function BlueprintGridInner({ addShapeTrigger }) {
  const { shapes, connections, fetchShapes, addConnection, updateShape, addShape, deleteShape } = useShapeStore();
  const { currentSchemaId } = useSchemaStore();
  const { screenToFlowPosition, getNode } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [menu, setMenu] = useState(null);
  const [clipboard, setClipboardState] = useState([]);

  const [editingShapeId, setEditingShapeId] = useState(null);
  const draftActiveRef = useRef(false);
  const draftCounterRef = useRef(0);
  const selectedNodeIdsRef = useRef([]);
  const clipboardRef = useRef([]);
  const shapesRef = useRef(shapes);
  const currentSchemaIdRef = useRef(currentSchemaId);

  useEffect(() => { shapesRef.current = shapes; }, [shapes]);
  useEffect(() => { currentSchemaIdRef.current = currentSchemaId; }, [currentSchemaId]);

  const updateClipboard = useCallback((items) => {
    clipboardRef.current = items;
    setClipboardState(items);
  }, []);

  /* ─── Draft node management ─────────────────────────────────── */

  const removeDraft = useCallback(() => {
    draftActiveRef.current = false;
    setEditingShapeId(null);
    setNodes(prev => prev.filter(n => !n.id.startsWith('__draft')));
  }, []);

  const removeDraftRef = useRef(removeDraft);
  useEffect(() => { removeDraftRef.current = removeDraft; }, [removeDraft]);

  const spawnDraft = useCallback((pos, initialData, shapeId) => {
    if (draftActiveRef.current) return;
    draftActiveRef.current = true;
    draftCounterRef.current += 1;
    const draftId = `__draft_${draftCounterRef.current}`;

    if (shapeId) setEditingShapeId(String(shapeId));

    const draftNode = {
      id: draftId,
      type: 'draftNode',
      position: pos,
      draggable: true,
      selectable: false,
      data: {
        initialData,
        isEditing: !!shapeId,
        onConfirm: async (formData) => {
          const currentPos = getNode(draftId)?.position ?? pos;
          removeDraftRef.current();
          if (shapeId) {
            await updateShape(shapeId, { ...formData, x: currentPos.x, y: currentPos.y });
          } else {
            await addShape({ ...formData, x: currentPos.x, y: currentPos.y, schemaId: currentSchemaIdRef.current });
          }
        },
        onCancel: () => removeDraftRef.current(),
      },
    };

    setNodes(prev => [...prev.filter(n => !n.id.startsWith('__draft')), draftNode]);
  }, [getNode, updateShape, addShape]);

  const spawnDraftRef = useRef(spawnDraft);
  useEffect(() => { spawnDraftRef.current = spawnDraft; }, [spawnDraft]);

  /* ─── Clipboard operations ──────────────────────────────────── */

  const handleCopy = useCallback((ids) => {
    const items = shapesRef.current.filter(s => ids.includes(String(s.id)));
    updateClipboard(items);
  }, [updateClipboard]);

  const handleDelete = useCallback((ids) => {
    const valid = ids.filter(id => !id.startsWith('__draft'));
    Promise.all(valid.map(id => deleteShape(id)));
  }, [deleteShape]);

  const handleCut = useCallback((ids) => {
    handleCopy(ids);
    handleDelete(ids);
  }, [handleCopy, handleDelete]);

  const handlePaste = useCallback(async (pastePos) => {
    const items = clipboardRef.current;
    if (!items.length) return;
    if (pastePos) {
      const minX = Math.min(...items.map(s => s.x));
      const minY = Math.min(...items.map(s => s.y));
      for (const s of items) {
        await addShape({ title: s.title, description: s.description, color: s.color, shape_type: s.shape_type, hyperlink: s.hyperlink, image_url: s.image_url, x: pastePos.x + (s.x - minX), y: pastePos.y + (s.y - minY), schemaId: currentSchemaIdRef.current });
      }
    } else {
      for (const s of items) {
        await addShape({ title: s.title, description: s.description, color: s.color, shape_type: s.shape_type, hyperlink: s.hyperlink, image_url: s.image_url, x: s.x + 30, y: s.y + 30, schemaId: currentSchemaIdRef.current });
      }
    }
  }, [addShape]);

  const handleModifica = useCallback((nodeId) => {
    const shape = shapesRef.current.find(s => String(s.id) === nodeId);
    if (shape) spawnDraftRef.current({ x: shape.x ?? 100, y: shape.y ?? 100 }, shape, shape.id);
  }, []);

  /* ─── Refs for keyboard handler (avoid stale closures) ──────── */
  const handleCopyRef = useRef(handleCopy);
  const handleCutRef = useRef(handleCut);
  const handlePasteRef = useRef(handlePaste);
  const handleDeleteRef = useRef(handleDelete);
  useEffect(() => { handleCopyRef.current = handleCopy; }, [handleCopy]);
  useEffect(() => { handleCutRef.current = handleCut; }, [handleCut]);
  useEffect(() => { handlePasteRef.current = handlePaste; }, [handlePaste]);
  useEffect(() => { handleDeleteRef.current = handleDelete; }, [handleDelete]);

  /* ─── Keyboard shortcuts (registered once) ───────────────────── */
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const meta = e.ctrlKey || e.metaKey;
      const ids = selectedNodeIdsRef.current;

      if ((e.key === 'Delete' || e.key === 'Backspace') && ids.length) {
        e.preventDefault();
        handleDeleteRef.current(ids);
      } else if (meta && e.key === 'c' && ids.length) {
        e.preventDefault();
        handleCopyRef.current(ids);
      } else if (meta && e.key === 'x' && ids.length) {
        e.preventDefault();
        handleCutRef.current(ids);
      } else if (meta && e.key === 'v') {
        e.preventDefault();
        handlePasteRef.current(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []); // stable — uses refs

  /* ─── Header button trigger ──────────────────────────────────── */
  const addShapeTriggerRef = useRef(addShapeTrigger);
  useEffect(() => {
    if (!addShapeTrigger) return;
    spawnDraftRef.current({ x: 60, y: 60 }, null, null);
  }, [addShapeTrigger]);

  /* ─── Sync shapes from store ─────────────────────────────────── */
  useEffect(() => {
    if (currentSchemaId) fetchShapes(currentSchemaId);
  }, [currentSchemaId]);

  useEffect(() => {
    setNodes(prev => {
      const draft = prev.find(n => n.id.startsWith('__draft'));
      const shapeNodes = shapes
        .filter(s => String(s.id) !== editingShapeId)
        .map(s => ({
          id: String(s.id),
          type: 'shapeNode',
          position: { x: s.x ?? 100, y: s.y ?? 100 },
          data: {
            ...s,
            onEdit: (nodeId) => {
              const shape = shapesRef.current.find(sh => String(sh.id) === nodeId);
              if (shape) spawnDraftRef.current({ x: shape.x ?? 100, y: shape.y ?? 100 }, shape, shape.id);
            },
          },
        }));
      return draft ? [...shapeNodes, draft] : shapeNodes;
    });
  }, [shapes, editingShapeId]);

  useEffect(() => {
    setEdges(connections.map(c => ({
      id: String(c.id),
      source: String(c.source_shape_id),
      target: String(c.target_shape_id),
      label: c.label,
    })));
  }, [connections]);

  /* ─── ReactFlow handlers ─────────────────────────────────────── */
  const onConnect = useCallback((params) => {
    addConnection(params.source, params.target, currentSchemaId);
  }, [addConnection, currentSchemaId]);

  const onNodeDragStop = useCallback((_, node) => {
    if (node.id.startsWith('__draft')) return;
    updateShape(node.id, { x: node.position.x, y: node.position.y });
  }, [updateShape]);

  const onSelectionChange = useCallback(({ nodes: sel }) => {
    selectedNodeIdsRef.current = sel
      .filter(n => !n.id.startsWith('__draft'))
      .map(n => n.id);
  }, []);

  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    setMenu({ kind: 'pane', sx: event.clientX, sy: event.clientY, flowPos });
  }, [screenToFlowPosition]);

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    if (node.id.startsWith('__draft')) return;
    const sel = selectedNodeIdsRef.current;
    const nodeIds = sel.includes(node.id) ? sel : [node.id];
    setMenu({ kind: 'node', sx: event.clientX, sy: event.clientY, nodeIds });
  }, []);

  const closeMenu = useCallback(() => setMenu(null), []);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menu]);

  /* ─── Render ─────────────────────────────────────────────────── */
  if (!currentSchemaId) {
    return <div className="p-8 text-gray-500">Seleziona uno schema per iniziare a disegnare</div>;
  }

  return (
    <div style={{ height: '70vh' }} className="bg-gray-50 relative">
      <ContextMenu
        menu={menu}
        onClose={closeMenu}
        onAddShape={(pos) => spawnDraft(pos, null, null)}
        onModifica={handleModifica}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onDelete={handleDelete}
        clipboardCount={clipboard.length}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={closeMenu}
        nodeTypes={nodeTypes}
        deleteKeyCode={null}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-white"
      >
        <Background variant={BackgroundVariant.Lines} gap={24} color="#e5e7eb" />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default function BlueprintGrid({ addShapeTrigger }) {
  return (
    <ReactFlowProvider>
      <BlueprintGridInner addShapeTrigger={addShapeTrigger} />
    </ReactFlowProvider>
  );
}

import { useEffect, useCallback, useState, useRef } from 'react';
import ReactFlow, {
  useNodesState, useEdgesState, Background, BackgroundVariant, Controls,
  ReactFlowProvider, useReactFlow, ConnectionMode, SelectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useShapeStore } from '../../stores/shapeStore';
import { useSchemaStore } from '../../stores/schemaStore';
import { useThemeStore } from '../../stores/themeStore';
import ShapeNode, { DEFAULT_SIZES } from './ShapeNode';
import DraftNode from './DraftNode';
import CommentNode, {
  COMMENT_TYPE, COMMENT_DEFAULT_COLOR, COMMENT_HEADER_H, COMMENT_PADDING, COMMENT_MIN, isComment,
} from './CommentNode';
import { nodeRect, contains, commentBoxFor } from './geometry';

const nodeTypes = { shapeNode: ShapeNode, draftNode: DraftNode, commentNode: CommentNode };

const OPPOSITE_HANDLE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

const isDraft = (id) => String(id).startsWith('__draft');

function ContextMenu({
  menu, onClose, onAddShape, onModifica, onCopy, onCut, onPaste, onDelete,
  onGroup, onSelectAll, clipboardCount,
}) {
  if (!menu) return null;

  const isPane = menu.kind === 'pane';
  const isSingle = !isPane && menu.nodeIds.length === 1;
  const count = isPane ? 0 : menu.nodeIds.length;

  return (
    <div
      className="menu fixed min-w-[180px]"
      style={{ top: menu.sy, left: menu.sx }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {isPane ? (
        <>
          <MenuItem onClick={() => { onAddShape(menu.flowPos, menu.connectFrom); onClose(); }}>
            {menu.connectFrom ? '+ Aggiungi forma e collega' : '+ Aggiungi forma qui'}
          </MenuItem>
          {clipboardCount > 0 && (
            <MenuItem onClick={() => { onPaste(menu.flowPos); onClose(); }}>
              Incolla ({clipboardCount})
            </MenuItem>
          )}
          <Divider />
          <MenuItem onClick={() => { onSelectAll(); onClose(); }}>
            Seleziona tutto <Hint>Ctrl+A</Hint>
          </MenuItem>
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
          <MenuItem onClick={() => { onGroup(menu.nodeIds); onClose(); }}>
            Racchiudi in un riquadro{count > 1 ? ` (${count})` : ''}
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { onCopy(menu.nodeIds); onClose(); }}>
            Copia{count > 1 ? ` (${count})` : ''} <Hint>Ctrl+C</Hint>
          </MenuItem>
          <MenuItem onClick={() => { onCut(menu.nodeIds); onClose(); }}>
            Taglia{count > 1 ? ` (${count})` : ''} <Hint>Ctrl+X</Hint>
          </MenuItem>
          <Divider />
          <MenuItem danger onClick={() => { onDelete(menu.nodeIds); onClose(); }}>
            Elimina{count > 1 ? ` (${count})` : ''} <Hint>Canc</Hint>
          </MenuItem>
        </>
      )}
    </div>
  );
}

function MenuItem({ children, onClick, danger }) {
  return (
    <button
      className={`menu-item flex items-center justify-between gap-6 ${danger ? 'menu-item-danger' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Hint({ children }) {
  return <span className="text-xs text-fg-subtle">{children}</span>;
}

function Divider() {
  return <div className="my-1.5 h-px bg-line" />;
}

function BlueprintGridInner({ addShapeTrigger }) {
  const { shapes, connections, fetchShapes, addConnection, updateShape, addShape, deleteShape } = useShapeStore();
  const loadingSchemaId = useShapeStore((s) => s.loadingSchemaId);
  const { currentSchemaId } = useSchemaStore();
  const theme = useThemeStore((s) => s.theme);
  const { screenToFlowPosition, getNode, getNodes, fitView } = useReactFlow();

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


  const removeDraft = useCallback(() => {
    draftActiveRef.current = false;
    setEditingShapeId(null);
    setNodes(prev => prev.filter(n => !n.id.startsWith('__draft')));
  }, []);

  const removeDraftRef = useRef(removeDraft);
  useEffect(() => { removeDraftRef.current = removeDraft; }, [removeDraft]);

  const spawnDraft = useCallback((pos, initialData, shapeId, connectFrom = null) => {
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
            const size = DEFAULT_SIZES[formData.shape_type] || DEFAULT_SIZES.rectangle;
            const created = await addShape({
              ...formData,
              x: currentPos.x, y: currentPos.y,
              width: size.w, height: size.h,
              schemaId: currentSchemaIdRef.current,
            });

            if (connectFrom && created?.id) {
              await addConnection(
                connectFrom.nodeId,
                String(created.id),
                currentSchemaIdRef.current,
                undefined,
                {
                  source_handle: connectFrom.handleId,
                  target_handle: OPPOSITE_HANDLE[connectFrom.handleId] ?? null,
                }
              );
            }
          }
        },
        onCancel: () => removeDraftRef.current(),
      },
    };

    setNodes(prev => [...prev.filter(n => !n.id.startsWith('__draft')), draftNode]);

    let attempts = 0;
    const frame = () => {
      const node = getNode(draftId);
      if (node?.width && node?.height) {
        fitView({
          nodes: [{ id: draftId }],
          padding: 0.25,
          duration: 400,
          maxZoom: 1,
        });
      } else if (attempts++ < 10) {
        setTimeout(frame, 30);
      }
    };
    setTimeout(frame, 0);
  }, [getNode, fitView, updateShape, addShape, addConnection]);

  const spawnDraftRef = useRef(spawnDraft);
  useEffect(() => { spawnDraftRef.current = spawnDraft; }, [spawnDraft]);


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

    const clone = (s, x, y) => ({
      title: s.title,
      description: s.description,
      color: s.color,
      text_color: s.text_color,
      shape_type: s.shape_type,
      hyperlink: s.hyperlink,
      image_url: s.image_url,
      width: s.width,
      height: s.height,
      x,
      y,
      schemaId: currentSchemaIdRef.current,
    });

    if (pastePos) {
      const minX = Math.min(...items.map(s => s.x));
      const minY = Math.min(...items.map(s => s.y));
      for (const s of items) {
        await addShape(clone(s, pastePos.x + (s.x - minX), pastePos.y + (s.y - minY)));
      }
    } else {
      for (const s of items) {
        await addShape(clone(s, s.x + 30, s.y + 30));
      }
    }
  }, [addShape]);

  const handleModifica = useCallback((nodeId) => {
    const shape = shapesRef.current.find(s => String(s.id) === nodeId);
    if (shape) spawnDraftRef.current({ x: shape.x ?? 100, y: shape.y ?? 100 }, shape, shape.id);
  }, []);

  const handleSelectAll = useCallback(() => {
    setNodes(nds => nds.map(n => (isDraft(n.id) ? n : { ...n, selected: true })));
  }, [setNodes]);

  const renameComment = useCallback((id, title) => {
    updateShape(id, { title });
  }, [updateShape]);

  const renameCommentRef = useRef(renameComment);
  useEffect(() => { renameCommentRef.current = renameComment; }, [renameComment]);

  const handleGroup = useCallback(async (ids) => {
    const targets = ids
      .map(id => getNode(id))
      .filter(n => n && !isDraft(n.id) && n.type !== 'commentNode');

    if (!targets.length) return;

    const box = commentBoxFor(targets.map(nodeRect), {
      padding: COMMENT_PADDING,
      headerHeight: COMMENT_HEADER_H,
      min: COMMENT_MIN,
    });

    await addShape({
      shape_type: COMMENT_TYPE,
      title: 'Commento',
      description: '',
      color: COMMENT_DEFAULT_COLOR,
      text_color: '#FFFFFF',
      hyperlink: '',
      image_url: '',
      ...box,
      schemaId: currentSchemaIdRef.current,
    });
  }, [getNode, addShape]);

  const handleCopyRef = useRef(handleCopy);
  const handleCutRef = useRef(handleCut);
  const handlePasteRef = useRef(handlePaste);
  const handleDeleteRef = useRef(handleDelete);
  const handleSelectAllRef = useRef(handleSelectAll);
  useEffect(() => { handleCopyRef.current = handleCopy; }, [handleCopy]);
  useEffect(() => { handleCutRef.current = handleCut; }, [handleCut]);
  useEffect(() => { handlePasteRef.current = handlePaste; }, [handlePaste]);
  useEffect(() => { handleDeleteRef.current = handleDelete; }, [handleDelete]);
  useEffect(() => { handleSelectAllRef.current = handleSelectAll; }, [handleSelectAll]);

  useEffect(() => {
    const onKey = (e) => {
      if (document.querySelector('[role="dialog"]')) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const meta = e.ctrlKey || e.metaKey;
      const ids = selectedNodeIdsRef.current;

      if (meta && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        handleSelectAllRef.current();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && ids.length) {
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
  }, []);

  const addShapeTriggerRef = useRef(addShapeTrigger);
  useEffect(() => {
    if (!addShapeTrigger) return;
    spawnDraftRef.current({ x: 60, y: 60 }, null, null);
  }, [addShapeTrigger]);

  useEffect(() => {
    if (currentSchemaId) fetchShapes(currentSchemaId);
  }, [currentSchemaId]);

  useEffect(() => {
    setNodes(prev => {
      const draft = prev.find(n => n.id.startsWith('__draft'));
      const selectedNow = new Set(prev.filter(n => n.selected).map(n => n.id));

      const shapeNodes = shapes
        .filter(s => String(s.id) !== editingShapeId)
        .map(s => {
          const id = String(s.id);
          const base = {
            id,
            position: { x: s.x ?? 100, y: s.y ?? 100 },
            selected: selectedNow.has(id),
          };

          if (isComment(s)) {
            return {
              ...base,
              type: 'commentNode',
              zIndex: 0,
              dragHandle: '.comment-drag-handle',
              style: { width: s.width ?? 360, height: s.height ?? 220 },
              data: { ...s, onRename: renameCommentRef.current },
            };
          }

          const fallback = DEFAULT_SIZES[s.shape_type] || DEFAULT_SIZES.rectangle;
          return {
            ...base,
            type: 'shapeNode',
            zIndex: 1,
            style: { width: s.width ?? fallback.w, height: s.height ?? fallback.h },
            data: {
              ...s,
              onEdit: (nodeId) => {
                const shape = shapesRef.current.find(sh => String(sh.id) === nodeId);
                if (shape) spawnDraftRef.current({ x: shape.x ?? 100, y: shape.y ?? 100 }, shape, shape.id);
              },
            },
          };
        });

      return draft ? [...shapeNodes, draft] : shapeNodes;
    });
  }, [shapes, editingShapeId]);

  useEffect(() => {
    setEdges(connections.map(c => ({
      id: String(c.id),
      source: String(c.source_shape_id),
      target: String(c.target_shape_id),
      sourceHandle: c.source_handle ?? null,
      targetHandle: c.target_handle ?? null,
      label: c.label,
    })));
  }, [connections]);

  const onConnect = useCallback((params) => {
    addConnection(
      params.source,
      params.target,
      currentSchemaId,
      undefined,
      { source_handle: params.sourceHandle, target_handle: params.targetHandle }
    );
  }, [addConnection, currentSchemaId]);

  const connectStartRef = useRef(null);

  const onConnectStart = useCallback((_, { nodeId, handleId }) => {
    connectStartRef.current = nodeId && !nodeId.startsWith('__draft')
      ? { nodeId, handleId }
      : null;
  }, []);

  const onConnectEnd = useCallback((event) => {
    const from = connectStartRef.current;
    connectStartRef.current = null;

    const el = event.target;
    if (!el?.closest || !el.closest('.react-flow') || el.closest('.react-flow__node')) return;

    const point = event.changedTouches?.[0] ?? event;
    const { clientX, clientY } = point;
    setMenu({
      kind: 'pane',
      sx: clientX,
      sy: clientY,
      flowPos: screenToFlowPosition({ x: clientX, y: clientY }),
      connectFrom: from,
    });
  }, [screenToFlowPosition]);

  const commentDragRef = useRef(null);

  const onNodeDragStart = useCallback((_, node) => {
    commentDragRef.current = null;
    if (node.type !== 'commentNode') return;

    const box = nodeRect(node);
    const carried = getNodes()
      .filter(n => (
        n.id !== node.id
        && !isDraft(n.id)
        && n.type !== 'commentNode'
        && !n.selected
        && contains(box, nodeRect(n))
      ))
      .map(n => ({ id: n.id, x: n.position.x, y: n.position.y }));

    commentDragRef.current = {
      commentId: node.id,
      origin: { x: node.position.x, y: node.position.y },
      carried,
    };
  }, [getNodes]);

  const onNodeDrag = useCallback((_, node) => {
    const drag = commentDragRef.current;
    if (!drag || drag.commentId !== node.id || !drag.carried.length) return;

    const dx = node.position.x - drag.origin.x;
    const dy = node.position.y - drag.origin.y;
    const moves = new Map(drag.carried.map(c => [c.id, { x: c.x + dx, y: c.y + dy }]));

    setNodes(nds => nds.map(n => (moves.has(n.id) ? { ...n, position: moves.get(n.id) } : n)));
  }, [setNodes]);

  const persistPositions = useCallback((movedNodes) => {
    for (const n of movedNodes) {
      if (isDraft(n.id)) continue;
      updateShape(n.id, { x: Math.round(n.position.x), y: Math.round(n.position.y) });
    }
  }, [updateShape]);

  const onNodeDragStop = useCallback((_, node, draggedNodes) => {
    const drag = commentDragRef.current;
    commentDragRef.current = null;

    const moved = new Map();
    for (const n of (draggedNodes?.length ? draggedNodes : [node])) moved.set(n.id, n);

    if (drag && drag.commentId === node.id) {
      for (const c of drag.carried) {
        const current = getNode(c.id);
        if (current) moved.set(c.id, current);
      }
    }

    persistPositions([...moved.values()]);
  }, [getNode, persistPositions]);

  const onSelectionDragStop = useCallback((_, draggedNodes) => {
    persistPositions(draggedNodes ?? []);
  }, [persistPositions]);

  const onNodesChangeWithPersist = useCallback((changes) => {
    onNodesChange(changes);
    for (const ch of changes) {
      if (ch.type === 'dimensions' && ch.resizing === false && !ch.id.startsWith('__draft')) {
        const node = getNode(ch.id);
        if (node?.width && node?.height) {
          updateShape(ch.id, { width: Math.round(node.width), height: Math.round(node.height) });
        }
      }
    }
  }, [onNodesChange, getNode, updateShape]);

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
    if (isDraft(node.id)) return;
    const sel = selectedNodeIdsRef.current;
    const nodeIds = sel.includes(node.id) ? sel : [node.id];
    setMenu({ kind: 'node', sx: event.clientX, sy: event.clientY, nodeIds });
  }, []);

  const onSelectionContextMenu = useCallback((event, selectedNodes) => {
    event.preventDefault();
    const nodeIds = (selectedNodes ?? []).map(n => n.id).filter(id => !isDraft(id));
    if (!nodeIds.length) return;
    setMenu({ kind: 'node', sx: event.clientX, sy: event.clientY, nodeIds });
  }, []);

  const closeMenu = useCallback(() => setMenu(null), []);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  if (!currentSchemaId) {
    return (
      <div className="card grid h-[70vh] place-items-center text-center">
        <div>
          <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-surface-sunken text-fg-subtle">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <path strokeLinecap="round" d="M10 6.5h4a1.5 1.5 0 011.5 1.5v6" />
            </svg>
          </div>
          <p className="text-sm font-medium text-fg">Nessuno schema selezionato</p>
          <p className="mt-1 text-sm text-fg-muted">Scegli uno schema qui sopra per iniziare a disegnare</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '70vh' }} className="card relative overflow-hidden">
      {loadingSchemaId === currentSchemaId && (
        <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-full border border-line
          bg-surface/90 px-3 py-1 text-xs text-fg-muted shadow-sm">
          Caricamento…
        </div>
      )}
      <ContextMenu
        menu={menu}
        onClose={closeMenu}
        onAddShape={(pos, connectFrom) => spawnDraft(pos, null, null, connectFrom)}
        onModifica={handleModifica}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onDelete={handleDelete}
        onGroup={handleGroup}
        onSelectAll={handleSelectAll}
        clipboardCount={clipboard.length}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeWithPersist}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        connectionMode={ConnectionMode.Loose}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onSelectionDragStop={onSelectionDragStop}
        onSelectionChange={onSelectionChange}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onSelectionContextMenu={onSelectionContextMenu}
        nodeTypes={nodeTypes}
        deleteKeyCode={null}
        multiSelectionKeyCode={['Control', 'Meta']}
        selectionKeyCode="Shift"
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        panOnDrag={[1, 2]}
        elevateNodesOnSelect={false}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-surface"
      >
        <Background
          variant={BackgroundVariant.Lines}
          gap={24}
          color={theme === 'dark' ? 'rgb(51 65 85 / 0.5)' : 'rgb(226 232 240 / 0.9)'}
        />
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

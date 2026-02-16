"use client";

import React, { useCallback } from 'react';
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    addEdge,
    Background,
    Controls,
    MiniMap,
    Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
    {
        id: '1',
        type: 'input',
        data: { label: 'Student (Current)' },
        position: { x: 250, y: 0 },
        style: { background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px' }
    },
    {
        id: '2',
        data: { label: 'Learn React' },
        position: { x: 100, y: 100 },
        style: { background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '10px' }
    },
    {
        id: '3',
        data: { label: 'Build Portfolio' },
        position: { x: 400, y: 100 },
        style: { background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '10px' }
    },
    {
        id: '4',
        data: { label: 'Internship' },
        position: { x: 250, y: 200 },
        style: { background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '10px' }
    },
    {
        id: '5',
        type: 'output',
        data: { label: 'Professional SDE (Goal)' },
        position: { x: 250, y: 300 },
        style: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px' }
    },
];

const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e1-3', source: '1', target: '3', animated: true },
    { id: 'e2-4', source: '2', target: '4' },
    { id: 'e3-4', source: '3', target: '4' },
    { id: 'e4-5', source: '4', target: '5', animated: true },
];

export function Roadmap() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: any) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    return (
        <div className="h-[400px] w-full bg-neutral-50 rounded-xl border border-neutral-200 overflow-hidden">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
            >
                <Controls />
                <Background gap={12} size={1} />
            </ReactFlow>
        </div>
    );
}

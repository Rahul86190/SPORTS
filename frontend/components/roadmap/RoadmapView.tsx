"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    addEdge,
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn } from '@/lib/utils';
import { LearningNode } from './LearningNode';
import { SubtopicNode } from './SubtopicNode';
import { NoteNode } from './NoteNode';
import { NodeDetailsModal, NodeDetails } from './NodeDetailsModal';
import { ChatInterface } from '../tutor/ChatInterface';
import { Loader2, ChevronRight, ChevronLeft, Map, StickyNote, Plus, MessageCircle } from 'lucide-react';

const nodeTypes = {
    learningNode: LearningNode,
    subtopicNode: SubtopicNode,
    noteNode: NoteNode,
};
import { ParticleEdge } from './ParticleEdge';

const edgeTypes = {
    particleEdge: ParticleEdge,
};

export function RoadmapView({ profileData, onProfileUpdate }: { profileData: any, onProfileUpdate?: (profile: any) => void }) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [roadmap, setRoadmap] = useState<any>(null);
    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [selectedNode, setSelectedNode] = useState<NodeDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatContext, setChatContext] = useState<string>('');



    // Progress Logic
    const [progress, setProgress] = useState(0);

    // Notes Logic - WE ONLY NEED THIS FOR PERSISTENCE, NOT FOR RENDERING LOOP
    // Actually, we don't even need `notesList` state if we just use `nodes` state to filter.
    // But `saveNotes` needs the full list. 
    // Let's keep a Ref for current notes to avoid dependency cycles? 
    // Or just use functional state updates.

    // Better: Helper to extract notes from current `nodes` state.
    const getNotesFromNodes = useCallback((currentNodes: Node[]) => {
        return currentNodes
            .filter(n => n.type === 'noteNode')
            .map(n => ({
                id: n.id,
                content: n.data.content,
                x: n.position.x,
                y: n.position.y,
                width: n.style?.width,
                height: n.style?.height,
                color: n.data.color,
                fontSize: n.data.fontSize,
                shape: n.data.shape
            }));
    }, []);

    // We still need to load initial notes.
    useEffect(() => {
        if (roadmap && roadmap.notes) {
            // Merge notes into existing nodes if not already there? 
            // Or just append. This runs when `roadmap` loads.
            // The main graph effect runs when `roadmap` changes too.
            // We should Handle this in the Main Graph Effect or a separate one that runs ONCE per roadmap load.
        }
    }, [roadmap]);

    // ...

    const saveNotes = useCallback(async (notesToSave: any[]) => {
        // Fire and forget save
        try {
            await fetch('/api/roadmap/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: profileData.id,
                    notes: notesToSave
                })
            });
            // We do NOT setRoadmap here to avoid re-triggering the main graph effect.
            // We just persist.
        } catch (e) {
            console.error("Failed to save notes", e);
        }
    }, [profileData]);

    const addNote = useCallback(() => {
        const newNoteId = `note-${Date.now()}`;

        // Find a good position: Center of the current Phase or Viewport?
        // We know `currentPhaseIndex`. The main column is around x=50. 
        // Let's put it at x=300 (between main and subtopics) and y=Current Scroll? 
        // Can't easily get scroll without hook. 
        // Let's put it near the top of the current phase.
        // We can't easily calculate "current phase top" without knowing `nodes` state layout.
        // Default to (100, 100) or offset.

        const newNote = {
            id: newNoteId,
            content: '',
            x: 250 + (Math.random() * 50),
            y: 100 + (Math.random() * 50),
            color: '#ffffff',
            fontSize: 'text-sm',
            shape: 'rectangle'
        };

        const noteNode: Node = {
            id: newNote.id,
            type: 'noteNode',
            position: { x: newNote.x, y: newNote.y },
            style: { width: 200, height: 200 }, // Default size
            data: {
                ...newNote,
                onContentChange: updateNoteContent,
                onStyleChange: updateNoteStyle,
                onDelete: deleteNote,
                onResize: onNodeResizeStop
            },
            draggable: true,
        };

        setNodes((nds: Node[]) => {
            const updatedNodes = nds.concat(noteNode);
            // Side effect: Save
            const notesToSave = getNotesFromNodes(updatedNodes);
            saveNotes(notesToSave);
            return updatedNodes;
        });
    }, [getNotesFromNodes, saveNotes]); // Remove updateNoteContent/deleteNote deps if they are stable or use refs

    // We need these defined BEFORE addNote if we pass them... 
    // Actually, we can pass them, but we need to make sure they are stable.

    // ... Move updateNoteContent/deleteNote UP or use useMemo.

    // Let's define them first.

    const updateNoteContent = useCallback((id: string, content: string) => {
        setNodes((nds: Node[]) => {
            const updatedNodes = nds.map((node) => {
                if (node.id === id) {
                    return { ...node, data: { ...node.data, content } };
                }
                return node;
            });

            // Save Debounced? For simplicity, save now.
            const notesToSave = getNotesFromNodes(updatedNodes);
            saveNotes(notesToSave);

            return updatedNodes;
        });
    }, [getNotesFromNodes, saveNotes]);

    const updateNoteStyle = useCallback((id: string, style: any) => {
        setNodes((nds: Node[]) => {
            const updatedNodes = nds.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: { ...node.data, ...style }
                    };
                }
                return node;
            });
            const notesToSave = getNotesFromNodes(updatedNodes);
            saveNotes(notesToSave);
            return updatedNodes;
        });
    }, [getNotesFromNodes, saveNotes]);

    const deleteNote = useCallback((id: string) => {
        setNodes((nds: Node[]) => {
            const updatedNodes = nds.filter((node) => node.id !== id);
            const notesToSave = getNotesFromNodes(updatedNodes);
            saveNotes(notesToSave);
            return updatedNodes;
        });
    }, [getNotesFromNodes, saveNotes]);


    // Re-bind addNote now that dependencies are defined? 
    // No, `addNote` calls them? No, it passes them. 
    // They are defined above.

    // Drag Stop Handler
    const onNodeDragStop = useCallback((event: any, node: any) => {
        if (node.type === 'noteNode') {
            // We need to get the LATEST nodes state to save. 
            // React Flow updates visual position in `nodes`.
            // So `node` param has new position? Yes.
            // But we need ALL notes to save the array.

            setNodes((nds: Node[]) => {
                // `nds` has the updated positions (handled by onNodesChange default behavior usually? 
                // Wait, onNodesChange handles visual updates. 
                // `onNodeDragStop` fires AFTER drag. 
                // We just need to extract and save.
                const notesToSave = getNotesFromNodes(nds);
                saveNotes(notesToSave);
                return nds;
            });
        }
    }, [getNotesFromNodes, saveNotes]);

    const onNodeResizeStop = useCallback((event: any, node: any) => {
        if (node.type === 'noteNode') {
            setNodes((nds: Node[]) => {
                // React Flow updates the style in the internal node state before this fires? 
                // We need to ensure we grab the resized dimensions.
                // Parameter `node` has the new dimensions.

                // We must update the state to match? 
                // Actually `onNodesChange` handles the state update for resizing usually.
                // We just need to persist.
                const notesToSave = getNotesFromNodes(nds);
                saveNotes(notesToSave);
                return nds;
            });
        }
    }, [getNotesFromNodes, saveNotes]);


    // Calculate Progress
    useEffect(() => {
        if (!roadmap || !roadmap.phases) return;

        let total = 0;
        let completed = 0;

        roadmap.phases.forEach((phase: any) => {
            phase.nodes.forEach((node: any) => {
                total++;
                if (node.completed) completed++;

                if (node.subtopics) {
                    node.subtopics.forEach((sub: any) => {
                        total++;
                        if (sub.completed) completed++;
                    });
                }
            });
        });

        setProgress(total === 0 ? 0 : Math.round((completed / total) * 100));
    }, [roadmap]);

    const saveProgress = useCallback(async (nodeId: string, isCompleted: boolean) => {
        // Optimistic Update
        if (!roadmap) return;

        const newRoadmap = { ...roadmap };
        let nodeFound = false;

        newRoadmap.phases.forEach((phase: any) => {
            phase.nodes.forEach((node: any) => {
                if (node.id === nodeId) {
                    node.completed = isCompleted;
                    nodeFound = true;
                }

                if (nodeId.startsWith(node.id + '-sub-')) {
                    const idx = parseInt(nodeId.split('-sub-')[1]);
                    if (node.subtopics && node.subtopics[idx]) {
                        node.subtopics[idx].completed = isCompleted;
                        nodeFound = true;
                    }
                }
            });
        });

        if (nodeFound) {
            setRoadmap(newRoadmap);
            // Fire and forget save
            try {
                await fetch('/api/roadmap/progress', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: profileData.id,
                        node_id: nodeId,
                        completed: isCompleted
                    })
                });
            } catch (err) {
                console.error("Failed to save progress", err);
            }
        }
    }, [roadmap, profileData]);

    // Initial Fetch or Generate
    useEffect(() => {
        console.log("RoadmapView: profileData updated:", profileData);
        if (profileData?.roadmap_data) {
            console.log("RoadmapView: Setting roadmap from profileData", profileData.roadmap_data);
            setRoadmap(profileData.roadmap_data);
        } else {
            console.log("RoadmapView: No roadmap_data in profileData");
            setRoadmap(null);
        }
    }, [profileData]);

    const handleNodeClick = useCallback((nodeData: any) => {
        setSelectedNode(nodeData);
        setIsModalOpen(true);
    }, []);

    // MAIN GRAPH EFFECT
    // Generates Learning Nodes + Appends EXISTING Note Nodes (or loads from roadmap)
    useEffect(() => {
        if (!roadmap || !roadmap.phases) return;

        const phase = roadmap.phases[currentPhaseIndex];
        if (!phase) return;

        const nodesListReactFlow: any[] = [];
        const edgesListReactFlow: any[] = [];

        // ... (Keep existing layout logic for currentY, MAIN_X, loop...)
        let currentY = 50;
        const MAIN_X = 50;
        const SUB_OFFSET_X = 450;
        const SUB_SPACING_Y = 80;

        phase.nodes.forEach((node: any, index: number) => {
            // ... duplicate logic from before ...
            const mainNodeHeight = Math.max(150, (node.subtopics?.length || 0) * SUB_SPACING_Y);
            nodesListReactFlow.push({
                id: node.id,
                type: 'learningNode',
                position: { x: MAIN_X, y: currentY + (mainNodeHeight / 2) - 50 },
                draggable: false,
                data: {
                    id: node.id,
                    index: index,
                    title: node.title,
                    time: node.estimated_time,
                    description: node.description,
                    specific_focus: node.specific_focus,
                    resources: node.resources,
                    onNodeClick: handleNodeClick,
                    completed: node.completed,
                    onComplete: saveProgress
                }
            });

            if (node.subtopics) {
                node.subtopics.forEach((sub: any, subIndex: number) => {
                    const subId = `${node.id}-sub-${subIndex}`;
                    nodesListReactFlow.push({
                        id: subId,
                        type: 'subtopicNode',
                        position: { x: SUB_OFFSET_X, y: currentY + (subIndex * SUB_SPACING_Y) },
                        draggable: false,
                        data: {
                            id: subId,
                            title: sub.title,
                            time: sub.time,
                            completed: sub.completed,
                            onComplete: saveProgress
                        }
                    });
                    edgesListReactFlow.push({
                        id: `e-${node.id}-${subId}`,
                        source: node.id,
                        target: subId,
                        type: 'default',
                        animated: true,
                        sourceHandle: 'right',
                        style: { stroke: '#cbd5e1', strokeWidth: 2 },
                    });
                });
            }
            if (index < phase.nodes.length - 1) {
                const nextNodeId = phase.nodes[index + 1].id;
                edgesListReactFlow.push({
                    id: `e-${node.id}-${nextNodeId}`,
                    source: node.id,
                    target: nextNodeId,
                    type: 'particleEdge',
                    sourceHandle: 'bottom',
                    targetHandle: 'top',
                    animated: false,
                    style: { stroke: '#94a3b8', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#94a3b8' },
                });
            }
            currentY += mainNodeHeight + 100;
        });

        // MERGE NOTES
        // We want to KEEP existing notes if they are in the `nodes` state?
        // Or reload from `roadmap.notes`?
        // If we switch phases, we reload `roadmap.phases`.
        // `roadmap.notes` should be the source of truth for initial load.
        // But if we just dragged a note, `nodes` state is fresher than `roadmap` if we didn't update roadmap.
        // ISSUE: `saveNotes` doesn't update `roadmap` state anymore (to avoid loop).
        // So `roadmap.notes` is STALE.
        // WE MUST PRESERVE CURRENT NOTES FROM `nodes` STATE?

        // Strategy: 
        // 1. Get current notes from `nodes` state (if any exist).
        // 2. If 'initially loading' (nodes is empty?), use `roadmap.notes`.
        // 3. Combine New Learning Nodes + Current Notes.

        setNodes((currentNodes: Node[]) => {
            const currentNotes = currentNodes.filter(n => n.type === 'noteNode');

            // If we have no current notes (first load), check roadmap.
            let notesToUse = currentNotes;
            if (currentNotes.length === 0 && roadmap.notes) {
                notesToUse = roadmap.notes.map((n: any) => ({
                    id: n.id,
                    type: 'noteNode',
                    position: { x: n.x, y: n.y },
                    style: { width: n.width || 200, height: n.height || 200 },
                    data: {
                        ...n,
                        onContentChange: updateNoteContent,
                        onStyleChange: updateNoteStyle,
                        onDelete: deleteNote,
                        onResize: onNodeResizeStop
                    },
                    draggable: true
                }));
            }
            // ensure persistence callbacks are attached if coming from state (they should be)

            return [...nodesListReactFlow, ...notesToUse];
        });

        setEdges(edgesListReactFlow);

    }, [roadmap, currentPhaseIndex, handleNodeClick, saveProgress]);
    // Removed `notesList`, `saveNotes`, `updateNoteContent`, `deleteNote` from deps involving re-gen.



    const generateRoadmap = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/roadmap/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: profileData.id,
                    goal: "Full Stack Developer" // WE SHOULD GET THIS FROM USER INPUT
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Roadmap Generation Failed:", errorText);
                throw new Error(errorText || res.statusText);
            }

            const data = await res.json();
            if (data.roadmap) {
                setRoadmap(data.roadmap);
                if (onProfileUpdate) {
                    onProfileUpdate({
                        ...profileData,
                        roadmap_data: data.roadmap
                    });
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!roadmap) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-neutral-200 p-8 text-center">
                <Map className="w-12 h-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-bold text-neutral-900">No Roadmap Found</h3>
                <p className="text-neutral-500 mb-6">Let AI create a personalized path for you.</p>
                <button
                    onClick={generateRoadmap}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Generate My Path
                </button>
            </div>
        );
    }




    const currentPhase = roadmap.phases[currentPhaseIndex];
    if (!currentPhase) return null;

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-xl border border-neutral-200 overflow-hidden relative">
            {/* Header / Phase Nav */}
            <div className="bg-neutral-50 border-b border-neutral-200 p-4 pb-6 z-10 relative">
                <div className="flex justify-between items-center mb-4">
                    <button
                        disabled={currentPhaseIndex === 0}
                        onClick={() => setCurrentPhaseIndex(i => i - 1)}
                        className="p-2 hover:bg-neutral-200 rounded-full disabled:opacity-30"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="text-center">
                        <h3 className="font-bold text-lg text-neutral-900">{currentPhase.title}</h3>
                        <p className="text-sm text-neutral-500">{currentPhase.estimated_time}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={addNote}
                            className="p-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-full transition-colors flex items-center gap-1.5 px-3"
                            title="Add Sticky Note"
                        >
                            <StickyNote className="w-4 h-4" />
                            <span className="text-xs font-bold">Add Note</span>
                        </button>
                        <button
                            onClick={() => {
                                // Construct a summary of the current phase for context
                                if (currentPhase) {
                                    const phaseSummary = `Current Phase: ${currentPhase.title}. ` +
                                        currentPhase.nodes.map((n: any, i: number) => {
                                            const subs = n.subtopics ? ` (Subtopics: ${n.subtopics.map((s: any) => s.title).join(', ')})` : '';
                                            return `${i + 1}. ${n.title}${subs}`;
                                        }).join('. ');
                                    setChatContext(phaseSummary);
                                } else {
                                    setChatContext("General Programming");
                                }
                                setIsChatOpen(prev => !prev);
                            }}
                            className={cn("p-2 rounded-full transition-colors flex items-center gap-1.5 px-3", isChatOpen ? "bg-blue-100 text-blue-700" : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600")}
                            title="AI Tutor"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs font-bold">Tutor</span>
                        </button>
                        <button
                            onClick={generateRoadmap}
                            disabled={loading}
                            className="p-2 hover:bg-neutral-200 rounded-full text-neutral-500 hover:text-blue-600 transition-colors"
                            title="Regenerate Roadmap"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Map className="w-4 h-4" />}
                        </button>
                        <button
                            disabled={currentPhaseIndex === roadmap.phases.length - 1}
                            onClick={() => setCurrentPhaseIndex(i => i + 1)}
                            className="p-2 hover:bg-neutral-200 rounded-full disabled:opacity-30"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Global Progress Bar */}
                <div className="max-w-2xl mx-auto px-4">
                    <div className="flex justify-between text-xs font-semibold text-neutral-500 mb-1">
                        <span>Overall Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Graph Area */}
            <div className="flex-1 bg-neutral-50 relative"> {/* Light gray bg for contrast */}
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeDragStop={onNodeDragStop}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    attributionPosition="bottom-right"
                    minZoom={0.5}
                    maxZoom={1.5}
                >
                    <Controls className="bg-white shadow-md border-neutral-200" />
                    <Background color="#cbd5e1" gap={20} size={2} /> {/* Subtle darker dots */}
                </ReactFlow>
            </div>

            {/* Details/Context Bar (Optional) */}
            <div className="p-3 bg-white border-t border-neutral-200 text-xs text-neutral-500 text-center z-10 relative">
                Phase {currentPhaseIndex + 1} of {roadmap.phases.length} • {roadmap.phases.length} Total Phases
            </div>

            {/* Modal */}
            <NodeDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                node={selectedNode}
                onAskTutor={(context) => {
                    setChatContext(context);
                    setIsChatOpen(true);
                    // Optional: Close modal if you want cleaner UI, but keeping it open is also fine for reference.
                    // setIsModalOpen(false); 
                }}
            />

            {/* AI Tutor Chat */}
            <ChatInterface
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                context={chatContext}
            />
        </div>
    );
}

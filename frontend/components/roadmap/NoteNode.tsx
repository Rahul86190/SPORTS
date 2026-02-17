import { NodeResizer } from '@xyflow/react';
import { X, Square, Circle, Triangle, Hexagon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const COLORS = [
    { name: 'White', value: '#ffffff' },
    { name: 'Yellow', value: '#fef3c7' },
    { name: 'Blue', value: '#dbeafe' },
    { name: 'Green', value: '#dcfce7' },
    { name: 'Pink', value: '#fce7f3' },
];

const FONT_SIZES = [
    { name: 'Small', value: 'text-xs' },
    { name: 'Medium', value: 'text-sm' },
    { name: 'Large', value: 'text-lg' },
];

const SHAPES = [
    { name: 'Rectangle', value: 'rectangle', icon: Square },
    { name: 'Circle', value: 'circle', icon: Circle },
    { name: 'Triangle', value: 'triangle', icon: Triangle },
    { name: 'Diamond', value: 'diamond', icon: Hexagon, rotate: 45 },
    { name: 'Pentagon', value: 'pentagon', icon: Hexagon },
];

export function NoteNode({ data, selected }: { data: any, selected: boolean }) {
    const [content, setContent] = useState(data.content || '');
    const [color, setColor] = useState(data.color || '#ffffff');
    const [fontSize, setFontSize] = useState(data.fontSize || 'text-sm');
    // Use data.shape as source of truth if available, else default
    const shape = data.shape || 'rectangle';
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea height
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [content, fontSize]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        if (data.onContentChange) {
            data.onContentChange(data.id, e.target.value);
        }
    };

    const handleStyleChange = (updates: any) => {
        if (updates.color) setColor(updates.color);
        if (updates.fontSize) setFontSize(updates.fontSize);
        // Shape is now derived from props, so we rely on parent update via onStyleChange

        if (data.onStyleChange) {
            data.onStyleChange(data.id, {
                color: updates.color || color,
                fontSize: updates.fontSize || fontSize,
                shape: updates.shape || shape
            });
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (data.onDelete) {
            data.onDelete(data.id);
        }
    };

    // Calculate Shape Styles
    const getShapeStyles = () => {
        const base = { backgroundColor: color };
        switch (shape) {
            case 'circle':
                return { ...base, borderRadius: '50%' };
            case 'triangle':
                return { ...base, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', paddingBottom: '2rem' };
            case 'diamond':
                return { ...base, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', padding: '2.5rem' };
            case 'pentagon':
                return { ...base, clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)', paddingTop: '2rem' };
            default: // rectangle
                return { ...base, borderRadius: '0.5rem' };
        }
    };

    return (
        <div className="relative w-full h-full min-w-[150px] min-h-[150px] group">

            {/* 1. CONTROLS LAYER (Resizer, Delete, DragHandle) - Outside clipped area */}

            <NodeResizer
                isVisible={selected}
                minWidth={150}
                minHeight={150}
                lineStyle={{ border: '1px solid #3b82f6', opacity: 0.5 }}
                handleStyle={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#3b82f6', border: '2px solid white' }}
                onResizeEnd={(event, params) => {
                    if (data.onResize) {
                        // Create a mock node object with updated style to pass back
                        data.onResize(event, {
                            type: 'noteNode',
                            id: data.id,
                            style: { width: params.width, height: params.height }
                        });
                    }
                }}
            />

            {/* Selection Ring (Visual Only) - applied to a wrapper or matched to shape? 
                For complex shapes, a bounding box ring is fine. */}
            {selected && (
                <div className="absolute inset-0 rounded-lg ring-2 ring-blue-500 pointer-events-none z-20" />
            )}

            {/* Delete Button - Top Right of Bounding Box */}
            <button
                onClick={handleDelete}
                className={`
                    absolute -top-3 -right-3 z-50 
                    bg-white rounded-full p-1.5 shadow-md border border-neutral-200 
                    text-neutral-500 hover:text-red-500 hover:bg-red-50 transition-all
                    opacity-0 group-hover:opacity-100 ${selected ? 'opacity-100' : ''}
                `}
                title="Delete Note"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <X className="w-3.5 h-3.5" />
            </button>

            {/* Drag Handle - Top Center */}
            <div className={`
                absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-4 cursor-move z-40
                opacity-0 group-hover:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}
            `}>
                <div className="w-8 h-1 bg-black/20 mx-auto rounded-full mt-1" />
            </div>

            {/* Toolbar (Visible when selected) */}
            {selected && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex justify-center gap-2 z-[60] animate-in fade-in slide-in-from-bottom-2 duration-200 w-max max-w-[90vw]">
                    <div className="bg-white rounded-lg shadow-xl border border-neutral-200 p-1.5 flex items-center gap-3">
                        {/* Colors */}
                        <div className="flex gap-1 pr-3 border-r border-neutral-200">
                            {COLORS.map((c) => (
                                <button
                                    key={c.name}
                                    onClick={() => handleStyleChange({ color: c.value })}
                                    className={`w-5 h-5 rounded-full border border-neutral-300 hover:scale-110 transition-transform ${color === c.value ? 'ring-1 ring-neutral-900 ring-offset-1' : ''}`}
                                    style={{ backgroundColor: c.value }}
                                    title={c.name}
                                />
                            ))}
                        </div>

                        {/* Shapes */}
                        <div className="flex gap-1 pr-3 border-r border-neutral-200">
                            {SHAPES.map((s) => {
                                const Icon = s.icon;
                                return (
                                    <button
                                        key={s.name}
                                        onClick={() => handleStyleChange({ shape: s.value })}
                                        className={`w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-500 ${shape === s.value ? 'bg-neutral-100 text-neutral-900' : ''}`}
                                        title={s.name}
                                    >
                                        <Icon className="w-4 h-4" style={s.name === 'Diamond' ? { transform: 'rotate(45deg)' } : {}} />
                                    </button>
                                )
                            })}
                        </div>

                        {/* Font Size */}
                        <div className="flex gap-1">
                            {FONT_SIZES.map((f) => (
                                <button
                                    key={f.name}
                                    onClick={() => handleStyleChange({ fontSize: f.value })}
                                    className={`w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-600 ${fontSize === f.value ? 'bg-neutral-100 font-bold text-neutral-900' : ''}`}
                                    title={f.name}
                                >
                                    <span className={f.value === 'text-xs' ? 'text-[10px]' : f.value === 'text-sm' ? 'text-xs' : 'text-sm'}>A</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}


            {/* 2. SHAPE LAYER (Background, ClipPath, Shadow) */}
            <div
                className="w-full h-full flex flex-col justify-center p-4 transition-all duration-200"
                style={{
                    ...getShapeStyles(),
                    filter: shape !== 'rectangle' && shape !== 'circle' ? 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))' : 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))'
                }}
            >
                <textarea
                    ref={textareaRef}
                    className={`w-full h-full bg-transparent border-none resize-none focus:ring-0 text-neutral-800 leading-relaxed overflow-hidden p-0 text-center ${fontSize}`}
                    placeholder="Type here..."
                    value={content}
                    onChange={handleChange}
                    onMouseDown={(e) => e.stopPropagation()}
                />
            </div>

        </div>
    );
}

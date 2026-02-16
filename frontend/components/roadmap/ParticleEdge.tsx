import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';

export function ParticleEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}: EdgeProps) {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetPosition,
        targetX,
        targetY,
    });

    return (
        <>
            <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
            <circle r="3" fill="#3b82f6">
                <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
            </circle>
        </>
    );
}

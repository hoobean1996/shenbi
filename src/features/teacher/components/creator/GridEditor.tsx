/**
 * GridEditor Component
 *
 * Visual grid editor for maze level design.
 * Supports click and drag to paint cells.
 */

import { useState, useMemo, useCallback } from 'react';
import { GridCell } from './GridCell';
import { EntityTool, parseGridToMatrix, matrixToGridStrings, placeEntity } from './gridUtils';

interface GridEditorProps {
  width: number;
  height: number;
  grid: string[];
  onChange: (grid: string[]) => void;
  selectedTool: EntityTool;
}

export function GridEditor({ width, height, grid, onChange, selectedTool }: GridEditorProps) {
  const [isDrawing, setIsDrawing] = useState(false);

  // Parse grid to matrix for editing
  const gridMatrix = useMemo(() => parseGridToMatrix(grid, width, height), [grid, width, height]);

  // Handle cell click
  const handleCellClick = useCallback(
    (x: number, y: number) => {
      // Don't allow editing border cells
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        return;
      }

      const newMatrix = placeEntity(gridMatrix, x, y, selectedTool);
      onChange(matrixToGridStrings(newMatrix));
    },
    [gridMatrix, selectedTool, onChange, width, height]
  );

  // Handle mouse down - start drawing
  const handleMouseDown = useCallback(
    (x: number, y: number) => {
      setIsDrawing(true);
      handleCellClick(x, y);
    },
    [handleCellClick]
  );

  // Handle mouse enter while drawing
  const handleMouseEnter = useCallback(
    (x: number, y: number) => {
      if (isDrawing) {
        handleCellClick(x, y);
      }
    },
    [isDrawing, handleCellClick]
  );

  // Stop drawing
  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  return (
    <div
      className="inline-block p-3 bg-gray-200 rounded-xl"
      onMouseLeave={stopDrawing}
      onMouseUp={stopDrawing}
    >
      <div
        className="grid gap-0.5"
        style={{
          gridTemplateColumns: `repeat(${width}, 40px)`,
        }}
      >
        {Array.from({ length: height }).map((_, y) =>
          Array.from({ length: width }).map((_, x) => (
            <GridCell
              key={`${x}-${y}`}
              value={gridMatrix[y][x]}
              x={x}
              y={y}
              isEdge={x === 0 || y === 0 || x === width - 1 || y === height - 1}
              onMouseDown={() => handleMouseDown(x, y)}
              onMouseEnter={() => handleMouseEnter(x, y)}
            />
          ))
        )}
      </div>
    </div>
  );
}

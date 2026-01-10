/**
 * Notebook Execution Hook
 *
 * Manages code cell execution with shared context across cells.
 * Supports print output and turtle graphics.
 */

import { useState, useCallback, useRef } from 'react';
import { VM, VMState } from '../../../core/lang/vm';
import { compile, compileToIR } from '../../../core/lang/index';
import { Value } from '../../../core/lang/ir';
import { TurtleWorld, SharedTurtleState } from '../../../core/game/turtle/TurtleWorld';
import { TURTLE_STDLIB } from '../../../core/game/turtle/stdlib';
import type { CodeCell, CellOutput, TurtleCanvasState } from '../types';
import { createTextOutput, createErrorOutput, generateOutputId } from '../utils/cellHelpers';

// ============ Execution Context ============

interface ExecutionResult {
  success: boolean;
  outputs: CellOutput[];
  variables: Record<string, Value>;
}

// ============ Hook ============

export function useNotebookExecution() {
  // Shared globals across cells
  const [executionCount, setExecutionCount] = useState(0);
  const globalsRef = useRef<Map<string, Value>>(new Map());
  const turtleWorldRef = useRef<TurtleWorld | null>(null);

  // Execute a single code cell
  const executeCell = useCallback(
    async (cell: CodeCell): Promise<ExecutionResult> => {
      const outputs: CellOutput[] = [];
      const printBuffer: string[] = [];

      try {
        const vm = new VM();

        // Restore shared globals
        for (const [name, value] of globalsRef.current) {
          vm.setGlobal(name, value);
        }

        // Register print command
        vm.registerCommand('print', (args: Value[]) => {
          printBuffer.push(args.map(String).join(' '));
        });
        vm.registerCommand('打印', (args: Value[]) => {
          printBuffer.push(args.map(String).join(' '));
        });

        // Handle turtle game type
        let sharedState: SharedTurtleState | null = null;
        if (cell.gameType === 'turtle') {
          // Create or reuse turtle world
          if (!turtleWorldRef.current) {
            turtleWorldRef.current = new TurtleWorld();
          }
          const world = turtleWorldRef.current;
          sharedState = world.toSharedState();

          // Register turtle native helpers
          vm.registerSensor('_sin', (args: Value[]) => {
            const radians = typeof args[0] === 'number' ? args[0] : 0;
            return Math.sin(radians);
          });
          vm.registerSensor('_cos', (args: Value[]) => {
            const radians = typeof args[0] === 'number' ? args[0] : 0;
            return Math.cos(radians);
          });
          vm.registerCommand('_drawLine', (args: Value[]) => {
            if (!sharedState) return;
            const fromX = typeof args[0] === 'number' ? args[0] : 0;
            const fromY = typeof args[1] === 'number' ? args[1] : 0;
            const toX = typeof args[2] === 'number' ? args[2] : 0;
            const toY = typeof args[3] === 'number' ? args[3] : 0;
            const color = typeof args[4] === 'string' ? args[4] : '#000000';
            const width = typeof args[5] === 'number' ? args[5] : 2;
            sharedState.lines.push({ fromX, fromY, toX, toY, color, width });
          });

          // Compile with turtle stdlib
          const fullCode = TURTLE_STDLIB + '\n' + cell.content;
          const ast = compile(fullCode);
          const program = compileToIR(ast);
          vm.load(program);
          vm.setGlobal('world', sharedState);
        } else {
          // Regular code execution
          const ast = compile(cell.content);
          const program = compileToIR(ast);
          vm.load(program);
        }

        // Run to completion
        let steps = 0;
        const maxSteps = 100000;
        while (steps < maxSteps) {
          const result = vm.step();
          if (result.done) break;
          steps++;
        }

        // Check for errors
        const state: VMState = vm.getState();
        if (state.status === 'error' && state.error) {
          outputs.push(createErrorOutput(state.error));
          return { success: false, outputs, variables: {} };
        }

        // Collect print output
        if (printBuffer.length > 0) {
          outputs.push(createTextOutput(printBuffer.join('\n')));
        }

        // Capture turtle canvas state
        if (cell.gameType === 'turtle' && sharedState && turtleWorldRef.current) {
          turtleWorldRef.current.syncFromSharedState(sharedState);
          const world = turtleWorldRef.current;
          const turtle = world.getTurtle();
          const lines = world.getLines();

          const canvasState: TurtleCanvasState = {
            lines: lines.map((line) => ({
              from: line.from,
              to: line.to,
              color: line.color,
              width: line.width,
            })),
            turtle: {
              x: turtle.x,
              y: turtle.y,
              angle: turtle.angle,
              penDown: turtle.penDown,
            },
            width: world.getWidth(),
            height: world.getHeight(),
          };

          outputs.push({
            id: generateOutputId(),
            type: 'turtle',
            content: '',
            canvasState,
            timestamp: Date.now(),
          });
        }

        // Update shared globals
        const variables = vm.getVariables();
        for (const [name, value] of Object.entries(variables)) {
          // Skip internal/stdlib variables
          if (!name.startsWith('_') && name !== 'world') {
            globalsRef.current.set(name, value);
          }
        }

        setExecutionCount((prev) => prev + 1);

        return { success: true, outputs, variables };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        outputs.push(createErrorOutput(errorMessage));
        return { success: false, outputs, variables: {} };
      }
    },
    []
  );

  // Reset execution context (like "Restart Kernel")
  const resetContext = useCallback(() => {
    globalsRef.current = new Map();
    turtleWorldRef.current = null;
    setExecutionCount(0);
  }, []);

  // Reset only turtle world (keep variables)
  const resetTurtleWorld = useCallback(() => {
    turtleWorldRef.current = new TurtleWorld();
  }, []);

  // Get current globals for display
  const getGlobals = useCallback((): Record<string, Value> => {
    const result: Record<string, Value> = {};
    for (const [name, value] of globalsRef.current) {
      result[name] = value;
    }
    return result;
  }, []);

  return {
    executeCell,
    resetContext,
    resetTurtleWorld,
    getGlobals,
    executionCount,
  };
}

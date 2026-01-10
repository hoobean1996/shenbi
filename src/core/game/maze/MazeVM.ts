/**
 * Maze Virtual Machine
 *
 * Wraps the pure MiniPython VM with maze game bindings.
 * Commands are defined in MAZE_STDLIB (MiniPython).
 */

import { VM, VMState, VMStepResult, CommandHandler } from '../../lang/vm';
import { CompiledProgram, Value } from '../../lang/ir';
import { compile, compileToIR } from '../../lang/index';
import { MazeWorld, SharedMazeState, Direction } from './MazeWorld';
import { MAZE_STDLIB } from './stdlib';

export interface MazeVMConfig {
  world: MazeWorld;
  onPrint?: (message: string) => void;
}

/**
 * MazeVM - MiniPython VM with maze game bindings
 * Commands are defined in MAZE_STDLIB (MiniPython).
 */
export class MazeVM {
  private vm: VM;
  private world: MazeWorld;
  private onPrint?: (message: string) => void;
  private sharedState: SharedMazeState | null = null;

  constructor(config: MazeVMConfig) {
    this.vm = new VM();
    this.world = config.world;
    this.onPrint = config.onPrint;

    this.registerBindings();
  }

  private registerBindings(): void {
    // Print command
    const printHandler: CommandHandler = (args: Value[]) => {
      const message = args.map((a) => String(a)).join(' ');
      if (this.onPrint) {
        this.onPrint(message);
      } else {
        console.log(message);
      }
    };
    this.vm.registerCommand('print', printHandler);
    this.vm.registerCommand('打印', printHandler);

    // Movement commands - these trigger actions so VM pauses after each
    this.vm.registerCommand('_forward', () => {
      if (this.sharedState) {
        this.sharedState.steps++;
        const dir = this.sharedState.direction;
        const offsets: Record<string, [number, number]> = {
          up: [0, -1],
          down: [0, 1],
          left: [-1, 0],
          right: [1, 0],
        };
        const [dx, dy] = offsets[dir];
        const newX = this.sharedState.x + dx;
        const newY = this.sharedState.y + dy;
        // Check bounds and walls
        if (
          newX >= 0 &&
          newX < this.sharedState.width &&
          newY >= 0 &&
          newY < this.sharedState.height &&
          this.sharedState.grid[newY][newX] !== 'wall'
        ) {
          this.sharedState.x = newX;
          this.sharedState.y = newY;
          // Auto-collect stars
          if (this.sharedState.grid[newY][newX] === 'star') {
            this.sharedState.grid[newY][newX] = 'empty';
            this.sharedState.collected++;
          }
        }
        this.syncState();
      }
    });

    this.vm.registerCommand('_backward', () => {
      if (this.sharedState) {
        this.sharedState.steps++;
        const dir = this.sharedState.direction;
        const offsets: Record<string, [number, number]> = {
          up: [0, -1],
          down: [0, 1],
          left: [-1, 0],
          right: [1, 0],
        };
        const [dx, dy] = offsets[dir];
        const newX = this.sharedState.x - dx;
        const newY = this.sharedState.y - dy;
        if (
          newX >= 0 &&
          newX < this.sharedState.width &&
          newY >= 0 &&
          newY < this.sharedState.height &&
          this.sharedState.grid[newY][newX] !== 'wall'
        ) {
          this.sharedState.x = newX;
          this.sharedState.y = newY;
          if (this.sharedState.grid[newY][newX] === 'star') {
            this.sharedState.grid[newY][newX] = 'empty';
            this.sharedState.collected++;
          }
        }
        this.syncState();
      }
    });

    this.vm.registerCommand('_turnLeft', () => {
      if (this.sharedState) {
        this.sharedState.steps++;
        const turns: Record<Direction, Direction> = {
          up: 'left',
          left: 'down',
          down: 'right',
          right: 'up',
        };
        this.sharedState.direction = turns[this.sharedState.direction];
        this.syncState();
      }
    });

    this.vm.registerCommand('_turnRight', () => {
      if (this.sharedState) {
        this.sharedState.steps++;
        const turns: Record<Direction, Direction> = {
          up: 'right',
          right: 'down',
          down: 'left',
          left: 'up',
        };
        this.sharedState.direction = turns[this.sharedState.direction];
        this.syncState();
      }
    });

    this.vm.registerCommand('_collect', () => {
      if (this.sharedState) {
        const { x, y } = this.sharedState;
        if (this.sharedState.grid[y][x] === 'star') {
          this.sharedState.grid[y][x] = 'empty';
          this.sharedState.collected++;
        }
        this.syncState();
      }
    });
  }

  /**
   * Load user code with MAZE_STDLIB prepended
   */
  loadWithSource(userCode: string): void {
    // Combine stdlib with user code
    const fullCode = MAZE_STDLIB + '\n' + userCode;

    // Compile the combined code
    const ast = compile(fullCode);
    const program = compileToIR(ast);

    // Create shared state from world
    this.sharedState = this.world.toSharedState();

    // Load program and inject shared state
    this.vm.load(program);
    this.vm.setGlobal('world', this.sharedState);
  }

  /**
   * Sync shared state back to MazeWorld (when using stdlib mode)
   */
  private syncState(): void {
    if (this.sharedState) {
      this.world.syncFromSharedState(this.sharedState);
    }
  }

  // ============ VM Delegation ============

  load(program: CompiledProgram): void {
    // Set up shared state for stdlib access
    this.sharedState = this.world.toSharedState();
    this.vm.load(program);
    this.vm.setGlobal('world', this.sharedState);
  }

  reset(): void {
    this.vm.reset();
    // Re-create shared state if using stdlib mode
    if (this.sharedState) {
      this.sharedState = this.world.toSharedState();
      this.vm.setGlobal('world', this.sharedState);
    }
  }

  step(): VMStepResult {
    const result = this.vm.step();
    this.syncState();
    return result;
  }

  run(): VMStepResult {
    const result = this.vm.run();
    this.syncState();
    return result;
  }

  runAll(): VMStepResult[] {
    const results = this.vm.runAll();
    this.syncState();
    return results;
  }

  pause(): void {
    this.vm.pause();
  }

  resume(): void {
    this.vm.resume();
  }

  getState(): VMState {
    return this.vm.getState();
  }

  getCurrentLine(): number | null {
    return this.vm.getCurrentLine();
  }

  getVariables(): Record<string, Value> {
    return this.vm.getVariables();
  }

  getCallStackForVisualization(): Array<{
    name: string;
    line: number;
    locals: Record<string, Value>;
  }> {
    return this.vm.getCallStackForVisualization();
  }

  // ============ Debugging Features Delegation ============

  // Breakpoints
  addBreakpoint(line: number): void {
    this.vm.addBreakpoint(line);
  }

  removeBreakpoint(line: number): void {
    this.vm.removeBreakpoint(line);
  }

  toggleBreakpoint(line: number): boolean {
    return this.vm.toggleBreakpoint(line);
  }

  clearBreakpoints(): void {
    this.vm.clearBreakpoints();
  }

  getBreakpoints(): number[] {
    return this.vm.getBreakpoints();
  }

  hasBreakpoint(line: number): boolean {
    return this.vm.hasBreakpoint(line);
  }

  // Variable Watch
  addWatch(name: string): void {
    this.vm.addWatch(name);
  }

  removeWatch(name: string): void {
    this.vm.removeWatch(name);
  }

  clearWatch(): void {
    this.vm.clearWatch();
  }

  getWatchList(): string[] {
    return this.vm.getWatchList();
  }

  getWatchedValues(): Record<string, Value | undefined> {
    return this.vm.getWatchedValues();
  }

  // Step-Back Debugging
  stepBack(): boolean {
    return this.vm.stepBack();
  }

  getHistoryLength(): number {
    return this.vm.getHistoryLength();
  }

  clearHistory(): void {
    this.vm.clearHistory();
  }

  setMaxHistorySize(size: number): void {
    this.vm.setMaxHistorySize(size);
  }

  // Expression Evaluation (for win/fail conditions)
  // Prepends stdlib so expressions can use functions like collectedCount(), atGoal()
  evaluateExpression(source: string): Value {
    // Wrap the expression in stdlib context so it can call stdlib functions
    // Assign to __result__ because expression statements pop their results
    const fullSource = MAZE_STDLIB + '\n__result__ = ' + source;
    this.vm.evaluateExpression(fullSource);
    return this.vm.getGlobal('__result__') ?? null;
  }
}

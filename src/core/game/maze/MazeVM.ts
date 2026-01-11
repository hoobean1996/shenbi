/**
 * Maze Virtual Machine
 *
 * Wraps the pure MiniPython VM with maze game bindings.
 * Commands and sensors are registered as native commands that call MazeWorld directly.
 * MazeWorld is the single source of truth for game state.
 */

import { VM, VMState, VMStepResult, CommandHandler } from '../../lang/vm';
import { CompiledProgram, Value } from '../../lang/ir';
import { compile, compileToIR } from '../../lang/index';
import { MazeWorld, SharedMazeState } from './MazeWorld';
import { MAZE_STDLIB } from './stdlib';

export interface MazeVMConfig {
  world: MazeWorld;
  onPrint?: (message: string) => void;
}

/**
 * MazeVM - MiniPython VM with maze game bindings
 * Commands call MazeWorld methods directly for single source of truth.
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

    // ============ Movement Commands ============
    // These call MazeWorld methods directly (single source of truth)

    this.vm.registerCommand('forward', () => this.world.moveForward());
    this.vm.registerCommand('前进', () => this.world.moveForward());

    this.vm.registerCommand('backward', () => this.world.moveBackward());
    this.vm.registerCommand('后退', () => this.world.moveBackward());

    this.vm.registerCommand('turnLeft', () => { this.world.turnLeft(); });
    this.vm.registerCommand('左转', () => { this.world.turnLeft(); });

    this.vm.registerCommand('turnRight', () => { this.world.turnRight(); });
    this.vm.registerCommand('右转', () => { this.world.turnRight(); });

    this.vm.registerCommand('collect', () => this.world.collect());
    this.vm.registerCommand('收集', () => this.world.collect());

    // ============ Sensors ============
    // These also call MazeWorld methods directly

    this.vm.registerCommand('frontBlocked', () => this.world.isFrontBlocked());
    this.vm.registerCommand('前方有墙', () => this.world.isFrontBlocked());

    this.vm.registerCommand('frontClear', () => this.world.isFrontClear());
    this.vm.registerCommand('前方无墙', () => this.world.isFrontClear());

    this.vm.registerCommand('atGoal', () => this.world.isAtGoal());
    this.vm.registerCommand('到达终点', () => this.world.isAtGoal());

    this.vm.registerCommand('hasStar', () => this.world.hasStarHere());
    this.vm.registerCommand('有星星', () => this.world.hasStarHere());

    this.vm.registerCommand('remainingStars', () => this.world.getRemainingStars());
    this.vm.registerCommand('剩余星星', () => this.world.getRemainingStars());

    this.vm.registerCommand('collectedCount', () => this.world.getCollectedCount());
    this.vm.registerCommand('已收集', () => this.world.getCollectedCount());
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
    return this.vm.step();
  }

  run(): VMStepResult {
    return this.vm.run();
  }

  runAll(): VMStepResult[] {
    return this.vm.runAll();
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

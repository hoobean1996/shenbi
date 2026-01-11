/**
 * Maze Virtual Machine
 *
 * Wraps the pure MiniPython VM with maze game bindings.
 * Commands and sensors are registered from commands.ts (single source of truth).
 * MazeWorld is the single source of truth for game state.
 */

import { VM, VMState, VMStepResult, CommandHandler } from '../../lang/vm';
import { CompiledProgram, Value } from '../../lang/ir';
import { compile, compileToIR } from '../../lang/index';
import { MazeWorld } from './MazeWorld';
import { MAZE_COMMANDS, MAZE_CONDITIONS, MAZE_SENSORS } from './commands';

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

    // Register commands from commands.ts (single source of truth)
    for (const cmd of MAZE_COMMANDS) {
      const handler = (args: Value[]) => cmd.handler(this.world, args);
      this.vm.registerCommand(cmd.codeName, handler);
    }

    // Register conditions as commands (they return boolean)
    for (const cond of MAZE_CONDITIONS) {
      const handler = () => cond.handler(this.world);
      this.vm.registerCommand(cond.codeName, handler);
    }

    // Register sensors from commands.ts
    for (const sensor of MAZE_SENSORS) {
      const handler = (args: Value[]) => sensor.handler(this.world, args);
      this.vm.registerCommand(sensor.codeName, handler);
    }
  }

  /**
   * Load and compile user source code
   */
  loadWithSource(userCode: string): void {
    const ast = compile(userCode);
    const program = compileToIR(ast);
    this.vm.load(program);
  }

  // ============ VM Delegation ============

  load(program: CompiledProgram): void {
    this.vm.load(program);
  }

  reset(): void {
    this.vm.reset();
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
  // Native commands are already registered, so expressions can use them directly
  evaluateExpression(source: string): Value {
    // Assign to __result__ because expression statements pop their results
    const fullSource = '__result__ = ' + source;
    this.vm.evaluateExpression(fullSource);
    return this.vm.getGlobal('__result__') ?? null;
  }
}

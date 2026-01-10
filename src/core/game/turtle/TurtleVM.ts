/**
 * Turtle Virtual Machine
 *
 * Wraps the pure MiniPython VM with turtle graphics bindings.
 * Commands are defined in TURTLE_STDLIB (MiniPython).
 */

import { VM, VMState, VMStepResult, CommandHandler } from '../../lang/vm';
import { CompiledProgram, Value } from '../../lang/ir';
import { compile, compileToIR } from '../../lang/index';
import { TurtleWorld, SharedTurtleState } from './TurtleWorld';
import { TURTLE_STDLIB } from './stdlib';

export interface TurtleVMConfig {
  world: TurtleWorld;
  onPrint?: (message: string) => void;
}

/**
 * TurtleVM - MiniPython VM with turtle graphics bindings
 * Commands are defined in TURTLE_STDLIB (MiniPython).
 */
export class TurtleVM {
  private vm: VM;
  private world: TurtleWorld;
  private onPrint?: (message: string) => void;
  private sharedState: SharedTurtleState | null = null;

  constructor(config: TurtleVMConfig) {
    this.vm = new VM();
    this.world = config.world;
    this.onPrint = config.onPrint;

    this.registerPrintBinding();
    this.registerNativeHelpers();
  }

  private registerPrintBinding(): void {
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
  }

  /**
   * Register native helpers for stdlib (_sin, _cos, _drawLine)
   * These cannot be implemented in MiniPython and must be native.
   */
  private registerNativeHelpers(): void {
    // Math helpers for stdlib
    this.vm.registerSensor('_sin', (args: Value[]) => {
      const radians = typeof args[0] === 'number' ? args[0] : 0;
      return Math.sin(radians);
    });

    this.vm.registerSensor('_cos', (args: Value[]) => {
      const radians = typeof args[0] === 'number' ? args[0] : 0;
      return Math.cos(radians);
    });

    // Draw line helper - adds line to shared state
    this.vm.registerCommand('_drawLine', (args: Value[]) => {
      if (!this.sharedState) return;
      const fromX = typeof args[0] === 'number' ? args[0] : 0;
      const fromY = typeof args[1] === 'number' ? args[1] : 0;
      const toX = typeof args[2] === 'number' ? args[2] : 0;
      const toY = typeof args[3] === 'number' ? args[3] : 0;
      const color = typeof args[4] === 'string' ? args[4] : '#000000';
      const width = typeof args[5] === 'number' ? args[5] : 2;

      this.sharedState.lines.push({ fromX, fromY, toX, toY, color, width });
    });
  }

  /**
   * Load user code with TURTLE_STDLIB prepended
   */
  loadWithSource(userCode: string): void {
    const fullCode = TURTLE_STDLIB + '\n' + userCode;
    const ast = compile(fullCode);
    const program = compileToIR(ast);

    this.sharedState = this.world.toSharedState();
    this.vm.load(program);
    this.vm.setGlobal('world', this.sharedState);
  }

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

  // Expression Evaluation (for win/fail conditions)
  // Prepends stdlib so expressions can use functions like lineCount(), distanceFromStart()
  evaluateExpression(source: string): Value {
    // Assign to __result__ because expression statements pop their results
    const fullSource = TURTLE_STDLIB + '\n__result__ = ' + source;
    this.vm.evaluateExpression(fullSource);
    return this.vm.getGlobal('__result__') ?? null;
  }
}

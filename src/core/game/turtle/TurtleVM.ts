/**
 * Turtle Virtual Machine
 *
 * Wraps the pure MiniPython VM with turtle graphics bindings.
 * Commands and sensors are registered as native commands that call TurtleWorld directly.
 * TurtleWorld is the single source of truth for game state.
 */

import { VM, VMState, VMStepResult, CommandHandler } from '../../lang/vm';
import { CompiledProgram, Value } from '../../lang/ir';
import { compile, compileToIR } from '../../lang/index';
import { TurtleWorld, SharedTurtleState } from './TurtleWorld';
import { TURTLE_STDLIB, TURTLE_COLORS } from './stdlib';

export interface TurtleVMConfig {
  world: TurtleWorld;
  onPrint?: (message: string) => void;
}

/**
 * TurtleVM - MiniPython VM with turtle graphics bindings
 * Commands call TurtleWorld methods directly for single source of truth.
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
    // These call TurtleWorld methods directly (single source of truth)

    this.vm.registerCommand('forward', (args: Value[]) => {
      const distance = typeof args[0] === 'number' ? args[0] : 1;
      this.world.forward(distance);
    });
    this.vm.registerCommand('前进', (args: Value[]) => {
      const distance = typeof args[0] === 'number' ? args[0] : 1;
      this.world.forward(distance);
    });

    this.vm.registerCommand('backward', (args: Value[]) => {
      const distance = typeof args[0] === 'number' ? args[0] : 1;
      this.world.backward(distance);
    });
    this.vm.registerCommand('后退', (args: Value[]) => {
      const distance = typeof args[0] === 'number' ? args[0] : 1;
      this.world.backward(distance);
    });

    this.vm.registerCommand('turnLeft', (args: Value[]) => {
      const degrees = typeof args[0] === 'number' ? args[0] : 90;
      this.world.turnLeft(degrees);
    });
    this.vm.registerCommand('左转', (args: Value[]) => {
      const degrees = typeof args[0] === 'number' ? args[0] : 90;
      this.world.turnLeft(degrees);
    });
    this.vm.registerCommand('left', (args: Value[]) => {
      const degrees = typeof args[0] === 'number' ? args[0] : 90;
      this.world.turnLeft(degrees);
    });

    this.vm.registerCommand('turnRight', (args: Value[]) => {
      const degrees = typeof args[0] === 'number' ? args[0] : 90;
      this.world.turnRight(degrees);
    });
    this.vm.registerCommand('右转', (args: Value[]) => {
      const degrees = typeof args[0] === 'number' ? args[0] : 90;
      this.world.turnRight(degrees);
    });
    this.vm.registerCommand('right', (args: Value[]) => {
      const degrees = typeof args[0] === 'number' ? args[0] : 90;
      this.world.turnRight(degrees);
    });

    // ============ Pen Commands ============

    this.vm.registerCommand('penUp', () => { this.world.penUp(); });
    this.vm.registerCommand('抬笔', () => { this.world.penUp(); });

    this.vm.registerCommand('penDown', () => { this.world.penDown(); });
    this.vm.registerCommand('落笔', () => { this.world.penDown(); });

    this.vm.registerCommand('setColor', (args: Value[]) => {
      const color = typeof args[0] === 'string' ? args[0] : '#000000';
      // Map color names to hex values
      const mappedColor = TURTLE_COLORS[color] || color;
      this.world.setColor(mappedColor);
    });
    this.vm.registerCommand('设置颜色', (args: Value[]) => {
      const color = typeof args[0] === 'string' ? args[0] : '#000000';
      const mappedColor = TURTLE_COLORS[color] || color;
      this.world.setColor(mappedColor);
    });
    this.vm.registerCommand('颜色', (args: Value[]) => {
      const color = typeof args[0] === 'string' ? args[0] : '#000000';
      const mappedColor = TURTLE_COLORS[color] || color;
      this.world.setColor(mappedColor);
    });

    this.vm.registerCommand('setWidth', (args: Value[]) => {
      const width = typeof args[0] === 'number' ? args[0] : 2;
      this.world.setWidth(width);
    });
    this.vm.registerCommand('设置宽度', (args: Value[]) => {
      const width = typeof args[0] === 'number' ? args[0] : 2;
      this.world.setWidth(width);
    });

    // ============ Sensors ============

    this.vm.registerCommand('isPenDown', () => this.world.isPenDown());
    this.vm.registerCommand('画笔落下', () => this.world.isPenDown());

    this.vm.registerCommand('getX', () => this.world.getX());
    this.vm.registerCommand('获取X', () => this.world.getX());

    this.vm.registerCommand('getY', () => this.world.getY());
    this.vm.registerCommand('获取Y', () => this.world.getY());

    this.vm.registerCommand('getAngle', () => this.world.getAngle());
    this.vm.registerCommand('获取角度', () => this.world.getAngle());
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

  // Expression Evaluation (for win/fail conditions)
  // Prepends stdlib so expressions can use functions like lineCount(), distanceFromStart()
  evaluateExpression(source: string): Value {
    // Assign to __result__ because expression statements pop their results
    const fullSource = TURTLE_STDLIB + '\n__result__ = ' + source;
    this.vm.evaluateExpression(fullSource);
    return this.vm.getGlobal('__result__') ?? null;
  }
}

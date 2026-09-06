declare module 'cubejs' {
  export default class Cube {
    constructor();
    static initSolver(): void;
    static fromString(str: string): Cube;
    static random(): Cube;
    identity(): Cube;
    asString(): string;
    isSolved(): boolean;
    move(algorithm: string): void;
    solve(maxDepth?: number): string;
  }
}

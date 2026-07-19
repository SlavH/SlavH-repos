export function greet(name: string): string {
  return `Hello from {{name}}, ${name}!`;
}

export function version(): string {
  return '1.0.0';
}

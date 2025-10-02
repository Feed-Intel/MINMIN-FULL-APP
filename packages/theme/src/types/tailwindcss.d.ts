declare module 'tailwindcss' {
  export interface Config {
    darkMode?: string | [string, string?];
    content?: string[];
    theme?: Record<string, unknown>;
    plugins?: unknown[];
  }
}

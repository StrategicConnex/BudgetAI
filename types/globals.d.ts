// Declaraciones globales de tipos para BudgetAI

// Permite importar archivos CSS sin error de TypeScript
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Permite importar archivos de imagen
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

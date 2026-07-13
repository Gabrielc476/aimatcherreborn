import { useEffect, useRef } from "react";

/**
 * Hook para mensurar o tempo de renderização e re-renderizações de um componente React.
 * @param componentName Nome amigável do componente para identificação nos logs do console.
 */
export function useRenderProfiler(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(typeof performance !== "undefined" ? performance.now() : Date.now());

  renderCount.current += 1;
  const currentRender = renderCount.current;

  console.log(`[Render Profiler] [${componentName}] Render #${currentRender} disparado.`);

  useEffect(() => {
    const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    const duration = endTime - startTime.current;
    
    console.log(
      `%c[Render Profiler] [${componentName}] Render #${currentRender} finalizado/montado em ${duration.toFixed(2)}ms`,
      "color: #10B981; font-weight: bold;"
    );

    // Atualiza o tempo para a próxima renderização
    startTime.current = typeof performance !== "undefined" ? performance.now() : Date.now();
  });
}

/**
 * Função utilitária para medir o tempo de execução de uma operação assíncrona.
 * @param taskName Nome descritivo da tarefa.
 * @param promiseFn Função que retorna uma Promise.
 */
export async function profileAsync<T>(taskName: string, promiseFn: () => Promise<T>): Promise<T> {
  const start = typeof performance !== "undefined" ? performance.now() : Date.now();
  console.log(`[Async Profiler] Iniciando: "${taskName}"`);
  
  try {
    const result = await promiseFn();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const duration = end - start;
    console.log(
      `%c[Async Profiler] Sucesso: "${taskName}" concluído em ${duration.toFixed(2)}ms`,
      "color: #3B82F6; font-weight: bold;"
    );
    return result;
  } catch (error) {
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const duration = end - start;
    console.error(`[Async Profiler] Falha: "${taskName}" falhou após ${duration.toFixed(2)}ms. Erro:`, error);
    throw error;
  }
}

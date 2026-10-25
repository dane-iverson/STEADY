export function createSessionGeneration() {
  let generation = 0;

  return {
    capture: () => generation,
    invalidate: () => {
      generation += 1;
    },
    isCurrent: (capturedGeneration) => generation === capturedGeneration,
  };
}

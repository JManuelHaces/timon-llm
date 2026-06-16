# Glosario

- **Steering (activation steering):** empujar las activaciones internas del modelo
  durante la generación para cambiar el comportamiento (aquí, el tono).
- **SAE (Sparse Autoencoder):** red que descompone las activaciones en *features*
  interpretables y dispersos.
- **GemmaScope:** colección de SAEs **pre-entrenados** para Gemma 2/3. Los usamos
  tal cual — no entrenamos SAEs desde cero.
- **SAELens:** librería para cargar SAEs y registrar hooks en el forward pass.
- **Feature:** dirección interpretable dentro del SAE (p. ej. "formalidad"). Cada
  perilla se mapea a uno o varios features.
- **Perilla (knob):** control continuo 0–100 que el usuario mueve (Formalidad,
  Urgencia, Calidez, Detalle).
- **Preset:** conjunto de perillas guardado y nombrado (p. ej. "Voz Soporte").
- **Neuronpedia:** catálogo para explorar/identificar features de GemmaScope.

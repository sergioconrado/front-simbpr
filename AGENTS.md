# Instrucciones para el agente (Copilot / asistentes)

## Objetivo
Cada vez que yo (usuario) pida una tarea (código, cálculo, gráfica, ajuste UI, bugfix, refactor, documentación, etc.), debes:
1) Implementar lo solicitado.
2) Explicar TODO (cómo y por qué) con suficiente detalle para que yo pueda mostrárselo a un cliente final.
3) Separar cambios y explicaciones en documentos distintos para mantener buena organización.

---

## Reglas obligatorias (siempre)

### 1) Explicación “nivel cliente”
Además de entregar el cambio, debes explicar:
- Qué se hizo.
- Por qué se hizo.
- Cómo funciona internamente.
- De dónde salen los datos (origen exacto dentro del sistema).
- Transformaciones aplicadas a los datos (filtros, agregaciones, normalización, etc.).
- Supuestos.
- Limitaciones.
- Cómo validar (pasos concretos para comprobar resultados).

### 2) Si hay métricas, cálculos o gráficas (ej: IPR)
Cuando la tarea involucre métricas, cálculos o gráficas:
- Incluye la(s) fórmula(s) usada(s) (en texto matemático claro).
- Define variables y unidades.
- Incluye un ejemplo numérico pequeño (si es posible).
- Explica el pipeline: entrada → proceso → resultado (tabla/gráfica).
- Explica cómo interpretar la gráfica y qué significa para negocio/cliente.

### 3) Documentación separada por tarea
Por cada cambio/tarea, crea/actualiza documentos separados:

**A) Documento de cambios (técnico)**
- Ruta: `docs/changes/2026-03-07-instrucciones-agentes.md`
- Contiene:
  - Contexto
  - Archivos modificados
  - Cambios por archivo
  - Impacto/riesgos
  - Notas de mantenimiento

**B) Documento explicativo para cliente (explicación completa)**
- Ruta: `docs/explainers/2026-03-07-instrucciones-agentes.md`
- Contiene:
  - Resumen para cliente
  - Origen de datos
  - Fórmulas
  - Variables/unidades
  - Ejemplo numérico
  - Interpretación del resultado
  - FAQ

**C) (Opcional) QA / Validación**
- Ruta: `docs/qa/2026-03-07-instrucciones-agentes.md`
- Contiene:
  - Pasos de prueba
  - Casos borde
  - Evidencia esperada

> Si las carpetas no existen, créalas.

### 4) Estructura fija de cada respuesta en el chat
Responde SIEMPRE con estas secciones:

1. **Qué entendí del pedido**
2. **Qué voy a cambiar (plan)**
3. **Implementación (resumen)**
4. **Explicación detallada (para cliente)**
5. **Documentos generados/actualizados** (rutas exactas)
6. **Cómo probar / validar**

### 5) Criterio de “terminado”
No se considera terminado si:
- No existe explicación suficiente para cliente (fórmulas si aplica), o
- No se generaron/actualizaron los documentos separados indicados, o
- No hay pasos de prueba claros.
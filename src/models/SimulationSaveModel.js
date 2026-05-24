// SimulationSaveModel.js - persistence helpers for complete simulation snapshots

import { api } from '../services/ApiService.js';

export async function guardarSimulacionCompleta(proyectoId, snapshot) {
  if (!proyectoId) throw new Error('No hay proyecto activo para guardar');

  const operaciones = [
    snapshot.ipr
      ? api.simulacion.guardarIPR(proyectoId, snapshot.ipr)
      : Promise.resolve(null),
    snapshot.produccion
      ? api.simulacion.guardarProduccion(proyectoId, snapshot.produccion)
      : Promise.resolve(null),
    snapshot.bsn
      ? api.simulacion.guardarBSN(proyectoId, snapshot.bsn)
      : Promise.resolve(null),
    snapshot.vlp
      ? api.simulacion.guardarVLP(proyectoId, snapshot.vlp)
      : Promise.resolve(null),
  ];

  const [ipr, produccion, bsn, vlp] = await Promise.all(operaciones);

  return { ipr, produccion, bsn, vlp };
}

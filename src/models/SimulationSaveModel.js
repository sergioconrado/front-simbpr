// SimulationSaveModel.js - persistence helpers for complete simulation snapshots

import { api } from '../services/ApiService.js';

export async function guardarSimulacionCompleta(proyectoId, snapshot) {
  if (!proyectoId) throw new Error('No hay proyecto activo para guardar');

  const [ipr, produccion, bsn, vlp] = await Promise.all([
    api.simulacion.guardarIPR(proyectoId, snapshot.ipr),
    api.simulacion.guardarProduccion(proyectoId, snapshot.produccion),
    api.simulacion.guardarBSN(proyectoId, snapshot.bsn),
    api.simulacion.guardarVLP(proyectoId, snapshot.vlp),
  ]);

  return { ipr, produccion, bsn, vlp };
}

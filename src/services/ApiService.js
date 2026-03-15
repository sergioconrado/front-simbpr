// ApiService.js — Thin fetch() wrapper for the SIMBPR REST API
//
// The base URL is derived automatically:
//   • In production (served by Express), it uses the same origin.
//   • In development (Live Server on :5500), it points to the API on :3001.

const API_BASE =
  window.location.port === '5500' || window.location.port === '5501'
    ? 'http://localhost:3001/api'
    : '/api';

/**
 * Generic fetch helper — throws an Error with the server message on failure.
 * @param {string} path  — e.g. '/proyectos'
 * @param {RequestInit} [options]
 * @returns {Promise<any>} parsed JSON (or undefined for 204)
 */
async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (res.status === 204) return undefined;
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

// ── Proyectos ─────────────────────────────────────────────────────────────

export const api = {
  proyectos: {
    listar:   ()          => request('/proyectos'),
    obtener:  (id)        => request(`/proyectos/${id}`),
    crear:    (data)      => request('/proyectos', { method: 'POST', body: JSON.stringify(data) }),
    actualizar: (id, data) => request(`/proyectos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggleEstado: (id)    => request(`/proyectos/${id}/estado`, { method: 'PATCH' }),
    eliminar: (id)        => request(`/proyectos/${id}`, { method: 'DELETE' }),
  },

  simulacion: {
    obtener:    (proyectoId)       => request(`/proyectos/${proyectoId}/simulacion`),
    guardarIPR: (proyectoId, data) => request(`/proyectos/${proyectoId}/simulacion/ipr`, { method: 'PUT', body: JSON.stringify(data) }),
    guardarProduccion: (proyectoId, data) => request(`/proyectos/${proyectoId}/simulacion/produccion`, { method: 'PUT', body: JSON.stringify(data) }),
    guardarBSN: (proyectoId, data) => request(`/proyectos/${proyectoId}/simulacion/bsn`, { method: 'PUT', body: JSON.stringify(data) }),
  },
};

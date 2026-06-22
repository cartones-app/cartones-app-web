import api from './axios';
import {
    ActualizarConfiguracionArchivosRequest,
    ActualizarPreferenciasRequest,
    ArchivosGeneradosDTO,
    CargaRutaResponseDTO,
    ConfiguracionArchivosDTO,
    EliminarSesionesRequestDTO,
    ExclusionRutaRequestDTO,
    ExclusionRutaResponseDTO,
    ExportarRutaRequestDTO,
    FiltroFechaRequestDTO,
    FlagViewDTO,
    PageResponse,
    PreferenciasEtiquetasDTO,
    ProcesoDistribucionResumenDTO,
    PublicFeatureFlags,
    RegistroRutaDTO,
    SesionRutaRegistroResponseDTO,
    SesionRutaResponseDTO,
    SetFlagRequest,
    SimulacionRequestDTO,
    VendedorResponseDTO,
    VendedorSimuladoDTO
} from '@/types';

/**
 * Upload Excel file and get procesoId.
 * POST /api/vendedores/carga
 *
 * El backend responde con CargaVendedoresResponseDTO { filasIgnoradas, procesoId }.
 * Devolvemos solo el procesoId acá; si el caller necesita filasIgnoradas vamos
 * a tener que cambiar la firma.
 */
export const uploadExcel = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{ procesoId: string; filasIgnoradas?: string[] }>(
        '/api/vendedores/carga',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
    );

    return response.data.procesoId;
};

/**
 * Get list of validated vendors
 * GET /api/vendedores/{procesoId}
 */
export const getVendedores = async (procesoId: string): Promise<VendedorResponseDTO[]> => {
    const response = await api.get<VendedorResponseDTO[]>(`/api/vendedores/${procesoId}`);
    return response.data;
};

/**
 * Run distribution simulation
 * POST /api/distribuciones/{procesoId}/simular
 */
export const simularDistribucion = async (
    procesoId: string,
    data: SimulacionRequestDTO
): Promise<VendedorSimuladoDTO[]> => {
    const response = await api.post<VendedorSimuladoDTO[]>(
        `/api/distribuciones/${procesoId}/simular`,
        data
    );
    return response.data;
};

/**
 * Genera los PDFs de un proceso SIMULADO: los escribe al filesystem en el
 * backend, transiciona el estado a COMPLETADO y devuelve los timestamps.
 * POST /api/distribuciones/{procesoId}/archivos
 */
export const generarArchivosProceso = async (
    procesoId: string,
): Promise<ArchivosGeneradosDTO> => {
    const response = await api.post<ArchivosGeneradosDTO>(
        `/api/distribuciones/${procesoId}/archivos`,
    );
    return response.data;
};

/**
 * Marca el proceso como ABANDONADO. Fire-and-forget desde el front cuando el
 * usuario descarta el proceso vía "reiniciar sesión". El endpoint es
 * idempotente y devuelve 204; si el proceso ya estaba completado el backend
 * responde 422 y el caller lo ignora — no necesitamos limpiar algo terminado.
 *
 * `silent: true`: la 422 esperable (proceso ya completado) o cualquier otra
 * falla NO debe spammear toasts al usuario en medio del flujo de reiniciar.
 * El caller hace `.catch(() => {})` en el store.
 *
 * POST /api/distribuciones/{procesoId}/abandonar
 */
export const abandonarProceso = async (procesoId: string): Promise<void> => {
    await api.post(`/api/distribuciones/${encodeURIComponent(procesoId)}/abandonar`, undefined, { silent: true });
};

/**
 * Descarga el PDF de etiquetas (vista DISTRIBUIDOR, ownership-checked).
 * GET /api/distribuciones/{procesoId}/etiquetas.pdf
 */
export const descargarEtiquetas = async (procesoId: string): Promise<Blob> => {
    const response = await api.get(`/api/distribuciones/${procesoId}/etiquetas.pdf`, {
        responseType: 'blob',
    });
    return response.data;
};

/**
 * Descarga el PDF de resumen (vista DISTRIBUIDOR, ownership-checked).
 * GET /api/distribuciones/{procesoId}/resumen.pdf
 */
export const descargarResumen = async (procesoId: string): Promise<Blob> => {
    const response = await api.get(`/api/distribuciones/${procesoId}/resumen.pdf`, {
        responseType: 'blob',
    });
    return response.data;
};

/**
 * Lista los procesos de distribución del usuario autenticado.
 * GET /api/distribuciones
 */
export const listarMisDistribuciones = async (): Promise<ProcesoDistribucionResumenDTO[]> => {
    const response = await api.get<ProcesoDistribucionResumenDTO[]>('/api/distribuciones');
    return response.data;
};

/**
 * Lista todos los procesos del sistema (vista admin).
 * GET /api/admin/distribuciones
 * Requiere rol ADMIN — el backend devuelve 403 si el usuario no lo tiene.
 */
export const listarTodasLasDistribuciones = async (): Promise<ProcesoDistribucionResumenDTO[]> => {
    const response = await api.get<ProcesoDistribucionResumenDTO[]>('/api/admin/distribuciones');
    return response.data;
};

/** Versión admin de descargarEtiquetas — sin restricción de ownership. */
export const descargarEtiquetasAdmin = async (procesoId: string): Promise<Blob> => {
    const response = await api.get(`/api/admin/distribuciones/${procesoId}/etiquetas.pdf`, {
        responseType: 'blob',
    });
    return response.data;
};

/** Versión admin de descargarResumen — sin restricción de ownership. */
export const descargarResumenAdmin = async (procesoId: string): Promise<Blob> => {
    const response = await api.get(`/api/admin/distribuciones/${procesoId}/resumen.pdf`, {
        responseType: 'blob',
    });
    return response.data;
};

// --- Configuración de archivos (admin) ------------------------------------

/** GET /api/admin/configuracion-archivos */
export const obtenerConfiguracionArchivos = async (): Promise<ConfiguracionArchivosDTO> => {
    const response = await api.get<ConfiguracionArchivosDTO>('/api/admin/configuracion-archivos');
    return response.data;
};

/** PUT /api/admin/configuracion-archivos */
export const actualizarConfiguracionArchivos = async (
    body: ActualizarConfiguracionArchivosRequest,
): Promise<ConfiguracionArchivosDTO> => {
    const response = await api.put<ConfiguracionArchivosDTO>(
        '/api/admin/configuracion-archivos',
        body,
    );
    return response.data;
};

// ============================================================================
// Módulo Ruta (distribuidor)
// ============================================================================

/**
 * Sube el Excel de ruta y crea una sesión. Devuelve sesionId + fechas disponibles.
 * POST /api/ruta/carga
 */
export const cargarRutaExcel = async (file: File): Promise<CargaRutaResponseDTO> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<CargaRutaResponseDTO>('/api/ruta/carga', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

/**
 * Filtra los registros del Excel por fechas seleccionadas. Devuelve los registros
 * a completar.
 * POST /api/ruta/{sesionId}/registros
 */
export const filtrarRutaPorFechas = async (
    sesionId: string,
    body: FiltroFechaRequestDTO
): Promise<RegistroRutaDTO[]> => {
    const response = await api.post<RegistroRutaDTO[]>(
        `/api/ruta/${encodeURIComponent(sesionId)}/registros`,
        body
    );
    return response.data;
};

/**
 * Exporta el Excel modificado con los registros completados.
 * POST /api/ruta/{sesionId}/exportar
 */
export const exportarRutaExcel = async (
    sesionId: string,
    body: ExportarRutaRequestDTO
): Promise<Blob> => {
    const response = await api.post(
        `/api/ruta/${encodeURIComponent(sesionId)}/exportar`,
        body,
        { responseType: 'blob' }
    );
    return response.data;
};

// ============================================================================
// Módulo Ruta — Admin: Sesiones
// ============================================================================

/** GET /api/admin/ruta/sesiones?estado=&createdBy= */
export const listarSesionesRuta = async (params?: {
    estado?: string;
    createdBy?: string;
}): Promise<SesionRutaResponseDTO[]> => {
    const response = await api.get<SesionRutaResponseDTO[]>('/api/admin/ruta/sesiones', { params });
    return response.data;
};

/** GET /api/admin/ruta/sesiones/{sesionId} */
export const obtenerSesionRuta = async (sesionId: string): Promise<SesionRutaResponseDTO> => {
    const response = await api.get<SesionRutaResponseDTO>(
        `/api/admin/ruta/sesiones/${encodeURIComponent(sesionId)}`
    );
    return response.data;
};

/**
 * GET /api/admin/ruta/sesiones/{sesionId}/registros con filtros opcionales.
 */
export const listarRegistrosDeSesion = async (
    sesionId: string,
    params?: { completado?: boolean; vendedorNombre?: string; camposIncompletos?: boolean }
): Promise<SesionRutaRegistroResponseDTO[]> => {
    const response = await api.get<SesionRutaRegistroResponseDTO[]>(
        `/api/admin/ruta/sesiones/${encodeURIComponent(sesionId)}/registros`,
        { params }
    );
    return response.data;
};

/** DELETE /api/admin/ruta/sesiones/{sesionId} (bloquea si está ACTIVA). */
export const eliminarSesionRuta = async (sesionId: string): Promise<void> => {
    await api.delete(`/api/admin/ruta/sesiones/${encodeURIComponent(sesionId)}`);
};

/** DELETE /api/admin/ruta/sesiones (bulk). */
export const eliminarSesionesRutaBulk = async (body: EliminarSesionesRequestDTO): Promise<void> => {
    await api.delete('/api/admin/ruta/sesiones', { data: body });
};

/** DELETE /api/admin/ruta/registros/{id} */
export const eliminarRegistroRuta = async (id: number): Promise<void> => {
    await api.delete(`/api/admin/ruta/registros/${id}`);
};

// ============================================================================
// Módulo Ruta — Admin: Exclusiones
// ============================================================================

/** GET /api/admin/ruta/exclusiones */
export const listarExclusiones = async (): Promise<ExclusionRutaResponseDTO[]> => {
    const response = await api.get<ExclusionRutaResponseDTO[]>('/api/admin/ruta/exclusiones');
    return response.data;
};

/** POST /api/admin/ruta/exclusiones */
export const crearExclusion = async (
    body: ExclusionRutaRequestDTO
): Promise<ExclusionRutaResponseDTO> => {
    const response = await api.post<ExclusionRutaResponseDTO>('/api/admin/ruta/exclusiones', body);
    return response.data;
};

/** PUT /api/admin/ruta/exclusiones/{id} */
export const actualizarExclusion = async (
    id: number,
    body: ExclusionRutaRequestDTO
): Promise<ExclusionRutaResponseDTO> => {
    const response = await api.put<ExclusionRutaResponseDTO>(
        `/api/admin/ruta/exclusiones/${id}`,
        body
    );
    return response.data;
};

/** DELETE /api/admin/ruta/exclusiones/{id} */
export const eliminarExclusion = async (id: number): Promise<void> => {
    await api.delete(`/api/admin/ruta/exclusiones/${id}`);
};

// ============================================================================
// Feature flags — Admin
// ============================================================================

/** GET /api/admin/feature-flags */
export const listarFeatureFlags = async (): Promise<FlagViewDTO[]> => {
    const response = await api.get<FlagViewDTO[]>('/api/admin/feature-flags');
    return response.data;
};

/** PUT /api/admin/feature-flags/{flagKey} — crea o actualiza el override. */
export const setFeatureFlagOverride = async (
    flagKey: string,
    body: SetFlagRequest
): Promise<FlagViewDTO> => {
    const response = await api.put<FlagViewDTO>(
        `/api/admin/feature-flags/${encodeURIComponent(flagKey)}`,
        body
    );
    return response.data;
};

/** DELETE /api/admin/feature-flags/{flagKey} — vuelve al default del YAML. */
export const clearFeatureFlagOverride = async (flagKey: string): Promise<void> => {
    await api.delete(`/api/admin/feature-flags/${encodeURIComponent(flagKey)}`);
};

/**
 * GET /api/feature-flags — flags públicos (sin rol admin), usados para gating
 * de páginas del front. Devuelve { "page.upload.enabled": "true", ... }.
 *
 * `silent: true`: best-effort. Si falla durante la hidratación de NextAuth
 * (sesión todavía no resuelta, race con el rewrite de Vercel, etc.) el
 * provider cliente cae al default fail-open y reintenta cuando `status`
 * pasa a `authenticated`. Sin esto, un toast molesto aparecía al abrir
 * el home porque la request se disparaba antes de que NextAuth completara
 * la hidratación y axios reportaba "Error de Conexión" / 401.
 */
export const obtenerFlagsPublicos = async (): Promise<PublicFeatureFlags> => {
    const response = await api.get<PublicFeatureFlags>('/api/feature-flags', { silent: true });
    return response.data;
};

// --- Preferencias de impresión de etiquetas -------------------------------

/** GET /api/me/preferencias-etiquetas — devuelve la preferencia del user logueado
 *  (o defaults si nunca configuró). */
export const obtenerMisPreferenciasEtiquetas = async (): Promise<PreferenciasEtiquetasDTO> => {
    const response = await api.get<PreferenciasEtiquetasDTO>('/api/me/preferencias-etiquetas');
    return response.data;
};

/** PUT /api/me/preferencias-etiquetas — upsert de la preferencia del user logueado. */
export const guardarMisPreferenciasEtiquetas = async (
    body: ActualizarPreferenciasRequest
): Promise<PreferenciasEtiquetasDTO> => {
    const response = await api.put<PreferenciasEtiquetasDTO>('/api/me/preferencias-etiquetas', body);
    return response.data;
};

/** GET /api/admin/preferencias-etiquetas — listado paginado para el panel admin. */
export const listarPreferenciasAdmin = async (
    page = 0,
    size = 50
): Promise<PageResponse<PreferenciasEtiquetasDTO>> => {
    const response = await api.get<PageResponse<PreferenciasEtiquetasDTO>>(
        '/api/admin/preferencias-etiquetas',
        { params: { page, size } },
    );
    return response.data;
};

/** GET /api/admin/preferencias-etiquetas/{username} — lee la prefer de cualquier user. */
export const obtenerPreferenciasAdmin = async (
    username: string
): Promise<PreferenciasEtiquetasDTO> => {
    const response = await api.get<PreferenciasEtiquetasDTO>(
        `/api/admin/preferencias-etiquetas/${encodeURIComponent(username)}`,
    );
    return response.data;
};

/** PUT /api/admin/preferencias-etiquetas/{username} — upsert por cuenta del user. */
export const guardarPreferenciasAdmin = async (
    username: string,
    body: ActualizarPreferenciasRequest,
): Promise<PreferenciasEtiquetasDTO> => {
    const response = await api.put<PreferenciasEtiquetasDTO>(
        `/api/admin/preferencias-etiquetas/${encodeURIComponent(username)}`,
        body,
    );
    return response.data;
};

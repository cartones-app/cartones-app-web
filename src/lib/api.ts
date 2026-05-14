import api from './axios';
import {
    CargaRutaResponseDTO,
    EliminarSesionesRequestDTO,
    ExclusionRutaRequestDTO,
    ExclusionRutaResponseDTO,
    ExportarRutaRequestDTO,
    FiltroFechaRequestDTO,
    ProcesoDistribucionResumenDTO,
    RegistroRutaDTO,
    SesionRutaRegistroResponseDTO,
    SesionRutaResponseDTO,
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
 * Download ZIP file containing PDFs
 * GET /api/distribuciones/{procesoId}/pdfs
 */
export const downloadPdfs = async (procesoId: string): Promise<Blob> => {
    const response = await api.get(`/api/distribuciones/${procesoId}/pdfs`, {
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

/**
 * Descarga el ZIP del proceso (vista admin, sin restricción de ownership).
 * GET /api/admin/distribuciones/{procesoId}/pdfs
 */
export const downloadPdfsAdmin = async (procesoId: string): Promise<Blob> => {
    const response = await api.get(`/api/admin/distribuciones/${procesoId}/pdfs`, {
        responseType: 'blob',
    });
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

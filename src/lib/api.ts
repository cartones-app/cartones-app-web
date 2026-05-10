import api from './axios';
import {
    ProcesoDistribucionResumenDTO,
    SimulacionRequestDTO,
    VendedorResponseDTO,
    VendedorSimuladoDTO
} from '@/types';

/**
 * Upload Excel file and get procesoId
 * POST /api/vendedores/carga
 */
export const uploadExcel = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<string>('/api/vendedores/carga', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
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
 * Delete all vendors (cleanup)
 * DELETE /api/vendedores
 */
export const deleteVendedores = async (): Promise<void> => {
    await api.delete('/api/vendedores');
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

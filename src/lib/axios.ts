import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { BackendErrorResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9050';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response error interceptor for global error handling
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<BackendErrorResponse>) => {
        const response = error.response;

        if (!response) {
            toast.error('Error de Conexión', {
                description: 'No se pudo conectar con el servidor. Verifica tu conexión.',
            });
            return Promise.reject(error);
        }

        const { status, data } = response;
        const message = data?.message || 'Ha ocurrido un error inesperado';
        const details = data?.details || [];

        switch (status) {
            case 422:
                // Excel Processing Error - Show message with details
                {
                    const detailsText = details.length > 0 ? `\n${details.join('\n')}` : '';
                    toast.error(data?.error || 'Error de Procesamiento', {
                        description: `${message}${detailsText}`,
                        duration: 8000,
                    });
                }
                break;

            case 400:
                // Validation / Missing File Error
                toast.warning(data?.error || 'Error de Validación', {
                    description: message,
                    duration: 5000,
                });
                break;

            case 404:
                // Not Found
                toast.info('Recurso no encontrado', {
                    description: message,
                    duration: 4000,
                });
                break;

            case 500:
                // Server Error
                toast.error('Error Crítico del Servidor', {
                    description: 'Ha ocurrido un error interno. Por favor, intenta más tarde.',
                    duration: 6000,
                });
                break;

            default:
                toast.error('Error', {
                    description: message,
                    duration: 5000,
                });
        }

        return Promise.reject(error);
    }
);

export default api;

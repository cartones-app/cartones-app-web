import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getSession, signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { BackendErrorResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
    console.warn('NEXT_PUBLIC_API_URL is not defined in environment variables');
}

// Flag de modulo para dedup de re-login: si varias requests reciben 401 al
// mismo tiempo, solo una dispara signIn() (el resto queda en flight hasta el
// redirect).
let reauthInFlight = false;

function triggerReauth() {
    if (reauthInFlight) return;
    reauthInFlight = true;
    // Envolvemos en Promise.resolve().then(...) por si signIn() lanza de forma
    // sincrona — el .finally() corre igual y el flag no queda atascado.
    Promise.resolve()
        .then(() => signIn('keycloak'))
        .finally(() => {
            reauthInFlight = false;
        });
}

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: inject the Keycloak access token from the NextAuth session.
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    if (typeof window === 'undefined') {
        // SSR: el interceptor de cliente no aplica.
        return config;
    }
    const session = await getSession();
    // Si el refresh silencioso del JWT callback falló, no enviamos un token rancio
    // — disparamos re-login y abortamos esta request (el backend la rechazaría con
    // 401 de todas formas).
    if (session?.error === 'RefreshAccessTokenError') {
        triggerReauth();
        return Promise.reject(
            new axios.CanceledError('Sesión expirada — re-login en curso'),
        );
    }
    if (session?.accessToken) {
        config.headers.set('Authorization', `Bearer ${session.accessToken}`);
    }
    return config;
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
            case 401:
                // Sesión expirada o token inválido: forzar re-login. triggerReauth()
                // dedupa internamente si varias requests reciben 401 al mismo tiempo.
                // Mostramos el toast solo si efectivamente vamos a disparar el signIn.
                if (typeof window !== 'undefined' && !reauthInFlight) {
                    toast.warning('Sesión expirada', {
                        description: 'Por favor, iniciá sesión de nuevo.',
                        duration: 4000,
                    });
                }
                triggerReauth();
                break;

            case 403:
                toast.error('Permiso denegado', {
                    description: 'Tu usuario no tiene acceso a esta operación.',
                    duration: 5000,
                });
                break;

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

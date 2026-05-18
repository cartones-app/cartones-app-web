import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getSession, signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { BackendErrorResponse } from '@/types';

/**
 * Extiende AxiosRequestConfig con `silent` para suprimir los toasts del
 * interceptor de respuesta. Pensado para fetches "best-effort" en background
 * que pueden fallar sin que importe al usuario (ej.: feature flags durante
 * la hidratación de NextAuth — si fallan, defaults asumen "todo habilitado"
 * y el provider reintenta cuando la sesión queda lista).
 *
 * Sin esto, durante la ventana de hidratación cualquier fetch que dispare
 * por race (sesión todavía no resuelta → 401 / Vercel rewrite → no response)
 * mostraba un toast molesto que desaparecía al instante.
 */
declare module 'axios' {
    interface AxiosRequestConfig {
        silent?: boolean;
    }
}

/**
 * baseURL del cliente: SAME-ORIGIN via el proxy interno de Next (ver
 * `next.config.ts` → rewrites). El browser nunca llega directo al backend —
 * todas las llamadas van a `/api-proxy/api/...` y Next forwardea internamente.
 *
 * Beneficios:
 *  - La URL real del backend queda fuera del bundle del cliente.
 *  - CORS deja de ser problema (todo es same-origin).
 *  - En prod, el backend puede no exponer puerto público — solo accesible
 *    via DNS interno docker desde Next y nginx.
 */
const API_BASE_URL = '/api-proxy';

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
        // `silent: true` desde el caller: el caller maneja el error a su
        // manera (típicamente fail-open), no queremos toast global.
        const silent = error.config?.silent === true;

        // `axios.isCancel`: cubre el path donde NOSOTROS mismos cancelamos
        // la request (request interceptor cuando RefreshAccessTokenError).
        // Esa cancelación intencional NO debe mostrar "Error de Conexión".
        if (axios.isCancel(error)) return Promise.reject(error);

        if (!response) {
            if (!silent) {
                toast.error('Error de Conexión', {
                    description: 'No se pudo conectar con el servidor. Verifica tu conexión.',
                });
            }
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
                // El reauth corre SIEMPRE (incluso silent) — sin reauth la app
                // queda con sesión inválida sin avisarle a nadie.
                if (!silent && typeof window !== 'undefined' && !reauthInFlight) {
                    toast.warning('Sesión expirada', {
                        description: 'Por favor, iniciá sesión de nuevo.',
                        duration: 4000,
                    });
                }
                triggerReauth();
                break;

            case 403:
                if (!silent) {
                    toast.error('Permiso denegado', {
                        description: 'Tu usuario no tiene acceso a esta operación.',
                        duration: 5000,
                    });
                }
                break;

            case 422:
                // Excel Processing Error - Show message with details
                if (!silent) {
                    const detailsText = details.length > 0 ? `\n${details.join('\n')}` : '';
                    toast.error(data?.error || 'Error de Procesamiento', {
                        description: `${message}${detailsText}`,
                        duration: 8000,
                    });
                }
                break;

            case 400:
                if (!silent) {
                    // Validation / Missing File Error
                    toast.warning(data?.error || 'Error de Validación', {
                        description: message,
                        duration: 5000,
                    });
                }
                break;

            case 404:
                if (!silent) {
                    toast.info('Recurso no encontrado', {
                        description: message,
                        duration: 4000,
                    });
                }
                break;

            case 500:
                if (!silent) {
                    toast.error('Error Crítico del Servidor', {
                        description: 'Ha ocurrido un error interno. Por favor, intenta más tarde.',
                        duration: 6000,
                    });
                }
                break;

            default:
                if (!silent) {
                    toast.error('Error', {
                        description: message,
                        duration: 5000,
                    });
                }
        }

        return Promise.reject(error);
    }
);

export default api;

// API DTOs based on backend documentation

export interface RangoCortadoDTO {
    inicio: number;
    fin: number;
}

export interface VendedorInputDTO {
    id: number;
    nombre: string;
    cantidadSenete: number;
    terminacionSenete?: number | null;
    cantidadTelebingo: number;
    terminacionTelebingo?: number | null;
}

export interface SimulacionRequestDTO {
    poolSenete: RangoCortadoDTO[];
    poolTelebingo: RangoCortadoDTO[];
    vendedores: VendedorInputDTO[];
    mezclar: boolean;
    fechaSorteoSenete: string | null; // YYYY-MM-DD or null
    fechaSorteoTelebingo: string | null; // YYYY-MM-DD or null
    inicioSenete?: number | null;
    inicioTelebingo?: number | null;
}

export interface VendedorSimuladoDTO {
    id: number;
    nombre: string;
    rangosSenete: string[];
    rangosTelebingo: string[];
}

export interface VendedorResponseDTO {
    id: number;
    nombre: string;
    deuda: number;
    cantidadSenete: number;
    resultadoSenete: number;
    cantidadTelebingo: number;
    resultadoTelebingo: number;
}

// Error response from backend GlobalExceptionHandler
export interface BackendErrorResponse {
    status: number;
    error: string;
    message: string;
    details: string[];
}

// Form types for the wizard
export interface PoolRangeForm {
    inicio: string;
    fin: string;
}

export interface ConfigurationFormData {
    fechaSorteoSenete: Date | undefined;
    fechaSorteoTelebingo: Date | undefined;
    poolSenete: PoolRangeForm[];
    poolTelebingo: PoolRangeForm[];
    mezclar: boolean;
    vendedores: VendedorInputDTO[];
    inicioSeneteGral: string;
    inicioTelebingoGral: string;
}

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

// Resumen de un ProcesoDistribucion para listados.
// Backend: ProcesoDistribucionResumenDTO. NO incluye los PDFs (BLOBs).
export interface ProcesoDistribucionResumenDTO {
    procesoId: string;
    estado: string;
    createdAt: string; // ISO 8601 (LocalDateTime serializado)
    updatedAt: string;
    createdBy: string;
    tieneEtiquetas: boolean;
    tieneResumen: boolean;
    tamanoEtiquetasBytes: number;
    tamanoResumenBytes: number;
}

// ============================================================================
// Módulo Ruta
// ============================================================================

/** Backend: CargaRutaResponseDTO. POST /api/ruta/carga */
export interface CargaRutaResponseDTO {
    sesionId: string;
    fechasDisponibles: string[];
}

/** Backend: FiltroFechaRequestDTO. POST /api/ruta/{sesionId}/registros */
export interface FiltroFechaRequestDTO {
    fechas: string[];
}

/** Backend: RegistroRutaDTO. Item del listado tras filtrar por fechas. */
export interface RegistroRutaDTO {
    vendedorId: number;
    nombre: string;
    fecha: string;
    deudaAnterior: number;
    numeroFila: number;
    seneteTotalEnviado: number | null;
    telebingoTotalEnviado: number | null;
    refSenete: number | null;
    refTelb: number | null;
    devSen: number | null;
    devTelb: number | null;
    pago1: number | null;
    pago2: number | null;
    nota: string | null;
}

/** Backend: ExportarRutaRequestDTO. POST /api/ruta/{sesionId}/exportar */
export interface ExportarRutaRequestDTO {
    registros: RegistroRutaDTO[];
}

/** Backend: SesionRutaResponseDTO. Admin: vista listado. */
export interface SesionRutaResponseDTO {
    id: number;
    sesionId: string;
    fechaFiltro: string;
    estado: string;
    totalRegistros: number | null;
    registrosCompletados: number | null;
    createdAt: string;
    createdBy: string;
}

/** Backend: SesionRutaRegistroResponseDTO. Admin: detalle de registros de una sesión. */
export interface SesionRutaRegistroResponseDTO {
    id: number;
    vendedorNombre: string | null;
    fecha: string;
    seneteTotalEnviado: number | null;
    telebingoTotalEnviado: number | null;
    refSenete: number | null;
    refTelb: number | null;
    devSen: number | null;
    devTelb: number | null;
    pago1: number | null;
    pago2: number | null;
    nota: string | null;
    completado: boolean | null;
    createdAt: string;
}

/** Backend: EliminarSesionesRequestDTO. DELETE /api/admin/ruta/sesiones (bulk). */
export interface EliminarSesionesRequestDTO {
    sesionIds: string[];
}

/** Backend: ExclusionRutaRequestDTO. POST/PUT /api/admin/ruta/exclusiones[/{id}] */
export interface ExclusionRutaRequestDTO {
    nombre: string;
    descripcion?: string;
    activo?: boolean;
}

/** Backend: ExclusionRutaResponseDTO. */
export interface ExclusionRutaResponseDTO {
    id: number;
    nombre: string;
    descripcion: string | null;
    activo: boolean;
    createdAt: string;
    createdBy: string | null;
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

// ============================================================================
// Feature flags (admin)
// ============================================================================

export type FlagValueType = "BOOLEAN" | "STRING" | "LONG";

/** Backend: FlagViewDTO. GET /api/admin/feature-flags. */
export interface FlagViewDTO {
    key: string;
    type: FlagValueType;
    description: string;
    defaultValue: string;
    effectiveValue: string;
    hasOverride: boolean;
    overrideValue: string | null;
    overrideReason: string | null;
    modifiedBy: string | null;
    updatedAt: string | null; // ISO LocalDateTime
}

/** Backend: SetFlagRequest. PUT /api/admin/feature-flags/{key}. */
export interface SetFlagRequest {
    value: string;
    reason?: string;
}

/**
 * Backend: GET /api/feature-flags — map de flag key → valor efectivo serializado.
 * Solo incluye los flags marcados publicRead=true en el registry.
 */
export type PublicFeatureFlags = Record<string, string>;

// ============================================================================
// PDF templates (editor visual)
// ============================================================================

export type PdfTemplateTipo = "ETIQUETAS" | "RESUMEN";

/** Backend: PdfTemplateResumenDTO. Item del listado admin (sin schemaJson). */
export interface PdfTemplateResumen {
    id: string;
    tipo: PdfTemplateTipo;
    nombre: string;
    activo: boolean;
    /** Slots por página A4 (solo aplica a ETIQUETAS). 3 o 4 típicamente. */
    slotsPorPagina: number;
    updatedAt: string; // ISO LocalDateTime
}

/** Backend: PdfTemplateDetalleDTO. Detalle / edición (incluye schemaJson). */
export interface PdfTemplateDetalle {
    id: string;
    tipo: PdfTemplateTipo;
    nombre: string;
    schemaJson: string;
    activo: boolean;
    slotsPorPagina: number;
    createdAt: string;
    updatedAt: string;
}

/** Backend: PdfTemplateActiveDTO. Lo que el cliente lee al generar PDFs. */
export interface PdfTemplateActive {
    id: string;
    tipo: PdfTemplateTipo;
    nombre: string;
    schemaJson: string;
    slotsPorPagina: number;
}

/** Backend: PdfTemplateCreateDTO. */
export interface PdfTemplateCreateRequest {
    tipo: PdfTemplateTipo;
    nombre: string;
    schemaJson: string;
    /** Default 3 si no se manda. Valida 1..6 en el backend. */
    slotsPorPagina?: number;
}

/** Backend: PdfTemplateUpdateDTO. */
export interface PdfTemplateUpdateRequest {
    nombre: string;
    schemaJson: string;
    slotsPorPagina?: number;
}

// ============================================================================
// Datos del proceso para armar PDFs en el cliente
// ============================================================================

/** Backend: EtiquetaDTO. Una por vendedor (3 entran en una página A4). */
export interface EtiquetaInput {
    numeroVendedor: number;
    nombre: string;
    saldo: string;
    seneteRangos: string[];
    seneteCartones: string;
    resultadoSenete: string;
    telebingoRangos: string[];
    telebingoCartones: string;
    resultadoTelebingo: string;
}

/** Backend: ResumenDTO. Una fila por vendedor en la tabla del resumen. */
export interface ResumenInput {
    numeroVendedor: number;
    nombre: string;
    seneteDelAl: Record<string, string>;
    cantidadSenete: number;
    telebingoDelAl: Record<string, string>;
    cantidadTelebingo: number;
}

/** Backend: DistribucionDatosPdfDTO. GET /api/distribuciones/{id}/datos. */
export interface DistribucionDatosPdf {
    etiquetas: EtiquetaInput[];
    resumen: ResumenInput[];
    fechaSorteoSenete: string; // YYYY-MM-DD
    fechaSorteoTelebingo: string;
}

// Estructura del documento OpenAPI 3.0; las extensiones conservan valores desconocidos.
export interface Schema {
  $ref?: string;
  type?: string;
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  additionalProperties?: boolean | Schema;
  [key: string]: unknown;
}
export interface Response {
  description: string;
  content?: Record<string, { schema: Schema }>;
}
export interface Operation {
  description?: string;
  tags?: string[];
  summary?: string;
  security?: Record<string, string[]>[];
  parameters?: unknown[];
  deprecated?: boolean;
  requestBody?: { required?: boolean; content: Record<string, { schema: Schema }> };
  responses: Record<string, Response>;
}
export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  patch?: Operation;
  delete?: Operation;
  parameters?: unknown[];
}
export interface Document {
  openapi: string;
  info: Record<string, unknown>;
  servers: Record<string, unknown>[];
  tags: Record<string, unknown>[];
  components: {
    schemas: Record<string, Schema>;
    securitySchemes: Record<string, Record<string, unknown>>;
  };
  paths: Record<string, PathItem>;
}

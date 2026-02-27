import { OPCION_METHOD_OPNTIONS,OPCION_PATHNAME,OPCION_FAIL } from "@/utilities/options";
import { CORS_HEADERS } from "@/utilities/cors";

Bun.serve({
    port: process.env.PORT_SERVER ?? 8080,
    async fetch(req) {
        const { pathname } = new URL(req.url)
        const method = req.method
        console.log("Servidor iniciado 🗸");

        // Handle CORS preflight requests
        if (method === "OPTIONS") return  OPCION_METHOD_OPNTIONS;

        const handlers = OPCION_PATHNAME[pathname as keyof typeof OPCION_PATHNAME];
        const handler = handlers ? (handlers as Record<string, any>)[method] : undefined;

        if (handler) {
            try {                
                return await (handler as (req: Request) => Response | Promise<Response>)(req)
            } catch (error) {
                console.error(`❌ Error -> No existe la funcion para esta ruta o handling rute ${method} ${pathname}:`, error);
                
                return new Response(JSON.stringify({
                    message: "Error interno del servidor: handling rute",
                    status: 500,
                    error: error instanceof Error ? error.message : String(error)
                }), {
                    status: 500,
                    headers: CORS_HEADERS
                });
            }
        }
        return OPCION_FAIL
    }
})

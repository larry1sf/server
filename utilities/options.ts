import { serviceGroq } from "@/services/ia/groq";
import { CORS_HEADERS } from "@/utilities/cors";
import { getMessagesInitial, getHistoryChat, setHistoryCloud } from '@/utilities/promptsAssist';

export const OPCION_FAIL = new Response(JSON.stringify({
    message: "Fallo la peticion a la ruta",
    status: 404
}), {
    status: 404,
    headers: CORS_HEADERS
})

export const OPCION_METHOD_OPNTIONS = new Response(null, {
    status: 204,
    headers: CORS_HEADERS
})

// Mapa para almacenar el historial de conversaciones por sessionId

const home = {
    "GET": async (req: Request) => {
        // Generar un sessionId único para cada cliente
        const sessionId = req.headers.get('x-session-id') || Bun.randomUUIDv7();

        // Obtener el historial de conversación existente o crear uno nuevo
        let historyCloud = await getHistoryChat()
        const history = []
        // Añadir el contexto inicial si no existe

        if (Object.values(historyCloud ?? {}).length === 0) {
            const messagesInitial = await getMessagesInitial()

            history.push({
                role: "system",
                content: messagesInitial
            })
        }

        // Guardar el historial actualizado
        await setHistoryCloud(sessionId, history)
        return new Response(JSON.stringify({
            sessionId,
            message: "Conversación iniciada. Puedes empezar a hacer preguntas."
        }), { headers: CORS_HEADERS })
    },
    "POST": async (req: Request) => {
        // Obtener el sessionId del encabezado
        const sessionId = req.headers.get('x-session-id');
        if (!sessionId) {
            return new Response(JSON.stringify({
                message: "Se requiere allas iniciado la conversación para continuar"
            }), { status: 400, headers: CORS_HEADERS });
        }

        // rescatamos el mensaje del usuario
        const body = await req.body?.json() as { userMessage: string };
        const { userMessage } = body;

        // Obtener el historial de conversación existente
        const historyCloud = await getHistoryChat()
        const historyUser = historyCloud?.[sessionId]

        // Añadir el mensaje del usuario al historial
        const h = [...historyUser, {
            role: "user",
            content: userMessage
        }]

        //  le enviamos el historial completo a la ia
        const responseIa = await serviceGroq({
            messages: h
        });

        // Añadir la respuesta de la IA al historial
        h.push({
            role: "assistant",
            content: responseIa
        })

        // Guardar el historial actualizado
        await setHistoryCloud(sessionId, h)

        // contestamos con el mensaje de la ia
        return new Response(JSON.stringify({
            message: responseIa,
        }), { headers: CORS_HEADERS })
    }
}

const history = {
    "GET": async (req: Request) => {
        const sessionId = req.headers.get('x-session-id');
        if (!sessionId) {
            return new Response(JSON.stringify({
                message: "Se requiere el header x-session-id"
            }), { status: 400, headers: CORS_HEADERS });
        }

        const historyCloud = await getHistoryChat();
        const sessionHistory = historyCloud?.[sessionId];

        if (!sessionHistory || sessionHistory.length === 0) {
            return new Response(JSON.stringify({ messages: [] }), { headers: CORS_HEADERS });
        }

        // Filtramos el mensaje de sistema para que el cliente solo reciba user/assistant
        const messages = sessionHistory.filter((m: { role: string; content: string }) => m.role !== "system");

        return new Response(JSON.stringify({ messages }), { headers: CORS_HEADERS });
    }
}

export const OPCION_PATHNAME = {
    // home
    "/": home,
    "/history": history
}

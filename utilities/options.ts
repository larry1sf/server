import { serviceGroq, generateTitle } from "@/services/ia/groq";
import { CORS_HEADERS } from "@/utilities/cors";
import { getMessagesInitial, getHistoryChat, setHistoryCloud, getUserConversations } from '@/utilities/promptsAssist';

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
        // Obtener el userId del encabezado o crear uno nuevo
        const userId = req.headers.get('x-session-id') || Bun.randomUUIDv7();

        return new Response(JSON.stringify({
            userId,
            message: "Sesión iniciada."
        }), { headers: CORS_HEADERS })
    },
    "POST": async (req: Request) => {
        const userId = req.headers.get('x-session-id');
        let conversationId = req.headers.get('x-conversation-id');

        if (!userId) {
            return new Response(JSON.stringify({
                message: "Se requiere un ID de sesión"
            }), { status: 400, headers: CORS_HEADERS });
        }

        const body = await req.json() as { userMessage: string };
        const { userMessage } = body;

        if (!conversationId) {
            conversationId = Bun.randomUUIDv7();
        }

        // Obtener historial existente
        let historyUser = await getHistoryChat(userId, conversationId);
        let isFirstMessage = false;

        if (!historyUser || historyUser.length === 0) {
            const messagesInitial = await getMessagesInitial();
            historyUser = [{
                role: "system",
                content: messagesInitial
            }];
            isFirstMessage = true;
        }

        // Añadir mensaje del usuario
        const h = [...historyUser, {
            role: "user",
            content: userMessage
        }]

        // Generar título si es el primer mensaje
        let title;
        if (isFirstMessage) {
            title = await generateTitle(userMessage);
        }

        // Obtener respuesta de IA
        const responseIa = await serviceGroq({
            messages: h
        });

        // Añadir respuesta de IA
        h.push({
            role: "assistant",
            content: responseIa
        })

        // Guardar historial
        await setHistoryCloud(userId, conversationId, h, title);

        return new Response(JSON.stringify({
            message: responseIa,
            conversationId,
            title: title || undefined
        }), { headers: CORS_HEADERS })
    }
}

const history = {
    "GET": async (req: Request) => {
        const userId = req.headers.get('x-session-id');
        const conversationId = req.headers.get('x-conversation-id');

        if (!userId || !conversationId) {
            return new Response(JSON.stringify({
                message: "Se requiere x-session-id y x-conversation-id"
            }), { status: 400, headers: CORS_HEADERS });
        }

        const sessionHistory = await getHistoryChat(userId, conversationId);

        if (!sessionHistory) {
            return new Response(JSON.stringify({ messages: [] }), { headers: CORS_HEADERS });
        }

        const messages = sessionHistory.filter((m: { role: string; content: string }) => m.role !== "system");

        return new Response(JSON.stringify({ messages }), { headers: CORS_HEADERS });
    }
}

const conversations = {
    "GET": async (req: Request) => {
        const userId = req.headers.get('x-session-id');
        if (!userId) {
            return new Response(JSON.stringify({
                message: "Se requiere x-session-id"
            }), { status: 400, headers: CORS_HEADERS });
        }

        const userConvs = await getUserConversations(userId);
        return new Response(JSON.stringify({ conversations: userConvs }), { headers: CORS_HEADERS });
    }
}

export const OPCION_PATHNAME = {
    "/": home,
    "/history": history,
    "/conversations": conversations
}

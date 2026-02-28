import { db } from "@/db/firebase"
const COLLECTION_NAME = {
    conversaciones: "conversaciones",
    inicio: "memoria-inicio"
}

export const getMessagesInitial = async () => {

    const snapshot = await db.collection(COLLECTION_NAME.inicio).get()
    const res: string[] = []
    snapshot.forEach((doc) => {
        res.push(Object.values(doc.data()).join(", "))
    });
    return res.join("\n")
}

export const getHistoryChat = async (userId: string, conversationId: string) => {
    const snapshot = db.collection(COLLECTION_NAME.conversaciones).doc(userId)
    const doc = await snapshot.get()

    if (!doc.exists)
        return null

    const data = doc.data()
    return data?.[conversationId]?.messages || null
}

export const getUserConversations = async (userId: string) => {
    const snapshot = db.collection(COLLECTION_NAME.conversaciones).doc(userId)
    const doc = await snapshot.get()

    if (!doc.exists)
        return []

    const data = doc.data() || {}
    return Object.entries(data).map(([id, conv]: [string, any]) => ({
        id,
        title: conv.title || "Sin título",
        lastUpdate: conv.lastUpdate
    })).sort((a, b) => b.lastUpdate - a.lastUpdate)
}

export const setHistoryCloud = async (
    userId: string,
    conversationId: string,
    history: {
        role: string;
        content: string;
    }[],
    title?: string
) => {
    const docRef = db.collection(COLLECTION_NAME.conversaciones).doc(userId)

    const updateData: any = {
        [`${conversationId}.messages`]: history,
        [`${conversationId}.lastUpdate`]: Date.now()
    }

    if (title) {
        updateData[`${conversationId}.title`] = title
    }

    await docRef.update(updateData).catch(async (error) => {
        // If document doesn't exist, use set instead
        if (error.code === 5 || error.message.includes('NOT_FOUND')) {
            const newData = {
                [conversationId]: {
                    messages: history,
                    lastUpdate: Date.now(),
                    title: title || "Nuevo Chat"
                }
            }
            await docRef.set(newData)
        } else {
            throw error
        }
    })

    return true
}
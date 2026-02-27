import { db } from "@/db/firebase"
const COLLECTION_NAME = {
    asoandes: "asoandes",
    inicio: "memoria-inicio"
}

const DOCUMENTS_COLLECTION = {
    quienesSomos: 'quienes-somos',
    ayuda: 'ayuda-ia',
    conversacion: 'conversaciones'
}

export const getMessagesInitial = async () => {

    const snapshot = await db.collection(COLLECTION_NAME.inicio).get()
    const res: string[] = []
    snapshot.forEach((doc) => {
        res.push(Object.values(doc.data()).join(", "))
    });
    return res.join("\n")
}

export const getHistoryChat = async () => {
    const snapshot = db.collection(COLLECTION_NAME.asoandes).doc(DOCUMENTS_COLLECTION.conversacion)
    const doc = await snapshot.get()

    if (!doc.exists)
        return null

    return doc.data()
}

export const setHistoryCloud = async (
    sessionId: string,
    history: {
        role: string;
        content: string;
    }[]
) => {
    const data = { [sessionId]: history }
    db.collection(COLLECTION_NAME.asoandes).doc(DOCUMENTS_COLLECTION.conversacion).set(data)
    return true
}
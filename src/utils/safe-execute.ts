type CallbackFunction<T> = () => T;

export default async function safeExecute<T>(callback: CallbackFunction<T>): Promise<T | undefined> {
    try {
        return await callback();
    } catch (error) {
        console.error("Ocorreu um error ao executar:", error);
        return undefined;
    }
}
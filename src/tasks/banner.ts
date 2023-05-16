import init, { initialize, parseFile } from "wasm-html-ad-viewer"

type BannerType = "adobe" | "gwd" | "other"

export interface WorkerInput {
    id: string
    file: File
}

export interface WorkerOutput {
    id: string
    type: BannerType
    url: string
}

self.addEventListener("message", async e => {
    const output = await work(e.data)
    postMessage(output)
})

async function work(data: WorkerInput): Promise<WorkerOutput> {
    await init()
    initialize()

    const buffer = await readFileBuffer(data.file)
    const result = await parseFile(buffer)

    // await new Promise((res) => setTimeout(res, 3000))

    return {
        id: data.id,
        type: result.mode as BannerType,
        url: result.url,
    }
}

async function readFileBuffer(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.addEventListener("loadend", () => resolve(new Uint8Array(reader.result as ArrayBuffer)))
        reader.addEventListener("error", reject)

        reader.readAsArrayBuffer(file)
    })
}
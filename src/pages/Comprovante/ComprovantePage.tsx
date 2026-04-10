import { useEffect, useState } from 'react'

export function ComprovantePage() {
    const [blobUrl, setBlobUrl] = useState<string | null>(null)
    const [erro, setErro] = useState(false)

    const params = new URLSearchParams(window.location.search)
    const url = params.get('url')

    useEffect(() => {
        if (!url) return

        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error()
                return res.blob()
            })
            .then(blob => {
                setBlobUrl(URL.createObjectURL(blob))
            })
            .catch(() => setErro(true))

        return () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl)
        }
    }, [url])

    if (!url) return (
        <div className="flex h-screen items-center justify-center">
            <p className="text-gray-400">URL do comprovante não informada.</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4">
            <div className="bg-white rounded-2xl shadow-lg p-4 w-full max-w-4xl">
                <div className="flex items-center justify-center mb-4">
                    <h1 className="font-montserrat font-semibold text-brand">Comprovante</h1>
                    
                </div>

                {erro && (
                    <p className="text-center text-red-400 py-8 text-sm">Erro ao carregar o comprovante.</p>
                )}

                {!blobUrl && !erro && (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 rounded-full border-3 border-gray-200 border-t-brand animate-spin" />
                    </div>
                )}

                {blobUrl && (
                    <iframe
                        src={blobUrl}
                        className="w-full rounded-xl border"
                        style={{ height: '80vh' }}
                        title="Comprovante"
                    />
                )}
            </div>
        </div>
    )
}
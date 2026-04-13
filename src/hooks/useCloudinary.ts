const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const BASE_FOLDER = 'app'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_MB = 5

interface UploadError {
  tipo: 'formato' | 'tamanho'
  mensagem: string
}

export function validarImagem(file: File): UploadError | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { tipo: 'formato', mensagem: 'Formato inválido. Use JPG, PNG ou WebP.' }
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { tipo: 'tamanho', mensagem: `A imagem deve ter no máximo ${MAX_SIZE_MB}MB.` }
  }

  return null
}

export async function uploadImagem(file: File, folder?: string): Promise<string | null> {
  const erro = validarImagem(file)
  if (erro) throw new Error(erro.mensagem)

  const pastaFinal = folder ? `${BASE_FOLDER}/${folder}` : BASE_FOLDER

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', pastaFinal)

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    return data.secure_url ?? null
  } catch {
    return null
  }
}
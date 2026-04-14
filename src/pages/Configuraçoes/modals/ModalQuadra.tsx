import { useEffect, useRef, useState } from 'react'
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, useDisclosure,
} from '@heroui/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlbumNotFound01Icon } from '@hugeicons/core-free-icons'
import { useTodosEsportes, type QuadraCompleta } from '../../../hooks/configuracoes/useConfiguracoesQuadras'
import { ModalCropImagem } from './ModalCropImagem'
import { validarImagem } from '../../../hooks/useCloudinary'

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  quadra?: QuadraCompleta | null
  onSalvar: (dados: {
    id?: string
    name: string
    image_url: string | null
    sport_ids: string[]
  }) => Promise<boolean | string>
}

const inputClass = {
  innerWrapper: 'flex items-center gap-2 bg-lightblue py-3 px-4 rounded-xl',
  input: 'text-sm focus:outline-none border-transparent focus:border-transparent focus:ring-0',
  inputWrapper: 'p-0',
}

export function ModalQuadra({ isOpen, onOpenChange, quadra, onSalvar }: Props) {
  const { esportes: todosEsportes } = useTodosEsportes()

  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [sportIds, setSportIds] = useState<string[]>([])
  const [uploading, _setUploading] = useState(false)
  const [cropFileName, setCropFileName] = useState('quadra.jpg')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const cropModal = useDisclosure()

  useEffect(() => {
    if (quadra) {
      setName(quadra.name)
      setImageUrl(quadra.image_url)
      setSportIds(quadra.esportes.map(e => e.id))
    } else {
      setName('')
      setImageUrl(null)
      setSportIds([])
    }
    setErro(null)
  }, [quadra, isOpen])

  function toggleEsporte(id: string) {
    setSportIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCropFileName(file.name)

    const erro = validarImagem(file)
    if (erro) {
      setErro(erro.mensagem)
      e.target.value = ''
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setCropSrc(objectUrl)
    cropModal.onOpen()
    e.target.value = ''
  }

  async function handleSalvar(onClose: () => void) {
    setErro(null)
    if (!name.trim()) return setErro('Informe o nome da quadra.')

    setSaving(true)
    const resultado = await onSalvar({
      id: quadra?.id,
      name: name.trim(),
      image_url: imageUrl,
      sport_ids: sportIds,
    })
    setSaving(false)

    if (resultado === 'possui_agendamentos') {
      setErro('Não é possível remover um esporte que possui agendamentos futuros.')
      return
    }

    if (!resultado) {
      setErro('Erro ao salvar quadra. Tente novamente.')
      return
    }

    onClose()
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        classNames={{
          wrapper: 'px-4 !overflow-hidden',
          closeButton: 'text-white hover:bg-white/40 cursor-pointer p-1',
          base: 'max-h-[90vh] my-auto',
        }}
        scrollBehavior="inside"
        className='rounded-t-xl'
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex justify-center gradient-background text-white rounded-t-xl">
                {quadra ? 'Editar Quadra' : 'Nova Quadra'}
              </ModalHeader>

              <ModalBody className="flex flex-col gap-y-4 mt-3">

                {/* Imagem */}
                <div
                  className="w-full h-36 rounded-xl overflow-hidden bg-lightblue flex items-center justify-center cursor-pointer relative group"
                  onClick={() => fileRef.current?.click()}
                >
                  {imageUrl ? (
                    <>
                      <img src={imageUrl} alt="Quadra" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-sm font-medium">Trocar imagem</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <HugeiconsIcon icon={AlbumNotFound01Icon} size={36} />
                      <p className="text-xs">{uploading ? 'Enviando...' : 'Clique para adicionar imagem'}</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

                {/* Nome */}
                <Input
                  placeholder="Nome da Quadra"
                  aria-label="Nome"
                  value={name}
                  onValueChange={setName}
                  classNames={inputClass}
                />

                {/* Esportes */}
                <div className="flex flex-col gap-y-2">
                  <p className="text-xs text-gray-500 px-1">Esportes disponíveis</p>
                  <div className="flex flex-wrap gap-2">
                    {todosEsportes.map(e => {
                      const ativo = sportIds.includes(e.id)
                      return (
                        <button
                          key={e.id}
                          onClick={() => toggleEsporte(e.id)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer
                            ${ativo
                              ? 'bg-brand text-white'
                              : 'bg-lightblue text-gray-600 hover:bg-lightblue/70'
                            }`}
                        >
                          {e.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {erro && <p className="text-red-500 text-sm text-center">{erro}</p>}
              </ModalBody>

              <ModalFooter className="flex justify-center">
                <button onClick={onClose} className="cancel-button">Cancelar</button>
                <button
                  className="confirm-button disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving || uploading}
                  onClick={() => handleSalvar(onClose)}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <ModalCropImagem
        isOpen={cropModal.isOpen}
        onOpenChange={cropModal.onOpenChange}
        imageSrc={cropSrc}
        onUploadSuccess={(url) => setImageUrl(url)}
        cropShape="rect"
        aspect={16 / 9}
        folder='quadras'
        fileName={cropFileName}
      />
    </>
  )
}
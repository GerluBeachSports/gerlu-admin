import { useCallback, useState } from 'react'
import Cropper from 'react-easy-crop'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Slider } from '@heroui/react'
import { getCroppedImage } from '../../../lib/cropImage'
import { uploadComprovante } from '../../../hooks/useCloudinary'

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string | null
  onUploadSuccess: (url: string) => void
  cropShape?: 'round' | 'rect'
  aspect?: number
}

export function ModalCropImagem({ isOpen, onOpenChange, imageSrc, onUploadSuccess, cropShape = 'round', aspect = 1 }: Props) {
  const [crop, setCrop]         = useState({ x: 0, y: 0 })
  const [zoom, setZoom]         = useState(1)
  const [croppedArea, setCroppedArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [erro, setErro]         = useState<string | null>(null)

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedArea(croppedAreaPixels)
  }, [])

  async function handleConfirmar(onClose: () => void) {
    if (!imageSrc || !croppedArea) return
    setErro(null)
    setUploading(true)

    try {
      const file = await getCroppedImage(imageSrc, croppedArea)
      const url  = await uploadComprovante(file)

      if (!url) {
        setErro('Erro ao fazer upload. Tente novamente.')
        setUploading(false)
        return
      }

      onUploadSuccess(url)
      onClose()
    } catch {
      setErro('Erro ao processar imagem.')
    } finally {
      setUploading(false)
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      // reseta ao fechar
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedArea(null)
      setErro(null)
    }
    onOpenChange(open)
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      placement="center"
      hideCloseButton
      classNames={{
        wrapper: 'px-4 !overflow-hidden',
        base: 'max-h-[90vh] my-auto',
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="gradient-background rounded-t-xl">
              <h2 className="text-white font-montserrat text-lg font-bold w-full text-center">
                Ajustar Imagem
              </h2>
            </ModalHeader>

            <ModalBody className="p-0">
              {/* Área de crop */}
              <div className="relative w-full h-72 bg-gray-900">
                {imageSrc && (
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    cropShape={cropShape}
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    style={{
                      containerStyle: { borderRadius: 0 },
                      cropAreaStyle: {
                        border: '3px solid #fff',
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                      },
                    }}
                  />
                )}
              </div>

              {/* Zoom */}
              <div className="px-6 py-4 flex flex-col gap-1">
                <p className="text-xs text-gray-400 text-center mb-1">
                  Arraste para reposicionar • Pinça ou slider para zoom
                </p>
                <Slider
                  aria-label="Zoom"
                  minValue={1}
                  maxValue={3}
                  step={0.01}
                  value={zoom}
                  onChange={(v) => setZoom(v as number)}
                  classNames={{
                    track: 'bg-gray-200',
                    filler: 'bg-brand',
                    thumb: 'bg-brand',
                  }}
                />
                {erro && <p className="text-xs text-red-500 text-center mt-1">{erro}</p>}
              </div>
            </ModalBody>

            <ModalFooter className="flex gap-3 pt-0">
              <Button
                variant="bordered"
                className="flex-1 rounded-xl font-semibold border-brand text-brand"
                onPress={onClose}
                isDisabled={uploading}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 rounded-xl bg-brand text-white font-semibold"
                isLoading={uploading}
                onPress={() => handleConfirmar(onClose)}
              >
                Confirmar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
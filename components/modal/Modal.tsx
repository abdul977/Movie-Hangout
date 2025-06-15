import Button from "../action/Button"
import { FC, ReactNode } from "react"
import IconClose from "../icon/IconClose"
import { Tooltip } from "react-tooltip"

interface Props {
  title: ReactNode
  show: boolean
  close: () => void
  children?: ReactNode
}

const Modal: FC<Props> = ({ title, show, close, children }) => {
  if (!show) {
    return <></>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onMouseDownCapture={(e) => {
          e.preventDefault()
          e.stopPropagation()
          close()
        }}
        onTouchStartCapture={(e) => {
          e.preventDefault()
          e.stopPropagation()
          close()
        }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className="relative bg-dark-800 shadow-2xl rounded-lg z-50 w-full max-w-md max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-dark-700">
          <div className="flex-1 mr-4">
            <h2 className="text-lg sm:text-xl font-semibold text-white">{title}</h2>
          </div>
          <Button
            tooltip="Close modal"
            id="closeModal1"
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={close}
          >
            <IconClose />
          </Button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {children}
        </div>

        <div className="flex justify-end items-center p-4 border-t border-dark-700 bg-dark-900">
          <Button
            tooltip="Close modal"
            id="closeModal2"
            className="px-6 py-3 bg-dark-600 hover:bg-dark-500 min-h-[44px] font-medium"
            onClick={close}
          >
            Close
          </Button>
        </div>
      </div>

      <Tooltip anchorId={"closeModal1"} />
      <Tooltip anchorId={"closeModal2"} />
    </div>
  )
}

export default Modal

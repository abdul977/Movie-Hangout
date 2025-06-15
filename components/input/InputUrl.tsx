import { FC, ReactNode, useEffect, useRef, useState } from "react"
import classNames from "classnames"
import IconClose from "../icon/IconClose"
import { isUrl } from "../../lib/utils"

interface Props {
  url: string
  placeholder: string
  tooltip: string
  onSubmit?: () => void
  onChange: (url: string) => void
  className?: string
  children?: ReactNode
}

const InputUrl: FC<Props> = ({
  url,
  placeholder,
  tooltip,
  onSubmit,
  onChange,
  className,
  children,
}) => {
  const [valid, setValid] = useState(url === "" || isUrl(url))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValid(url === "" || isUrl(url))
  }, [url])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (onSubmit) {
          onSubmit()
        }
      }}
      className={classNames("flex flex-col", className)}
    >
      <div className="rounded flex flex-row items-center bg-dark-800 border border-dark-600 focus-within:border-primary-800 transition-colors min-h-[48px]">
        <input
          ref={inputRef}
          size={1}
          className="flex-1 bg-transparent px-3 py-3 text-white placeholder-gray-400 focus:outline-none"
          placeholder={placeholder}
          value={url}
          onChange={(event) => {
            onChange(event.target.value)
          }}
          type="text"
          onFocus={() => inputRef.current?.select()}
        />
        {url && (
          <button
            type="button"
            className="p-2 cursor-pointer hover:bg-dark-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => onChange("")}
            aria-label="Clear input"
          >
            <IconClose />
          </button>
        )}
        <button
          type="submit"
          data-tooltip-content={tooltip}
          className={classNames(
            "px-4 py-3 rounded-r font-medium transition-colors min-h-[48px] flex items-center justify-center",
            valid
              ? "bg-primary-900 hover:bg-primary-800 text-white"
              : "bg-red-600 hover:bg-red-500 text-white"
          )}
        >
          {children}
        </button>
      </div>
      {!valid && (
        <div className="text-red-400 text-sm mt-1 px-1">
          Please enter a valid URL
        </div>
      )}
    </form>
  )
}

export default InputUrl

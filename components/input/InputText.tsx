import { FC, useRef } from "react"
import IconClose from "../icon/IconClose"
import classNames from "classnames"

interface Props {
  value: string
  placeholder: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
  icon?: any
}

const InputText: FC<Props> = ({
  value,
  onChange,
  placeholder,
  icon,
  className = "",
  required = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div
      className={classNames(
        "rounded flex flex-row items-center bg-dark-800 action border border-dark-600 focus-within:border-primary-800 transition-colors",
        "min-h-[48px]",
        className
      )}
    >
      {icon && <div className="ml-3 flex-shrink-0">{icon}</div>}
      <input
        ref={inputRef}
        size={1}
        className="flex-1 bg-transparent px-3 py-3 text-white placeholder-gray-400 focus:outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type="text"
        required={required}
        onFocus={() => inputRef.current?.select()}
      />
      {value && (
        <button
          type="button"
          className="p-3 cursor-pointer hover:bg-dark-700 rounded-r transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => onChange("")}
          aria-label="Clear input"
        >
          <IconClose />
        </button>
      )}
    </div>
  )
}

export default InputText

import { FC, MouseEventHandler, ReactNode } from "react"
import classNames from "classnames"

interface Props {
  id?: string
  tooltip: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  className?: string
  type?: "button" | "submit" | "reset"
  actionClasses?: string
  disabled?: boolean
  children?: ReactNode
}

const Button: FC<Props> = ({
  id,
  tooltip,
  onClick,
  className = "",
  type = "button",
  actionClasses = "action",
  disabled = false,
  children,
}) => {
  return (
    <button
      id={id}
      data-tooltip-content={tooltip}
      data-tooltip-variant="dark"
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={classNames(
        "p-2 rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-800 focus:ring-opacity-50",
        "min-h-[44px] min-w-[44px] flex items-center justify-center",
        actionClasses,
        className,
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  )
}

export default Button

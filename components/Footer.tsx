import { FC } from "react"
import IconGithub from "./icon/IconGithub"
import NewTabLink from "./action/NewTabLink"
import IconCopyright from "./icon/IconCopyright"

interface Props {
  error?: number
}

const Footer: FC<Props> = ({ error }) => {
  return (
    <footer className="bg-dark-900 py-3 px-4 border-t border-dark-700">
      {error && (
        <div className="text-red-400 text-sm mb-2 p-2 bg-red-900/20 rounded">
          Error {error}
        </div>
      )}
      <div className="text-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-row items-center gap-1 text-gray-400">
          <IconCopyright sizeClassName="h-3 w-3" />
          <NewTabLink
            href="https://github.com/abdul977/"
            className="hover:text-white transition-colors"
          >
            muahib solution
          </NewTabLink>
          <span>2025</span>
        </div>

        <NewTabLink
          className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
          href="https://github.com/abdul977/"
        >
          <IconGithub className="w-4 h-4" />
          <span>GitHub</span>
        </NewTabLink>
      </div>
    </footer>
  )
}

export default Footer

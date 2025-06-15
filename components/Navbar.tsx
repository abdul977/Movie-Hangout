import Link from "next/link"
import Image from "next/image"
import { getSiteDomain, getSiteName } from "../lib/env"
import Button from "./action/Button"
import IconShare from "./icon/IconShare"
import React, { useState } from "react"
import Modal from "./modal/Modal"
import InputClipboardCopy from "./input/InputClipboardCopy"
import { Tooltip } from "react-tooltip"

const Navbar = ({ roomId }: { roomId?: string }) => {
  const [showShare, setShowShare] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <div className="py-2 px-4 flex flex-row justify-between items-center bg-dark-900 relative">
        {/* Logo and Brand */}
        <Link
          href="/"
          className="flex p-2 shrink-0 flex-row gap-2 items-center rounded action"
        >
          <Image
            src="/logo_white.png"
            alt={`${getSiteName()} logo`}
            width={36}
            height={36}
          />
          <span className="hide-below-sm font-semibold text-lg">{getSiteName()}</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-2">
          {roomId && (
            <>
              <Modal
                title="Invite your friends"
                show={showShare}
                close={() => setShowShare(false)}
              >
                <div className="mb-4">Share this link to let more people join in on the fun</div>
                <InputClipboardCopy
                  className="bg-dark-1000"
                  value={getSiteDomain() + "/room/" + roomId}
                />
              </Modal>
              <Button
                tooltip="Share the room link"
                id="navbar-share"
                actionClasses="hover:bg-primary-800 active:bg-primary-700"
                className="px-4 py-2 bg-primary-900 font-medium"
                onClick={() => setShowShare(true)}
              >
                <div className="flex items-center gap-2">
                  <IconShare />
                  <span>Share</span>
                </div>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="sm:hidden">
          <Button
            tooltip={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${
                mobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'
              }`} />
              <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${
                mobileMenuOpen ? 'opacity-0' : 'opacity-100'
              }`} />
              <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${
                mobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'
              }`} />
            </div>
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-dark-800 border-t border-dark-700 shadow-lg">
          <div className="px-4 py-3 space-y-3">
            {roomId && (
              <>
                <Modal
                  title="Invite your friends"
                  show={showShare}
                  close={() => setShowShare(false)}
                >
                  <div className="mb-4">Share this link to let more people join in on the fun</div>
                  <InputClipboardCopy
                    className="bg-dark-1000"
                    value={getSiteDomain() + "/room/" + roomId}
                  />
                </Modal>
                <Button
                  tooltip="Share the room link"
                  id="navbar-share-mobile"
                  actionClasses="hover:bg-primary-800 active:bg-primary-700"
                  className="w-full px-4 py-3 bg-primary-900 font-medium text-left"
                  onClick={() => {
                    setShowShare(true)
                    setMobileMenuOpen(false)
                  }}
                >
                  <div className="flex items-center gap-3">
                    <IconShare />
                    <span>Share Room Link</span>
                  </div>
                </Button>
              </>
            )}

            <Link
              href="/"
              className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-dark-700 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              🏠 Home
            </Link>

            <Link
              href="/dashboard"
              className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-dark-700 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              📊 Dashboard
            </Link>
          </div>
        </div>
      )}

      <Tooltip
        anchorId="navbar-share"
        place="bottom"
        style={{
          backgroundColor: "var(--dark-700)",
        }}
      />
      <Tooltip
        anchorId="navbar-share-mobile"
        place="bottom"
        style={{
          backgroundColor: "var(--dark-700)",
        }}
      />
    </>
  )
}

export default Navbar

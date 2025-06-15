import Layout from "../components/Layout"
import { useState } from "react"
import InputText from "../components/input/InputText"
import Button from "../components/action/Button"
import { useRouter } from "next/router"
import { Tooltip } from "react-tooltip"
import useSWR from "swr"
import Image from "next/image"
import { getSiteName } from "../lib/env"

export default function Dashboard() {
  const router = useRouter()
  const { data } = useSWR("/api/stats", async (url) => {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return response.json()
  })
  const [room, setRoom] = useState("")

  const createNewRoom = () => {
    fetch("/api/generate")
      .then(async (r) => {
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}: ${r.statusText}`)
        }
        return r.json()
      })
      .then(async ({ roomId }) => {
        if (
          typeof roomId === "string" &&
          roomId.length >= 4 &&
          roomId.match(/^[a-z]{4,}$/)
        ) {
          console.log("Generated new roomId:", roomId)
          await router.push("/room/" + roomId)
        } else {
          throw Error("Invalid roomId generated: " + roomId)
        }
      })
      .catch((error) => {
        console.error("Failed to generate new roomId", error)
        alert("Failed to create room. Please try again.")
      })
  }

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (room.length >= 4) {
      await router.push("/room/" + room)
    }
  }

  return (
    <Layout
      meta={{
        title: `${getSiteName()} - Dashboard`,
        description: "Manage your watch parties and rooms from your personal dashboard.",
        robots: "index, follow"
      }}
      showNavbar={true}
    >
      <div className="mobile-container py-6 sm:py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <Image
              src="/logo_white.png"
              alt={`${getSiteName()} logo`}
              width={48}
              height={48}
            />
            <div>
              <h1 className="mobile-heading font-bold text-white">Dashboard</h1>
              <p className="text-gray-400 mobile-text">Manage your watch parties and rooms</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Create Room Card */}
          <div className="bg-dark-900 rounded-2xl p-4 sm:p-6 shadow-2xl border border-dark-700">
            <h2 className="mobile-subheading font-bold text-white mb-3 sm:mb-4">🚀 Create New Room</h2>
            <p className="text-gray-400 mb-4 sm:mb-6 mobile-text">
              Start a new watch party instantly and invite your friends to join.
            </p>
            <Button
              tooltip="Create a new room and start watching"
              className="w-full px-4 sm:px-6 py-4 text-base sm:text-lg font-semibold"
              actionClasses="bg-primary-900 hover:bg-primary-800 active:bg-primary-700"
              onClick={createNewRoom}
            >
              Create Room
            </Button>
          </div>

          {/* Join Room Card */}
          <div className="bg-dark-900 rounded-2xl p-4 sm:p-6 shadow-2xl border border-dark-700">
            <h2 className="mobile-subheading font-bold text-white mb-3 sm:mb-4">🎯 Join Existing Room</h2>
            <p className="text-gray-400 mb-4 sm:mb-6 mobile-text">
              Enter a room ID to join an existing watch party with friends.
            </p>
            <form onSubmit={joinRoom} className="space-y-3 sm:space-y-4">
              <InputText
                value={room}
                placeholder="Enter room ID (e.g., abcd)"
                onChange={(value) =>
                  setRoom(value.toLowerCase().replace(/[^a-z]/g, ""))
                }
              />
              <Button
                tooltip={room.length < 4 ? "Enter a valid room ID (4+ characters)" : "Join the room"}
                className="w-full px-4 sm:px-6 py-4 text-base sm:text-lg font-semibold"
                actionClasses={
                  room.length >= 4
                    ? "bg-primary-900 hover:bg-primary-800 active:bg-primary-700"
                    : "bg-dark-700 hover:bg-dark-600 cursor-not-allowed"
                }
                disabled={room.length < 4}
                type="submit"
              >
                Join Room
              </Button>
            </form>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-dark-900 rounded-2xl p-4 sm:p-6 shadow-2xl border border-dark-700 text-center">
            <div className="text-3xl sm:text-4xl font-bold text-primary-800 mb-2">
              {data?.rooms || 0}
            </div>
            <div className="text-gray-400 mobile-text">Active Rooms</div>
          </div>

          <div className="bg-dark-900 rounded-2xl p-4 sm:p-6 shadow-2xl border border-dark-700 text-center">
            <div className="text-3xl sm:text-4xl font-bold text-primary-800 mb-2">
              {data?.users || 0}
            </div>
            <div className="text-gray-400 mobile-text">Users Online</div>
          </div>

          <div className="bg-dark-900 rounded-2xl p-4 sm:p-6 shadow-2xl border border-dark-700 text-center">
            <div className="text-3xl sm:text-4xl font-bold text-primary-800 mb-2">∞</div>
            <div className="text-gray-400 mobile-text">Possibilities</div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-dark-900 rounded-2xl p-4 sm:p-8 shadow-2xl border border-dark-700">
          <h2 className="mobile-subheading font-bold text-white mb-4 sm:mb-6 text-center">What You Can Do</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center p-3 sm:p-0">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🎬</div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">Watch Together</h3>
              <p className="text-gray-400 text-sm">
                Synchronized video playback with friends
              </p>
            </div>

            <div className="text-center p-3 sm:p-0">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">💬</div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">Real-time Chat</h3>
              <p className="text-gray-400 text-sm">
                Chat while watching your favorite content
              </p>
            </div>

            <div className="text-center p-3 sm:p-0">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🌐</div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">Multiple Platforms</h3>
              <p className="text-gray-400 text-sm">
                YouTube, Vimeo, SoundCloud, and more
              </p>
            </div>

            <div className="text-center p-3 sm:p-0">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">⚡</div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">Instant Setup</h3>
              <p className="text-gray-400 text-sm">
                No registration required, just click and watch
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tooltip
        style={{
          backgroundColor: "var(--dark-700)",
        }}
      />
    </Layout>
  )
}

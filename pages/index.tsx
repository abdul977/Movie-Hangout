import Layout from "../components/Layout"
import { useState } from "react"
import InputText from "../components/input/InputText"
import Button from "../components/action/Button"
import { useRouter } from "next/router"
import { Tooltip } from "react-tooltip"
import useSWR from "swr"
import Image from "next/image"
import { getSiteName } from "../lib/env"
import { isBrowser } from "../lib/utils"

export default function Index() {
  const router = useRouter()
  const { data } = useSWR("/api/stats", (url) =>
    fetch(url).then((r) => r.json())
  )
  const [room, setRoom] = useState("")

  return (
    <Layout meta={{
      title: `${getSiteName()} - Watch Together with Friends`,
      description: "Watch videos, listen to music, and enjoy content together with friends in perfect sync. Support for YouTube, Vimeo, SoundCloud, and more.",
      robots: "index, archive, follow"
    }} showNavbar={false}>
      {/* Hero Section */}
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center p-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo_white.png"
              alt={`${getSiteName()} logo`}
              width={48}
              height={48}
            />
            <h1 className="text-2xl font-bold text-white">{getSiteName()}</h1>
          </div>
        </header>

        {/* Main Hero Content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Watch <span className="text-primary-800">Together</span>
                <br />
                Stay Connected
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Enjoy movies, videos, and music with friends in perfect sync.
                Create a room, share the link, and start watching together from anywhere in the world.
              </p>

              {/* Features List */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary-800 rounded-full"></div>
                  <span className="text-gray-300">Perfect synchronization</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary-800 rounded-full"></div>
                  <span className="text-gray-300">Multiple video platforms</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary-800 rounded-full"></div>
                  <span className="text-gray-300">Real-time chat</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary-800 rounded-full"></div>
                  <span className="text-gray-300">No registration required</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  tooltip="Create a new room and start watching"
                  className="px-8 py-4 text-lg font-semibold"
                  actionClasses="bg-primary-900 hover:bg-primary-800 active:bg-primary-700"
                  onClick={() => {
                    fetch("/api/generate")
                      .then((r) => r.json())
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
                      })
                  }}
                >
                  🚀 Start Watching Now
                </Button>
                <Button
                  tooltip="Scroll down to join an existing room"
                  className="px-8 py-4 text-lg font-semibold border border-gray-600"
                  actionClasses="bg-transparent hover:bg-dark-800 active:bg-dark-700"
                  onClick={() => {
                    if (isBrowser()) {
                      document.getElementById('join-section')?.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                >
                  Join a Room
                </Button>
              </div>
            </div>

            {/* Right Side - Visual/Stats */}
            <div className="flex justify-center">
              <div className="bg-dark-900 rounded-2xl p-8 shadow-2xl border border-dark-700 max-w-md w-full">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">Live Stats</h3>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary-800 mb-2">
                      {data?.rooms || 0}
                    </div>
                    <div className="text-gray-400">Active Rooms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary-800 mb-2">
                      {data?.users || 0}
                    </div>
                    <div className="text-gray-400">Users Online</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary-800 mb-2">∞</div>
                    <div className="text-gray-400">Memories Created</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Join Section */}
      <div id="join-section" className="py-20 px-4 bg-dark-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Join an Existing Room</h2>
          <p className="text-xl text-gray-300 mb-8">
            Got invited to watch something? Enter the room ID below to join your friends.
          </p>

          <form
            className="max-w-md mx-auto flex flex-col sm:flex-row gap-4"
            onSubmit={async (e) => {
              e.preventDefault()
              if (room.length >= 4) {
                await router.push("/room/" + room)
              }
            }}
          >
            <InputText
              value={room}
              placeholder="Enter room ID"
              onChange={(value) =>
                setRoom(value.toLowerCase().replace(/[^a-z]/g, ""))
              }
            />
            <Button
              tooltip={room.length < 4 ? "Enter a valid room ID (4+ characters)" : "Join the room"}
              className="px-6 py-3 font-semibold"
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

      {/* Features Section */}
      <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Why Choose {getSiteName()}?</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience seamless synchronized viewing with powerful features designed for the best watch party experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🎬</div>
              <h3 className="text-xl font-bold text-white mb-3">Synchronized Playback</h3>
              <p className="text-gray-400">
                Watch videos and listen to music in perfect sync with your friends, no matter where they are.
              </p>
            </div>

            <div className="text-center">
              <div className="text-6xl mb-4">🌐</div>
              <h3 className="text-xl font-bold text-white mb-3">Multiple Platforms</h3>
              <p className="text-gray-400">
                Support for YouTube, Vimeo, SoundCloud, Twitch, and many more streaming platforms.
              </p>
            </div>

            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-white mb-3">Real-time Chat</h3>
              <p className="text-gray-400">
                Chat with your friends while watching, share reactions and discuss what you're viewing.
              </p>
            </div>

            <div className="text-center">
              <div className="text-6xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-white mb-3">Easy to Use</h3>
              <p className="text-gray-400">
                Simply create a room, share the link, and start watching together instantly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Platforms Section */}
      <div className="py-20 px-4 bg-dark-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Supported Platforms</h2>
          <p className="text-xl text-gray-300 mb-12">
            Watch content from your favorite platforms, all synchronized perfectly.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {["YouTube", "Vimeo", "SoundCloud", "Twitch", "Facebook", "Streamable", "Wistia", "DailyMotion"].map((platform) => (
              <div
                key={platform}
                className="bg-dark-800 rounded-lg p-6 border border-dark-700 hover:border-primary-800 transition-colors"
              >
                <div className="text-lg font-semibold text-white">{platform}</div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-dark-800 rounded-lg border border-dark-700">
            <p className="text-gray-300">
              <strong className="text-white">Plus:</strong> Any content playable via HTML5 video/audio elements,
              HLS streams, DASH streams, and everything extractable via yt-dlp.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">How It Works</h2>
            <p className="text-xl text-gray-300">
              Get started in three simple steps and enjoy watching together in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-900 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Create a Room</h3>
              <p className="text-gray-400">
                Click "Start Watching Now" to instantly create a new room with a unique ID.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-900 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Invite Friends</h3>
              <p className="text-gray-400">
                Share the room link with your friends so they can join your watch party.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-900 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Watch Together</h3>
              <p className="text-gray-400">
                Add your video URL and enjoy perfectly synchronized playback with real-time chat.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-4 bg-gradient-to-r from-primary-900 to-primary-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Watching Together?</h2>
          <p className="text-xl text-gray-100 mb-8">
            Join thousands of users who are already enjoying synchronized watch parties with friends.
          </p>

          <Button
            tooltip="Create your first room now"
            className="px-12 py-4 text-xl font-bold"
            actionClasses="bg-white text-primary-900 hover:bg-gray-100 active:bg-gray-200"
            onClick={() => {
              fetch("/api/generate")
                .then((r) => r.json())
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
                })
            }}
          >
            🚀 Create Your Room Now
          </Button>
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

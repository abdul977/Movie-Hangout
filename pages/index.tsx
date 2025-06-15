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
        <header className="flex justify-between items-center p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo_white.png"
              alt={`${getSiteName()} logo`}
              width={48}
              height={48}
            />
            <h1 className="mobile-subheading font-bold text-white">{getSiteName()}</h1>
          </div>
        </header>

        {/* Main Hero Content */}
        <div className="flex-1 flex items-center justify-center mobile-padding py-8">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                Watch <span className="text-primary-800">Together</span>
                <br />
                Stay Connected
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
                Enjoy movies, videos, and music with friends in perfect sync.
                Create a room, share the link, and start watching together from anywhere in the world.
              </p>

              {/* Features List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 text-left">
                <div className="flex items-center gap-3 p-2 sm:p-0">
                  <div className="w-2 h-2 bg-primary-800 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-300 mobile-text">Perfect synchronization</span>
                </div>
                <div className="flex items-center gap-3 p-2 sm:p-0">
                  <div className="w-2 h-2 bg-primary-800 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-300 mobile-text">Multiple video platforms</span>
                </div>
                <div className="flex items-center gap-3 p-2 sm:p-0">
                  <div className="w-2 h-2 bg-primary-800 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-300 mobile-text">Real-time chat</span>
                </div>
                <div className="flex items-center gap-3 p-2 sm:p-0">
                  <div className="w-2 h-2 bg-primary-800 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-300 mobile-text">No registration required</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3 sm:gap-4 justify-center lg:justify-start mobile-touch-spacing">
                <Button
                  tooltip="Create a new room and start watching"
                  className="w-full sm:w-auto px-6 sm:px-8 py-4 text-base sm:text-lg font-semibold min-h-[48px]"
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
                  className="w-full sm:w-auto px-6 sm:px-8 py-4 text-base sm:text-lg font-semibold border border-gray-600 min-h-[48px]"
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
            <div className="flex justify-center mt-8 lg:mt-0">
              <div className="bg-dark-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-dark-700 max-w-md w-full">
                <h3 className="mobile-subheading font-bold text-white mb-4 sm:mb-6 text-center">Live Stats</h3>
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-primary-800 mb-2">
                      {data?.rooms || 0}
                    </div>
                    <div className="text-gray-400 mobile-text">Active Rooms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-primary-800 mb-2">
                      {data?.users || 0}
                    </div>
                    <div className="text-gray-400 mobile-text">Users Online</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-primary-800 mb-2">∞</div>
                    <div className="text-gray-400 mobile-text">Memories Created</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Join Section */}
      <div id="join-section" className="py-12 sm:py-20 mobile-padding bg-dark-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="mobile-heading font-bold text-white mb-4 sm:mb-6">Join an Existing Room</h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8">
            Got invited to watch something? Enter the room ID below to join your friends.
          </p>

          <form
            className="max-w-md mx-auto flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault()
              if (room.length >= 4) {
                await router.push("/room/" + room)
              }
            }}
          >
            <InputText
              value={room}
              placeholder="Enter room ID (e.g., abcd)"
              onChange={(value) =>
                setRoom(value.toLowerCase().replace(/[^a-z]/g, ""))
              }
            />
            <Button
              tooltip={room.length < 4 ? "Enter a valid room ID (4+ characters)" : "Join the room"}
              className="w-full px-6 py-4 font-semibold min-h-[48px]"
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
      <div className="py-12 sm:py-20 mobile-padding">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="mobile-heading font-bold text-white mb-4 sm:mb-6">Why Choose {getSiteName()}?</h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
              Experience seamless synchronized viewing with powerful features designed for the best watch party experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center p-4 sm:p-0">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🎬</div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Synchronized Playback</h3>
              <p className="text-gray-400 mobile-text">
                Watch videos and listen to music in perfect sync with your friends, no matter where they are.
              </p>
            </div>

            <div className="text-center p-4 sm:p-0">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🌐</div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Multiple Platforms</h3>
              <p className="text-gray-400 mobile-text">
                Support for YouTube, Vimeo, SoundCloud, Twitch, and many more streaming platforms.
              </p>
            </div>

            <div className="text-center p-4 sm:p-0">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">💬</div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Real-time Chat</h3>
              <p className="text-gray-400 mobile-text">
                Chat with your friends while watching, share reactions and discuss what you&apos;re viewing.
              </p>
            </div>

            <div className="text-center p-4 sm:p-0">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">⚡</div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Easy to Use</h3>
              <p className="text-gray-400 mobile-text">
                Simply create a room, share the link, and start watching together instantly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Platforms Section */}
      <div className="py-12 sm:py-20 mobile-padding bg-dark-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="mobile-heading font-bold text-white mb-4 sm:mb-6">Supported Platforms</h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-12">
            Watch content from your favorite platforms, all synchronized perfectly.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {["YouTube", "Vimeo", "SoundCloud", "Twitch", "Facebook", "Streamable", "Wistia", "DailyMotion"].map((platform) => (
              <div
                key={platform}
                className="bg-dark-800 rounded-lg p-4 sm:p-6 border border-dark-700 hover:border-primary-800 transition-colors min-h-[60px] flex items-center justify-center"
              >
                <div className="text-sm sm:text-lg font-semibold text-white text-center">{platform}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-dark-800 rounded-lg border border-dark-700">
            <p className="text-gray-300 mobile-text">
              <strong className="text-white">Plus:</strong> Any content playable via HTML5 video/audio elements,
              HLS streams, DASH streams, and everything extractable via yt-dlp.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-12 sm:py-20 mobile-padding">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="mobile-heading font-bold text-white mb-4 sm:mb-6">How It Works</h2>
            <p className="text-lg sm:text-xl text-gray-300">
              Get started in three simple steps and enjoy watching together in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-8">
            <div className="text-center p-4 sm:p-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-900 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold text-white mx-auto mb-4 sm:mb-6">
                1
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Create a Room</h3>
              <p className="text-gray-400 mobile-text">
                Click &quot;Start Watching Now&quot; to instantly create a new room with a unique ID.
              </p>
            </div>

            <div className="text-center p-4 sm:p-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-900 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold text-white mx-auto mb-4 sm:mb-6">
                2
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Invite Friends</h3>
              <p className="text-gray-400 mobile-text">
                Share the room link with your friends so they can join your watch party.
              </p>
            </div>

            <div className="text-center p-4 sm:p-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-900 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold text-white mx-auto mb-4 sm:mb-6">
                3
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Watch Together</h3>
              <p className="text-gray-400 mobile-text">
                Add your video URL and enjoy perfectly synchronized playback with real-time chat.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-12 sm:py-20 mobile-padding bg-gradient-to-r from-primary-900 to-primary-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="mobile-heading font-bold text-white mb-4 sm:mb-6">Ready to Start Watching Together?</h2>
          <p className="text-lg sm:text-xl text-gray-100 mb-6 sm:mb-8">
            Join thousands of users who are already enjoying synchronized watch parties with friends.
          </p>

          <Button
            tooltip="Create your first room now"
            className="w-full sm:w-auto px-8 sm:px-12 py-4 text-lg sm:text-xl font-bold min-h-[48px]"
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

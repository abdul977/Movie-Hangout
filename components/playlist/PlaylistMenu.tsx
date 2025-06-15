import { FC, useEffect, useRef, useState } from "react"
import { MediaElement, Playlist, RoomState } from "../../lib/types"
import { DragDropContext as _DragDropContext, Droppable as _Droppable, DragDropContextProps, DroppableProps } from "react-beautiful-dnd"
import classNames from "classnames"
import { Socket } from "socket.io-client"
import {
  ClientToServerEvents,
  playItemFromPlaylist,
  ServerToClientEvents,
} from "../../lib/socket"
import ControlButton from "../input/ControlButton"
import IconChevron from "../icon/IconChevron"
import PlaylistItem from "./PlaylistItem"
import InputUrl from "../input/InputUrl"

// HACK: this fixes type incompatibility
const DragDropContext = _DragDropContext as unknown as FC<DragDropContextProps>
const Droppable = _Droppable as unknown as FC<DroppableProps>

interface Props {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>
}

const PlaylistMenu: FC<Props> = ({ socket }) => {
  const [expanded, setExpanded] = useState(true)
  const [url, setUrl] = useState("")

  const [playlist, _setPlaylist] = useState<Playlist>({
    items: [],
    currentIndex: -1,
  })
  const playlistRef = useRef(playlist)
  const setPlaylist = (newPlaylist: Playlist) => {
    _setPlaylist(newPlaylist)
    playlistRef.current = newPlaylist
  }

  useEffect(() => {
    socket.on("update", (room: RoomState) => {
      if (
        JSON.stringify(room.targetState.playlist) !==
        JSON.stringify(playlistRef.current)
      ) {
        setPlaylist(room.targetState.playlist)
      }
    })
  }, [socket])

  const addItem = (newUrl: string) => {
    if (newUrl === "") {
      return
    }
    setUrl("")

    const newMedia: MediaElement = {
      src: [
        {
          src: newUrl,
          resolution: "",
        },
      ],
      sub: [],
    }
    const newPlaylist: Playlist = JSON.parse(JSON.stringify(playlist))
    newPlaylist.items.push(newMedia)
    socket.emit("updatePlaylist", newPlaylist)
  }

  return (
    <div className={classNames("flex flex-col bg-dark-900 rounded-lg border border-dark-700", expanded && "lg:w-full")}>
      <ControlButton
        tooltip={expanded ? "Hide playlist" : "Show playlist"}
        onClick={() => setExpanded(!expanded)}
        interaction={() => {}}
        className="flex flex-row gap-2 items-center p-3 min-h-[48px] bg-dark-800 rounded-t-lg"
      >
        <IconChevron
          direction={expanded ? "up" : "down"}
          className="lg:rotate-0"
        />
        <div className="font-medium text-white">
          {expanded ? "Hide" : "Show"} Playlist ({playlist.items.length})
        </div>
      </ControlButton>
      {expanded && (
        <div className="p-3 space-y-3">
          <InputUrl
            url={url}
            placeholder="Add video URL to playlist..."
            tooltip="Add url to the playlist"
            onChange={setUrl}
            onSubmit={() => addItem(url)}
          >
            Add
          </InputUrl>

          {playlist.items.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📝</div>
              <p>No videos in playlist</p>
              <p className="text-sm">Add a URL above to get started</p>
            </div>
          ) : (
            <DragDropContext
              onDragEnd={(result) => {
                if (!result.destination) {
                  return
                }

                const newPlaylist: Playlist = JSON.parse(JSON.stringify(playlist))
                newPlaylist.items.splice(result.source.index, 1)
                newPlaylist.items.splice(
                  result.destination.index,
                  0,
                  playlist.items[result.source.index]
                )

                if (
                  playlist.currentIndex > result.source.index &&
                  playlist.currentIndex < result.destination.index
                ) {
                  newPlaylist.currentIndex--
                } else if (
                  playlist.currentIndex < result.source.index &&
                  playlist.currentIndex > result.destination.index
                ) {
                  newPlaylist.currentIndex++
                } else if (playlist.currentIndex === result.source.index) {
                  newPlaylist.currentIndex = result.destination.index
                }

                console.log("Playlist updated to:", newPlaylist)
                socket.emit("updatePlaylist", newPlaylist)
              }}
            >
              <Droppable droppableId="playlistMenu">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={classNames(
                      "flex flex-col rounded gap-2 max-h-64 lg:max-h-96 overflow-y-auto",
                      snapshot.isDraggingOver && "bg-dark-800"
                    )}
                  >
                    {playlist.items.map((item, index) => (
                      <PlaylistItem
                        key={item.src[0].src + "-" + index}
                        playing={playlist.currentIndex === index}
                        item={item}
                        index={index}
                        deleteItem={(index) => {
                          if (index < 0 || index >= playlist.items.length) {
                            return
                          }

                          const newPlaylist: Playlist = JSON.parse(
                            JSON.stringify(playlist)
                          )
                          newPlaylist.items.splice(index, 1)
                          if (newPlaylist.currentIndex === index) {
                            newPlaylist.currentIndex = -1
                          } else if (newPlaylist.currentIndex > index) {
                            newPlaylist.currentIndex--
                          }
                          socket.emit("updatePlaylist", newPlaylist)
                        }}
                        updateTitle={(newTitle) => {
                          const newPlaylist: Playlist = JSON.parse(
                            JSON.stringify(playlist)
                          )
                          newPlaylist.items[index].title = newTitle
                          socket.emit("updatePlaylist", newPlaylist)
                        }}
                        play={() => {
                          playItemFromPlaylist(socket, playlist, index)
                        }}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      )}
    </div>
  )
}

export default PlaylistMenu

package game

import (
	"net/http"

	"nhooyr.io/websocket"
)

type Hub struct{}

func NewHub() *Hub { return &Hub{} }

func (h *Hub) HandleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := websocket.Accept(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close(websocket.StatusInternalError, "bye")

	ctx := r.Context()
	// first message: name (consume but don't use yet)
	if _, _, err := conn.Read(ctx); err != nil {
		return
	}

	// TODO: attach to a room, start tick loop, etc.
}

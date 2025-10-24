package chat

import (
	"fmt"
	"sync"

	"nhooyr.io/websocket"
)

type client struct {
	name string
	sid  string
	conn *websocket.Conn
	send chan []byte
}

type Hub struct {
	mu       sync.Mutex
	clients  map[*client]bool  // live sockets
	sessions map[string]int    // sid -> live connection count
	names    map[string]string // sid -> latest name
}

func NewHub() *Hub {
	return &Hub{
		clients:  map[*client]bool{},
		sessions: map[string]int{},
		names:    map[string]string{},
	}
}

func (h *Hub) broadcast(b []byte) {
	h.mu.Lock()
	defer h.mu.Unlock()
	for c := range h.clients {
		select {
		case c.send <- b:
		default: /* drop if slow */
		}
	}
}

// announce exactly once per session
func (h *Hub) add(c *client) {
	var announce bool
	var who string

	h.mu.Lock()
	h.clients[c] = true
	h.names[c.sid] = c.name
	h.sessions[c.sid]++
	if h.sessions[c.sid] == 1 {
		announce = true
		who = h.names[c.sid]
	}
	h.mu.Unlock()

	if announce {
		h.broadcast([]byte(fmt.Sprintf("[system] %s joined the chat", who)))
	}
}

func (h *Hub) remove(c *client) {
	var announce bool
	var who string

	h.mu.Lock()
	if h.sessions[c.sid] > 0 {
		h.sessions[c.sid]--
	}
	if h.sessions[c.sid] == 0 {
		announce = true
		who = h.names[c.sid]
		delete(h.names, c.sid)
	}
	delete(h.clients, c)
	h.mu.Unlock()

	if announce {
		h.broadcast([]byte(fmt.Sprintf("[system] %s left the chat", who)))
	}
}

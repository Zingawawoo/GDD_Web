package chat

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"nhooyr.io/websocket"
)

func (h *Hub) HandleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		OriginPatterns:  []string{r.Host},
		CompressionMode: websocket.CompressionDisabled,
	})
	if err != nil {
		return
	}
	defer conn.Close(websocket.StatusInternalError, "internal error")

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	name := strings.TrimSpace(r.URL.Query().Get("name"))
	if name == "" {
		name = strings.Split(r.RemoteAddr, ":")[0]
	}
	if len(name) > 24 {
		name = name[:24]
	}
	sid := strings.TrimSpace(r.URL.Query().Get("sid"))
	if sid == "" {
		sid = r.RemoteAddr // fallback; shouldn’t happen with our client
	}

	c := &client{name: name, sid: sid, conn: conn, send: make(chan []byte, 64)}
	h.add(c)
	defer func() { close(c.send); h.remove(c) }()

	go writePump(ctx, c)

	for {
		typ, b, err := conn.Read(ctx)
		if err != nil {
			break
		}
		if typ != websocket.MessageText {
			continue
		}
		line := strings.TrimSpace(string(b))
		if line == "" {
			continue
		}
		h.broadcast([]byte(fmt.Sprintf("%s: %s", c.name, line)))
	}

	conn.Close(websocket.StatusNormalClosure, "bye")
}

func writePump(ctx context.Context, c *client) {
	t := time.NewTicker(20 * time.Second)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case msg, ok := <-c.send:
			if !ok {
				return
			}
			_ = c.conn.Write(ctx, websocket.MessageText, msg)
		case <-t.C:
			_ = c.conn.Ping(ctx)
		}
	}
}

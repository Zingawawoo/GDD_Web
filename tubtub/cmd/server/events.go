package main

import (
	"bufio"
	"encoding/json"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"
)

type Event struct {
	Title    string    `json:"title"`
	StartsAt time.Time `json:"starts_at"`
	EndsAt   time.Time `json:"ends_at"`
	Location string    `json:"location,omitempty"`
	Link     string    `json:"link,omitempty"`
}

var (
	// tiny in-memory cache (per process)
	eventsCache struct {
		data []byte
		exp  time.Time
	}
)

func eventsHandler(w http.ResponseWriter, r *http.Request) {
	// 1) Get ICS URL from env (or fallback)
	icsURL := os.Getenv("CALENDAR_ICS_URL")
	if icsURL == "" {
		// TEMP: fallback while you wire the env var
		icsURL = "https://calendar.google.com/calendar/ical/<YOUR_ID>@group.calendar.google.com/private-.../basic.ics"
	}

	// 2) Serve from cache if fresh
	now := time.Now()
	if eventsCache.data != nil && now.Before(eventsCache.exp) {
		w.Header().Set("Content-Type", "application/json")
		w.Write(eventsCache.data)
		return
	}

	// 3) Fetch ICS
	resp, err := http.Get(icsURL)
	if err != nil || resp.StatusCode >= 400 {
		http.Error(w, "calendar fetch error", http.StatusBadGateway)
		if resp != nil {
			resp.Body.Close()
		}
		return
	}
	defer resp.Body.Close()

	// 4) Parse minimal VEVENTs
	sc := bufio.NewScanner(resp.Body)
	sc.Buffer(make([]byte, 64*1024), 1024*1024)

	var evs []Event
	var in bool
	ev := Event{}
	for sc.Scan() {
		line := sc.Text()

		switch {
		case line == "BEGIN:VEVENT":
			in = true
			ev = Event{}
		case line == "END:VEVENT":
			if in && !ev.StartsAt.IsZero() && ev.StartsAt.After(now.Add(-2*time.Hour)) {
				evs = append(evs, ev)
			}
			in = false
		default:
			if !in {
				continue
			}
			if strings.HasPrefix(line, "SUMMARY:") {
				ev.Title = strings.TrimPrefix(line, "SUMMARY:")
			} else if strings.HasPrefix(line, "LOCATION:") {
				ev.Location = strings.TrimPrefix(line, "LOCATION:")
			} else if strings.HasPrefix(line, "URL:") {
				ev.Link = strings.TrimPrefix(line, "URL:")
			} else if strings.HasPrefix(line, "DTSTART") {
				if t, ok := parseICSTime(line); ok {
					ev.StartsAt = t
				}
			} else if strings.HasPrefix(line, "DTEND") {
				if t, ok := parseICSTime(line); ok {
					ev.EndsAt = t
				}
			}
		}
	}

	// 5) Sort & limit
	sort.Slice(evs, func(i, j int) bool { return evs[i].StartsAt.Before(evs[j].StartsAt) })
	if len(evs) > 8 {
		evs = evs[:8]
	}

	// 6) Encode + cache
	b, _ := json.Marshal(evs)
	eventsCache.data = b
	eventsCache.exp = now.Add(5 * time.Minute)

	w.Header().Set("Content-Type", "application/json")
	w.Write(b)
}

func parseICSTime(line string) (time.Time, bool) {
	// DTSTART[:|;TZID=...]value
	parts := strings.SplitN(line, ":", 2)
	if len(parts) != 2 {
		return time.Time{}, false
	}
	val := parts[1]

	// Zulu
	if strings.HasSuffix(val, "Z") {
		if t, err := time.Parse("20060102T150405Z", val); err == nil {
			return t, true
		}
		if t, err := time.Parse("20060102T1504Z", val); err == nil {
			return t, true
		}
	}
	// Local (assume server TZ)
	for _, layout := range []string{"20060102T150405", "20060102T1504"} {
		if t, err := time.ParseInLocation(layout, val, time.Local); err == nil {
			return t, true
		}
	}
	return time.Time{}, false
}

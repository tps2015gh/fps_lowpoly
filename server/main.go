package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"
	"io"
)

var (
	logMutex sync.Mutex
	logPath  = "game_logs.txt"
)

func logHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading body", http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	logMutex.Lock()
	defer logMutex.Unlock()

	f, err := os.OpenFile(logPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		http.Error(w, "Error opening log file", http.StatusInternalServerError)
		return
	}
	defer f.Close()

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	if _, err := f.WriteString(fmt.Sprintf("[%s] %s\n", timestamp, string(body))); err != nil {
		http.Error(w, "Error writing to log file", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func main() {
	port := flag.String("port", "8080", "Port to serve on")
	flag.Parse()

	// Get the absolute path to the public directory
	publicDir, err := filepath.Abs("./public")
	if err != nil {
		log.Fatalf("Error finding public directory: %v", err)
	}

	// Truncate/Reset log file on start
	os.WriteFile(logPath, []byte("--- SERVER START: " + time.Now().Format("2006-01-02 15:04:05") + " ---\n"), 0644)

	// Simple file server
	fs := http.FileServer(http.Dir(publicDir))
	
	// Handle routes
	http.HandleFunc("/log", logHandler)
	http.Handle("/", fs)

	fmt.Printf("Starting server on http://localhost:%s\n", *port)
	fmt.Println("Serving from:", publicDir)
	
	err = http.ListenAndServe(":"+*port, nil)
	if err != nil {
		fmt.Printf("Failed to start server: %v\n", err)
		os.Exit(1)
	}
}

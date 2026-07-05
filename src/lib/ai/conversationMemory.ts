// src/lib/ai/conversationMemory.ts

/**
 * Lightweight in‑memory conversation manager for a specific target word.
 * Stores recent user and assistant exchanges to provide context for AI helper calls.
 * The history is capped to a configurable number of turns.
 */

export interface Message {
  role: "user" | "assistant"
  content: string
}

const DEFAULT_MAX_TURNS = 4 // keep last 4 user + 4 assistant messages (8 total)

class ConversationMemory {
  private readonly map = new Map<string, Message[]>()
  private readonly maxTurns: number

  constructor(maxTurns?: number) {
    this.maxTurns = maxTurns ?? DEFAULT_MAX_TURNS
  }

  private getKey(word: string, language?: string): string {
    return `${word}|${language ?? "en"}`
  }

  /** Add a user message for the given word */
  addUser(word: string, content: string, language?: string) {
    this.addMessage(word, { role: "user", content }, language)
  }

  /** Add an assistant (AI) message for the given word */
  addAssistant(word: string, content: string, language?: string) {
    this.addMessage(word, { role: "assistant", content }, language)
  }

  private addMessage(word: string, msg: Message, language?: string) {
    const key = this.getKey(word, language)
    const history = this.map.get(key) ?? []
    history.push(msg)
    // Trim oldest entries if we exceed the limit (each turn = user+assistant)
    while (history.length > this.maxTurns * 2) {
      history.shift()
    }
    this.map.set(key, history)
  }

  /** Retrieve the current conversation history for the word */
  getHistory(word: string, language?: string): Message[] {
    const key = this.getKey(word, language)
    return this.map.get(key) ?? []
  }

  /** Clear all stored messages for a word (called when moving to next word) */
  clear(word: string, language?: string) {
    const key = this.getKey(word, language)
    this.map.delete(key)
  }
}

// Export a singleton instance used across the app
export const conversationMemory = new ConversationMemory()

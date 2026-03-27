"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { SearchIcon } from "./Icons"

interface SearchBarProps {
  onSearch: (query: string) => void
  onClear: () => void
}

export function SearchBar({ onSearch, onClear }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  const debouncedSearch = useCallback(
    (value: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        if (value.length >= 2) {
          onSearch(value)
        } else if (value.length === 0) {
          onClear()
        }
      }, 300)
    },
    [onSearch, onClear]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    debouncedSearch(value)
  }

  const handleClear = () => {
    setQuery("")
    onClear()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClear()
    }
  }

  return (
    <div
      className={`flex items-center flex-1 max-w-[720px] rounded-full transition-shadow ${
        focused ? "bg-white shadow-md" : "bg-gray-100 hover:shadow-sm"
      }`}
    >
      <div className="pl-4 pr-2">
        <SearchIcon className="w-5 h-5 text-gray-500" />
      </div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder="Search mail"
        className="flex-1 py-3 px-2 bg-transparent text-sm text-gray-900 placeholder-gray-500 outline-none"
      />
      {query && (
        <button onClick={handleClear} className="pr-4 text-gray-500 hover:text-gray-700 text-lg">
          &times;
        </button>
      )}
    </div>
  )
}

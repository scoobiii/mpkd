import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Search, ChevronRight, CornerDownLeft, Sparkles, Check } from 'lucide-react';
import { RhinoCommandItem } from '../types/rhino';

interface RhinoCommandLineProps {
  onExecuteCommand: (commandId: string) => void;
  availableCommands: RhinoCommandItem[];
  lastFeedback?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const RhinoCommandLine: React.FC<RhinoCommandLineProps> = ({
  onExecuteCommand,
  availableCommands,
  lastFeedback = 'Digite um comando Rhino (ex: _Zebra, _Ghosted, _ClippingPlane, _Gumball, _Export3DM)',
  isExpanded = false,
  onToggleExpand,
}) => {
  const [inputVal, setInputVal] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = availableCommands.filter(
    (c) =>
      c.command.toLowerCase().includes(inputVal.toLowerCase()) ||
      c.name.toLowerCase().includes(inputVal.toLowerCase()) ||
      c.description.toLowerCase().includes(inputVal.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0) {
        const cmd = filtered[selectedIndex];
        onExecuteCommand(cmd.id);
        setInputVal('');
        setIsFocused(false);
        inputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      setInputVal('');
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative font-mono text-xs w-full max-w-xl">
      {/* Rhino Classic Command Bar Header */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-xl transition-all duration-200 shadow-2xl ${
          isFocused
            ? 'bg-neutral-900/95 border-amber-400 ring-2 ring-amber-400/20'
            : 'bg-neutral-950/85 border-neutral-700/80 hover:border-neutral-600'
        }`}
      >
        <div className="flex items-center gap-1 text-amber-400 shrink-0 font-bold">
          <Terminal className="w-3.5 h-3.5" />
          <span className="text-[11px]">Command:</span>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={lastFeedback}
          className="bg-transparent flex-1 outline-none text-white text-xs placeholder:text-neutral-500 font-mono"
        />

        {inputVal.length > 0 && (
          <span className="text-[10px] text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
            <CornerDownLeft className="w-2.5 h-2.5" /> Enter
          </span>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isFocused && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-neutral-900/98 backdrop-blur-2xl border border-neutral-700 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
          <div className="p-1.5 space-y-0.5">
            {filtered.map((cmd, idx) => (
              <button
                key={cmd.id}
                onMouseDown={() => {
                  onExecuteCommand(cmd.id);
                  setInputVal('');
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                  idx === selectedIndex
                    ? 'bg-amber-400 text-neutral-950 font-semibold'
                    : 'text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-300 font-mono group-hover:text-amber-200">
                    {cmd.command}
                  </span>
                  <span className="text-neutral-400 text-[11px] truncate">{cmd.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] opacity-75 font-mono uppercase tracking-wider">
                    {cmd.category}
                  </span>
                  {cmd.shortcut && (
                    <span className="text-[9px] bg-neutral-800/80 px-1.5 py-0.5 rounded font-mono">
                      {cmd.shortcut}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

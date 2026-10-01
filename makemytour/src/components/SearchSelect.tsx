import React, { useEffect, useMemo, useRef } from "react";

const DEFAULT_CITIES = ["Bengaluru","Delhi","Mumbai","Hyderabad","Chennai","Kolkata","Pune","Ahmedabad","Jaipur","Goa"];

export function SearchSelect({ options = [], placeholder, value, onChange, icon, subtitle }: any) {
  const [isOpen, setIsOpen] = React.useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalize = (text: string) => String(text || "").trim().toLowerCase().replace(/\bbangalore\b/g, "bengaluru");

  const allOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>();
    DEFAULT_CITIES.forEach(city => map.set(normalize(city), { value: city, label: city }));
    if (Array.isArray(options)) options.forEach((option: any) => {
      if (option?.label) map.set(normalize(option.label), { value: option.value ?? option.label, label: option.label });
    });
    return Array.from(map.values());
  }, [options]);

  const filteredOptions = allOptions.filter(option => normalize(option.label).includes(normalize(String(value || ""))));

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="border border-gray-200 rounded-lg p-3 bg-white hover:border-blue-500" onClick={() => setIsOpen(true)}>
        <div className="flex items-center gap-2">
          {icon}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-500 truncate">{placeholder}</div>
            <input type="text" value={value || ""} onChange={(e) => { onChange(e.target.value); setIsOpen(true); }} onFocus={() => setIsOpen(true)} autoComplete="off" className="font-semibold w-full bg-transparent text-gray-900 outline-none border-none p-0" placeholder={placeholder} />
            <div className="text-xs text-gray-400 truncate">{subtitle}</div>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full z-[99999] bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto p-1">
            {filteredOptions.length > 0 ? filteredOptions.map(option => (
              <button key={`${option.value}-${option.label}`} type="button" onMouseDown={e => e.preventDefault()} onClick={() => { onChange(option.value); setIsOpen(false); }} className="block w-full text-left px-3 py-3 rounded-md text-gray-900 bg-white hover:bg-gray-100 cursor-pointer">
                <span className="font-medium">{option.label}</span>
                <span className="block text-xs text-gray-500">City / Airport</span>
              </button>
            )) : <div className="px-3 py-4 text-sm text-gray-500">No matching cities or airports</div>}
          </div>
        </div>
      )}
    </div>
  );
}

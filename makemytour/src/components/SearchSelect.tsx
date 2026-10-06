import React, { useEffect, useMemo, useRef } from "react";

interface SearchSelectProps {
  options?: any[];
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  subtitle?: string;
  excludeValue?: string;
}

export function SearchSelect({
  options = [],
  placeholder,
  value = "",
  onChange,
  icon,
  subtitle,
  excludeValue = "",
}: SearchSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const normalize = (text: string) => {
    return String(text || "")
      .trim()
      .toLowerCase()
      .replace(/\bbangalore\b/g, "bengaluru");
  };

  /*
   * Use ONLY the options supplied by the parent.
   *
   * This is important because the Home page already gives us
   * the correct From/To route options.
   */
  const allOptions = useMemo(() => {
    const map = new Map<
      string,
      { value: string; label: string }
    >();

    if (Array.isArray(options)) {
      options.forEach((option: any) => {
        if (option?.label) {
          const normalizedLabel = normalize(option.label);

          map.set(normalizedLabel, {
            value: option.value ?? option.label,
            label: option.label,
          });
        }
      });
    }

    return Array.from(map.values());
  }, [options]);

  /*
   * Remove the selected From city from the To list.
   *
   * Example:
   * From = Bengaluru
   * To = Delhi, Mumbai, Hyderabad...
   *
   * Bengaluru will never appear in To.
   */
  const availableOptions = useMemo(() => {
    const excluded = normalize(excludeValue);

    return allOptions.filter((option) => {
      if (!excluded) {
        return true;
      }

      return normalize(option.value) !== excluded;
    });
  }, [allOptions, excludeValue]);

  /*
   * Filter according to what the user types.
   */
  const filteredOptions = useMemo(() => {
    const searchText = normalize(value);

    return availableOptions.filter((option) =>
      normalize(option.label).includes(searchText)
    );
  }, [availableOptions, value]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className="border border-gray-200 rounded-lg p-3 bg-white hover:border-blue-500"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-2">
          {icon}

          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-500 truncate">
              {placeholder}
            </div>

            <input
              type="text"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              autoComplete="off"
              className="font-semibold w-full bg-transparent text-gray-900 outline-none border-none p-0"
              placeholder={placeholder}
            />

            <div className="text-xs text-gray-400 truncate">
              {subtitle}
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full z-[99999] bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={`${option.value}-${option.label}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-3 rounded-md text-gray-900 bg-white hover:bg-gray-100 cursor-pointer"
                >
                  <span className="font-medium">
                    {option.label}
                  </span>

                  <span className="block text-xs text-gray-500">
                    City / Airport
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500">
                No matching cities or airports
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
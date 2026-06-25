"use client";

type QuantityStepperProps = {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  required?: boolean;
};

function clamp(value: number, min: number, max?: number) {
  const lowerBounded = Math.max(min, value);

  if (max === undefined) {
    return lowerBounded;
  }

  return Math.min(lowerBounded, max);
}

function parseInteger(value: string) {
  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) ? parsed : null;
}

export function QuantityStepper({
  id,
  name,
  value,
  onChange,
  min = 1,
  max,
  required = false
}: QuantityStepperProps) {
  const parsedValue = parseInteger(value);
  const currentValue = parsedValue ?? min;
  const decreaseDisabled = currentValue <= min;
  const increaseDisabled = max !== undefined && currentValue >= max;

  function update(nextValue: number) {
    onChange(String(clamp(nextValue, min, max)));
  }

  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_4.5rem]">
      <button
        aria-label="Уменьшить количество"
        className="min-h-14 rounded-l-lg border border-slate-200 bg-white text-3xl font-bold text-ink active:scale-[0.98] disabled:cursor-not-allowed disabled:text-slate-300"
        disabled={decreaseDisabled}
        type="button"
        onClick={() => update(currentValue - 1)}
      >
        −
      </button>
      <input
        className="min-h-14 min-w-0 border-y border-slate-200 bg-white px-3 text-center text-2xl font-bold text-ink outline-none focus:ring-4 focus:ring-blue-100"
        id={id}
        inputMode="numeric"
        max={max}
        min={min}
        name={name}
        pattern="[0-9]*"
        required={required}
        step={1}
        type="number"
        value={value}
        onBlur={() => {
          if (!value) {
            onChange(String(min));
          }
        }}
        onChange={(event) => {
          const nextValue = event.target.value;

          if (!nextValue) {
            onChange("");
            return;
          }

          const parsedNextValue = parseInteger(nextValue);

          if (parsedNextValue !== null) {
            update(parsedNextValue);
          }
        }}
      />
      <button
        aria-label="Увеличить количество"
        className="min-h-14 rounded-r-lg border border-slate-200 bg-white text-3xl font-bold text-ink active:scale-[0.98] disabled:cursor-not-allowed disabled:text-slate-300"
        disabled={increaseDisabled}
        type="button"
        onClick={() => update(currentValue + 1)}
      >
        +
      </button>
    </div>
  );
}

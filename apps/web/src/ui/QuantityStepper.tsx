interface QuantityStepperProps {
  label: string;
  value: number;
  min?: number;
  max: number;
  busy?: boolean;
  onChange: (value: number) => void;
}

export function QuantityStepper({
  label,
  value,
  min = 0,
  max,
  busy,
  onChange,
}: QuantityStepperProps) {
  return (
    <div className="stepper" role="group" aria-label={label} aria-busy={busy || undefined}>
      <button
        type="button"
        className="stepper__button"
        aria-label="Уменьшить количество"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <output className="stepper__value" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className="stepper__button"
        aria-label="Увеличить количество"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}

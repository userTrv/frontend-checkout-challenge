import { useId, type ReactNode } from 'react';
import { cx } from '../lib/classNames';

export interface Choice<V extends string> {
  value: V;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

interface ChoiceGroupProps<V extends string> {
  legend: string;
  name: string;
  value: string;
  options: readonly Choice<V>[];
  onChange: (value: V) => void;
  onBlur?: () => void;
  error?: string;
}

export function ChoiceGroup<V extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  onBlur,
  error,
}: ChoiceGroupProps<V>) {
  const errorId = `${useId()}-error`;
  return (
    <fieldset className="choices" aria-describedby={error ? errorId : undefined}>
      <legend className="field__label">{legend}</legend>
      <div className="choices__list">
        {options.map((option) => (
          <label
            key={option.value}
            className={cx(
              'choice',
              option.value === value && 'choice--checked',
              option.disabled && 'choice--disabled',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              disabled={option.disabled}
              aria-invalid={error ? true : undefined}
              onChange={() => onChange(option.value)}
              onBlur={onBlur}
            />
            <span className="choice__text">
              <span className="choice__label">{option.label}</span>
              {option.description && (
                <span className="choice__description">{option.description}</span>
              )}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="field__error">
          {error}
        </p>
      )}
    </fieldset>
  );
}

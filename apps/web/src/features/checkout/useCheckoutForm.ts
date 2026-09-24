import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { tabStore } from '../../lib/storage';
import {
  EMPTY_CHECKOUT,
  hasErrors,
  validate,
  type CheckoutField,
  type CheckoutValues,
  type FieldErrors,
} from './validation';

const DRAFT_KEY = 'checkout.draft';

export function clearCheckoutDraft() {
  tabStore.remove(DRAFT_KEY);
}

export function useCheckoutForm() {
  const [values, setValues] = useState<CheckoutValues>(() => ({
    ...EMPTY_CHECKOUT,
    ...tabStore.getJson<Partial<CheckoutValues>>(DRAFT_KEY),
  }));
  const [touched, setTouched] = useState<ReadonlySet<CheckoutField>>(() => new Set());
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const errors = useMemo(() => validate(values), [values]);

  useEffect(() => tabStore.setJson(DRAFT_KEY, values), [values]);

  const setValue = useCallback(<F extends CheckoutField>(field: F, value: CheckoutValues[F]) => {
    setValues((current) => (current[field] === value ? current : { ...current, [field]: value }));
    setServerErrors((current) => {
      if (!(field in current)) return current;
      const { [field]: _removed, ...rest } = current;
      return rest;
    });
  }, []);

  const touch = useCallback((field: CheckoutField) => {
    setTouched((current) => (current.has(field) ? current : new Set(current).add(field)));
  }, []);

  const errorOf = (field: CheckoutField): string | undefined =>
    serverErrors[field] ?? (submitted || touched.has(field) ? errors[field] : undefined);

  const textField = (field: CheckoutField) => ({
    name: field,
    value: values[field],
    error: errorOf(field),
    onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(field, event.target.value),
    onBlur: () => touch(field),
  });

  const submit = () => {
    setSubmitted(true);
    return !hasErrors(errors);
  };

  return { values, setValue, touch, errorOf, textField, submit, setServerErrors };
}

export type CheckoutForm = ReturnType<typeof useCheckoutForm>;

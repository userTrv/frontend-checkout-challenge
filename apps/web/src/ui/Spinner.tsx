export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

export function Loading({ label }: { label: string }) {
  return (
    <p className="loading" role="status">
      <Spinner />
      {label}
    </p>
  );
}

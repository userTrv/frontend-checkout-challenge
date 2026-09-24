export function cx(...names: Array<string | false | null | undefined>): string {
  let result = '';
  for (const name of names) if (name) result = result ? `${result} ${name}` : name;
  return result;
}

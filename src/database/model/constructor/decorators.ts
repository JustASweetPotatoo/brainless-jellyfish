const REPOSITORY_KEY = Symbol("repo");

export function Repository(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(REPOSITORY_KEY, true, target);
  };
}

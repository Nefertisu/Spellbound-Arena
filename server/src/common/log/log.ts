export function log(
  level: 'info' | 'debug' | 'error',
  clientId: string | number,
  direction: string,
  message: string | object,
) {
  const timestamp = new Date().toISOString();
  const msgString =
    typeof message === 'object' ? JSON.stringify(message) : message;

  console.log(
    `[${timestamp}] [${level}] [Client:${clientId}] [${direction}] ${msgString}`,
  );
}

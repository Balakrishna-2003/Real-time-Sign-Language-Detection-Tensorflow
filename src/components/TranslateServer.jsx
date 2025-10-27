// This is a server component (default in React 18+ with RSC support)
import translate from 'google-translate-api-x';

export default async function TranslateServer() {
  const result = await translate('Ik spreek Engels', { to: 'en' });

  return (
    <div>
      <h1>Translation from Server Component</h1>
      <p>{result.text}</p>
    </div>
  );
}

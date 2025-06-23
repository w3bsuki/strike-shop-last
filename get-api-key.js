export default async function ({ container }) {
  const query = container.resolve('query');

  try {
    // Get API keys
    const { data: apiKeys } = await query.graph({
      entity: 'api_key',
      fields: ['id', 'title', 'token', 'type'],
    });

    console.log('API Keys found:');
    apiKeys.forEach((key) => {
      console.log(`- ${key.title}: ${key.token} (${key.type})`);
    });

    if (apiKeys.length === 0) {
      console.log('No API keys found. Creating one...');

      const { data: newKey } = await query.graph({
        entity: 'api_key',
        fields: ['id', 'title', 'token'],
        filters: {},
        create: {
          title: 'Default Store Key',
          type: 'publishable',
        },
      });

      console.log(`Created API key: ${newKey.token}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

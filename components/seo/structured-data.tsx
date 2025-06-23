import Script from 'next/script';

interface StructuredDataProps {
  data: object;
  id: string;
  type?: 'beforeInteractive' | 'afterInteractive' | 'lazyOnload';
}

/**
 * Component for injecting JSON-LD structured data
 */
export function StructuredData({ 
  data, 
  id, 
  type = 'afterInteractive' 
}: StructuredDataProps) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      strategy={type}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 0),
      }}
    />
  );
}

/**
 * Multiple structured data scripts
 */
export function MultipleStructuredData({ 
  schemas 
}: { 
  schemas: Array<{ data: object; id: string }> 
}) {
  return (
    <>
      {schemas.map(({ data, id }) => (
        <StructuredData 
          key={id} 
          data={data} 
          id={id} 
        />
      ))}
    </>
  );
}
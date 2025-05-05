interface GlossaryItemProps {
    number?: string
    title: string
    description?: string
    items?: string[]
  }
  
  export default function GlossaryItem({ number, title, description, items }: Readonly<GlossaryItemProps>) {
    return (
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">
          {number && `${number}. `}
          {title}
        </h4>
  
        {description && <p className="text-gray-700 mb-2" data-testid="glossary-item-description">{description}</p>}
  
        {items && items.length > 0 && (
          <ul className="list-disc pl-6 space-y-2">
            {items.map((item) => (
              <li 
                key={`${title}-item-${item.substring(0, 15)}`} 
                className="text-gray-700"
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
  
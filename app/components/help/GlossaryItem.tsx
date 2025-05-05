interface GlossaryItemProps {
    number?: string
    title: string
    description?: string
    items?: string[]
  }
  
  export default function GlossaryItem({ number, title, description, items }: GlossaryItemProps) {
    return (
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">
          {number && `${number}. `}
          {title}
        </h4>
  
        {description && <p className="text-gray-700 mb-2">{description}</p>}
  
        {items && items.length > 0 && (
          <ul className="list-disc pl-6 space-y-2">
            {items.map((item, index) => (
              <li key={index} className="text-gray-700">
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
  
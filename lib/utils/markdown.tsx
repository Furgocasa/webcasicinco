import React from 'react';

/**
 * Renderiza markdown básico a JSX
 * Soporta:
 * - **negrita**
 * - Saltos de línea
 * - Enlaces [texto](url)
 */
export function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Procesar cada línea
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Regex para encontrar **texto** (negrita)
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    
    while ((match = boldRegex.exec(line)) !== null) {
      // Añadir texto antes del match
      if (match.index > lastIndex) {
        elements.push(line.substring(lastIndex, match.index));
      }
      
      // Añadir texto en negrita
      elements.push(
        <strong key={`bold-${lineIndex}-${match.index}`} className="font-semibold text-gray-900">
          {match[1]}
        </strong>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Añadir texto restante después del último match
    if (lastIndex < line.length) {
      elements.push(line.substring(lastIndex));
    }
    
    // Si la línea está vacía, es un salto de párrafo
    if (line.trim() === '') {
      return <br key={`br-${lineIndex}`} />;
    }
    
    // Retornar la línea procesada
    return (
      <React.Fragment key={`line-${lineIndex}`}>
        {elements.length > 0 ? elements : line}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

/**
 * Componente para renderizar markdown
 */
interface MarkdownTextProps {
  text: string;
  className?: string;
}

export function MarkdownText({ text, className = '' }: MarkdownTextProps) {
  return (
    <div className={className}>
      {renderMarkdown(text)}
    </div>
  );
}


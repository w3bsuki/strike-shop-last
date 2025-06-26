import { DividerSection, DividerMarquee } from '@/components/divider';

interface SectionDividerProps {
  text?: string;
  className?: string;
}

export function SectionDivider({ 
  text = "STRIKE™", 
  className = "" 
}: SectionDividerProps) {
  return (
    <DividerSection theme="default" size="default" className={className}>
      <DividerMarquee text={text} />
    </DividerSection>
  );
}
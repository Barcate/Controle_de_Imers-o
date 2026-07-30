type GCodePreviewProps = {
  gcode: string;
};

export function GCodePreview({ gcode }: GCodePreviewProps) {
  const lineCount = gcode.trim() ? gcode.trim().split(/\r?\n/).length : 0;

  return (
    <div className="console-window flex h-full flex-col">
      <div className="console-titlebar shrink-0">
        <span>Preview do G-code</span>
        <span>{lineCount} linhas</span>
      </div>
      <pre className="console-body min-h-0 flex-1">{gcode || "; Arquivo gerado pelo Controle de Imersão..."}</pre>
    </div>
  );
}
type GCodePreviewProps = {
  gcode: string;
};

export function GCodePreview({ gcode }: GCodePreviewProps) {
  const lineCount = gcode.trim() ? gcode.trim().split(/\r?\n/).length : 0;

  return (
    <div className="console-window">
      <div className="console-titlebar">
        <span>Preview do G-code</span>
        <span>{lineCount} linhas</span>
      </div>
      <pre className="console-body h-[360px] text-emerald-100">{gcode || "; Gere o G-code para visualizar aqui."}</pre>
    </div>
  );
}

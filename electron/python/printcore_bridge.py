import json
import sys
import threading
import time
import traceback

try:
    from printrun.printcore import printcore
    from printrun import gcoder
    from serial.tools import list_ports
except Exception as exc:
    print(json.dumps({
        "type": "ready",
        "ok": False,
        "error": f"Falha ao importar Printrun/pyserial: {exc}"
    }), flush=True)
else:
    print(json.dumps({"type": "ready", "ok": True}), flush=True)


printer = None
printer_lock = threading.Lock()


def emit(event_type, **payload):
    print(json.dumps({"type": event_type, **payload}), flush=True)


def emit_log(level, message):
    emit("log", level=level, message=message)


def require_printrun():
    if "printcore" not in globals() or "gcoder" not in globals():
        raise RuntimeError("Printrun nao esta disponivel. Instale com: py -m pip install Printrun")


def wait_online(timeout_seconds=20):
    started_at = time.time()
    while time.time() - started_at < timeout_seconds:
        with printer_lock:
            current = printer
        if current is not None and getattr(current, "online", False):
            return
        time.sleep(0.1)
    raise TimeoutError("Tempo esgotado aguardando a maquina ficar online.")


def attach_callbacks(current):
    def received(line):
        text = str(line).strip()
        if text:
            emit_log("received", text)

    def sent(line):
        text = str(line).strip()
        if text:
            emit_log("sent", text)

    def error(error):
        emit_log("error", f"Erro printcore: {error}")

    current.recvcb = received
    current.sendcb = sent
    current.errorcb = error


def handle_list_ports(request_id):
    ports = []
    for port in list_ports.comports():
        ports.append({
            "path": port.device,
            "manufacturer": port.manufacturer,
            "serialNumber": port.serial_number,
            "vendorId": f"{port.vid:04X}" if port.vid is not None else None,
            "productId": f"{port.pid:04X}" if port.pid is not None else None,
        })
    emit("response", id=request_id, ok=True, result=ports)


def handle_connect(request_id, path, baud_rate):
    global printer
    require_printrun()
    handle_disconnect(None, quiet=True)
    current = printcore(path, int(baud_rate))
    attach_callbacks(current)
    with printer_lock:
        printer = current
    wait_online()
    emit_log("info", f"Conectado em {path} com printcore.")
    emit("response", id=request_id, ok=True)


def handle_disconnect(request_id, quiet=False):
    global printer
    with printer_lock:
        current = printer
        printer = None

    if current is not None:
        current.disconnect()

    if not quiet:
        emit_log("info", "Desconectado.")

    if request_id is not None:
        emit("response", id=request_id, ok=True)


def handle_send_gcode(request_id, gcode_text):
    require_printrun()
    lines = [line.strip() for line in gcode_text.splitlines() if line.strip()]
    if not lines:
        raise ValueError("G-code vazio.")

    with printer_lock:
        current = printer

    if current is None or not getattr(current, "online", False):
        raise RuntimeError("Maquina nao conectada no printcore.")

    gcode = gcoder.LightGCode(lines)
    current.startprint(gcode)
    emit_log("info", f"Envio iniciado pelo printcore com {len(lines)} linha(s).")
    emit("response", id=request_id, ok=True)


def handle_emergency_stop(request_id):
    with printer_lock:
        current = printer

    if current is None or not getattr(current, "online", False):
        raise RuntimeError("Maquina nao conectada no printcore.")

    if hasattr(current, "pause"):
        current.pause()
    current.send_now("M112")
    current.send_now("M410")
    emit_log("error", "Parada de emergencia enviada pelo printcore.")
    emit("response", id=request_id, ok=True)


handlers = {
    "list_ports": lambda req: handle_list_ports(req["id"]),
    "connect": lambda req: handle_connect(req["id"], req["path"], req["baudRate"]),
    "disconnect": lambda req: handle_disconnect(req["id"]),
    "send_gcode": lambda req: handle_send_gcode(req["id"], req["gcode"]),
    "emergency_stop": lambda req: handle_emergency_stop(req["id"]),
}


for raw_line in sys.stdin:
    try:
        request = json.loads(raw_line)
        command = request.get("command")
        if command not in handlers:
            raise ValueError(f"Comando desconhecido: {command}")
        handlers[command](request)
    except Exception as exc:
        traceback.print_exc(file=sys.stderr)
        emit("response", id=request.get("id") if "request" in locals() else None, ok=False, error=str(exc))

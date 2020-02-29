import stream
from typing import Any

"""
multiterminal
"""


# shared-bindings/multiterminal/__init__.c:45
def get_secondary_terminal() -> Any: ...

# shared-bindings/multiterminal/__init__.c:54
def set_secondary_terminal(stream: stream) -> Any: ...

# shared-bindings/multiterminal/__init__.c:76
def clear_secondary_terminal() -> Any: ...

# shared-bindings/multiterminal/__init__.c:86
def schedule_secondary_terminal_read(socket: Any) -> Any: ...

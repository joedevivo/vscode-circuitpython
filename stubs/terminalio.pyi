from typing import Any

"""
terminalio
"""


# shared-bindings/terminalio/Terminal.c:46
class Terminal:
    def __init__(self, tilegrid: Any, font: Any): ...
    def write(self, buf: Any) -> Any: ...

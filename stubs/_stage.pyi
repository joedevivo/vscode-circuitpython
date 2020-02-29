import displayio
from typing import Any

"""
_stage
"""


# shared-bindings/_stage/__init__.c:54
def render(x0: int, y0: int, x1: int, y1: int, layers: list, buffer: bytearray, display: displayio.Display, scale: int, background: int) -> Any: ...

# shared-bindings/_stage/Text.c:38
class Text:
    def __init__(self, width: int, height: int, font: bytearray, palette: bytearray, chars: bytearray): ...
    def move(self, x: Any, y: Any) -> Any: ...

# shared-bindings/_stage/Layer.c:38
class Layer:
    def __init__(self, width: int, height: int, graphic: bytearray, palette: bytearray, grid: bytearray): ...
    def move(self, x: Any, y: Any) -> Any: ...
    def frame(self, frame: Any, rotation: Any) -> Any: ...

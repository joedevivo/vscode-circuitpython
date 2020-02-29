import displayio
from typing import Any

"""
fontio
"""


# shared-bindings/fontio/Glyph.c:36
class Glyph:
    def __init__(self, bitmap: displayio.Bitmap, tile_index: int, width: int, height: int, dx: int, dy: int, shift_x: int, shift_y: int): ...

# shared-bindings/fontio/BuiltinFont.c:46
class BuiltinFont:
    def __init__(self, ): ...
    bitmap: Any = ...
    def get_bounding_box(self, ) -> Any: ...
    def get_glyph(self, codepoint: Any) -> Any: ...

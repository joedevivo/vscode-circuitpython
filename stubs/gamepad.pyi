from typing import Any

"""
gamepad
"""


# shared-bindings/gamepad/GamePad.c:75
class GamePad:
    def __init__(self, b1: Any, b2: Any, b3: Any, b4: Any, b5: Any, b6: Any, b7: Any, b8: Any): ...
    def get_pressed(self, ) -> Any: ...
    def deinit(self, ) -> Any: ...

from typing import Any

"""
gamepadshift
"""


# shared-bindings/gamepadshift/GamePadShift.c:40
class GamePadShift:
    def __init__(self, clock: Any, data: Any, latch: Any): ...
    def get_pressed(self, ) -> Any: ...
    def deinit(self, ) -> Any: ...

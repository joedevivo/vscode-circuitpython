from typing import Any

"""
usb_midi
"""


# shared-bindings/usb_midi/PortOut.c:44
class PortOut:
    def __init__(self, ): ...
    def write(self, buf: Any) -> Any: ...

# shared-bindings/usb_midi/PortIn.c:44
class PortIn:
    def __init__(self, ): ...
    def read(self, nbytes: Any = None) -> Any: ...
    def readinto(self, buf: Any, nbytes: Any = None) -> Any: ...

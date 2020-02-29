import busio
import microcontroller
from typing import Any

"""
wiznet
"""


# shared-bindings/wiznet/wiznet5k.c:54
class WIZNET5K:
    def __init__(self, spi: busio.SPI, cs: microcontroller.Pin, rst: microcontroller.Pin, dhcp: bool = True): ...
    connected: Any = ...
    dhcp: Any = ...
    def ifconfig(self, params: Any = None) -> Any: ...

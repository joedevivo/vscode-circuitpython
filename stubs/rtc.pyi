from typing import Any

"""
rtc
"""


# shared-bindings/rtc/RTC.c:46
class RTC:
    def __init__(self, ): ...
    datetime: Any = ...
    calibration: Any = ...

# shared-bindings/rtc/__init__.c:65
def set_time_source(rtc: Any) -> Any: ...

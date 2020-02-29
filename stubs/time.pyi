from typing import Any

"""
time
"""


# shared-bindings/time/__init__.c:50
def monotonic() -> Any: ...

# shared-bindings/time/__init__.c:65
def sleep(seconds: float) -> Any: ...

# shared-bindings/time/__init__.c:100
class struct_time:
    def __init__(self, time_tuple: Any): ...

# shared-bindings/time/__init__.c:197
def time() -> Any: ...

# shared-bindings/time/__init__.c:213
def monotonic_ns() -> Any: ...

# shared-bindings/time/__init__.c:226
def localtime(secs: Any) -> Any: ...

# shared-bindings/time/__init__.c:259
def mktime(t: Any) -> Any: ...

from typing import Any

"""
struct
"""


# shared-bindings/struct/__init__.c:59
def calcsize(fmt: Any) -> Any: ...

# shared-bindings/struct/__init__.c:70
def pack(fmt: Any, *values: Any) -> Any: ...

# shared-bindings/struct/__init__.c:88
def pack_into(fmt: Any, buffer: Any, offset: Any, *values: Any) -> Any: ...

# shared-bindings/struct/__init__.c:114
def unpack(fmt: Any, data: Any) -> Any: ...

# shared-bindings/struct/__init__.c:132
def unpack_from(fmt: Any, data: Any, offset: Any = 0) -> Any: ...

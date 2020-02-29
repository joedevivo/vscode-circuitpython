from typing import Any

"""
random
"""


# shared-bindings/random/__init__.c:55
def seed(seed: Any) -> Any: ...

# shared-bindings/random/__init__.c:67
def getrandbits(k: Any) -> Any: ...

# shared-bindings/random/__init__.c:80
def randrange(stop: Any) -> Any: ...

# shared-bindings/random/__init__.c:123
def randint(a: Any, b: Any) -> Any: ...

# shared-bindings/random/__init__.c:138
def choice(seq: Any) -> Any: ...

# shared-bindings/random/__init__.c:152
def random() -> Any: ...

# shared-bindings/random/__init__.c:161
def uniform(a: Any, b: Any) -> Any: ...

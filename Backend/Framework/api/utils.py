import re
from django.db import transaction
from rest_framework import serializers

_LINE_SPLIT = re.compile(r"[\r\n]+")
_SEPS = {" | ", "|"}
_FORBIDDEN = {"|"}

def _yield_lines(block: str):
    for line in _LINE_SPLIT.split(block or ""):
        s = (line or "").strip()
        if s:
            yield s

def _split_title_second(line: str):
    title, second = line, ""
    print(f"title: {title}, second: {second}")

    for sep in _SEPS:
        if sep in line:
            left, right = line.split(sep, 1)
            title, second = left.strip(), right.strip()
            break
    return title, second

#!/usr/bin/env python3

"""Generate a simple 1024x1024 RGBA PNG icon with transparency.

Tauri's `tauri icon` expects a 1024x1024 PNG with an alpha channel.
We keep this dependency-free (no Pillow) by writing a minimal PNG.
"""

from __future__ import annotations

import struct
import zlib


W = 1024
H = 1024


def chunk(chunk_type: bytes, data: bytes) -> bytes:
    length = struct.pack(">I", len(data))
    crc = zlib.crc32(chunk_type)
    crc = zlib.crc32(data, crc)
    crc_bytes = struct.pack(">I", crc & 0xFFFFFFFF)
    return length + chunk_type + data + crc_bytes


def clamp(n: int) -> int:
    return 0 if n < 0 else 255 if n > 255 else n


def set_px(pixels: bytearray, x: int, y: int, r: int, g: int, b: int, a: int) -> None:
    if x < 0 or y < 0 or x >= W or y >= H:
        return
    i = (y * W + x) * 4
    pixels[i + 0] = clamp(r)
    pixels[i + 1] = clamp(g)
    pixels[i + 2] = clamp(b)
    pixels[i + 3] = clamp(a)


def fill_rect(pixels: bytearray, x0: int, y0: int, x1: int, y1: int, color: tuple[int, int, int, int]) -> None:
    r, g, b, a = color
    x0 = max(0, x0)
    y0 = max(0, y0)
    x1 = min(W, x1)
    y1 = min(H, y1)
    for y in range(y0, y1):
        row_start = (y * W + x0) * 4
        for x in range(x0, x1):
            i = row_start + (x - x0) * 4
            pixels[i + 0] = r
            pixels[i + 1] = g
            pixels[i + 2] = b
            pixels[i + 3] = a


def draw_rounded_square(pixels: bytearray, margin: int, radius: int, color: tuple[int, int, int, int]) -> None:
    r, g, b, a = color
    x0, y0 = margin, margin
    x1, y1 = W - margin, H - margin

    # Fill center areas
    fill_rect(pixels, x0 + radius, y0, x1 - radius, y1, color)
    fill_rect(pixels, x0, y0 + radius, x1, y1 - radius, color)

    # Corners: naive circle fill
    rr = radius * radius
    corners = [
        (x0 + radius, y0 + radius),
        (x1 - radius - 1, y0 + radius),
        (x0 + radius, y1 - radius - 1),
        (x1 - radius - 1, y1 - radius - 1),
    ]
    for cx, cy in corners:
        for dy in range(-radius, radius + 1):
            for dx in range(-radius, radius + 1):
                if dx * dx + dy * dy <= rr:
                    set_px(pixels, cx + dx, cy + dy, r, g, b, a)


def draw_logo_b(pixels: bytearray) -> None:
    # A simple blocky "B" using rectangles.
    white = (245, 247, 255, 255)
    x = 350
    y = 270
    w = 340
    h = 500
    stroke = 70

    # Main stem
    fill_rect(pixels, x, y, x + stroke, y + h, white)

    # Top bowl
    fill_rect(pixels, x, y, x + w, y + stroke, white)
    fill_rect(pixels, x + w - stroke, y, x + w, y + h // 2, white)
    fill_rect(pixels, x, y + h // 2 - stroke, x + w, y + h // 2, white)

    # Bottom bowl
    fill_rect(pixels, x, y + h // 2, x + w, y + h // 2 + stroke, white)
    fill_rect(pixels, x + w - stroke, y + h // 2, x + w, y + h, white)
    fill_rect(pixels, x, y + h - stroke, x + w, y + h, white)

    # Punch out holes by painting them transparent (background will show).
    # We'll fake a "hole" by painting a slightly darker transparent fill.
    # (True hole isn't necessary for a decent-looking icon.)


def main() -> None:
    pixels = bytearray(W * H * 4)

    # Transparent background already (all zeros)

    # Rounded square base
    base = (70, 110, 255, 255)  # blue
    draw_rounded_square(pixels, margin=90, radius=160, color=base)

    # Accent stripe
    accent = (20, 25, 55, 140)
    fill_rect(pixels, 90, 740, W - 90, 820, accent)

    # Simple "B"
    draw_logo_b(pixels)

    # Encode PNG (RGBA, 8-bit)
    raw_rows = bytearray()
    stride = W * 4
    for y in range(H):
        raw_rows.append(0)  # no filter
        start = y * stride
        raw_rows.extend(pixels[start : start + stride])

    compressed = zlib.compress(bytes(raw_rows), level=9)

    signature = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", W, H, 8, 6, 0, 0, 0)

    png = (
        signature
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", compressed)
        + chunk(b"IEND", b"")
    )

    with open("app-icon.png", "wb") as f:
        f.write(png)

    print("Wrote app-icon.png")


if __name__ == "__main__":
    main()

